// Import from Deno's standard library
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Type definitions
interface Workspace {
  name: string;
  description: string;
  address: string;
  location: string; // Changed to string for PostGIS POINT format
  amenities: {
    wifi: boolean;
    coffee: boolean;
    food: boolean;
    outlets: boolean;
    seating: boolean;
    meetingRooms: boolean;
  };
  attributes: {
    parking: 'none' | 'street' | 'lot' | 'garage';
    capacity: 'small' | 'medium' | 'large';
    noiseLevel: 'quiet' | 'moderate' | 'loud';
    seatingComfort: number;
    rating: number | null;
    openLate: boolean;
    coffeeRating: number | null;
  };
  opening_hours?: { day: string; open: string; close: string; }[];
  photos?: string[];
  google_place_id?: string;
  is_public?: boolean;
}

// Environment variables with validation
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Constants
const MAX_PLACES_PER_REQUEST = 10; // Reduced from 25 to 10
const RATE_LIMIT_DELAY = 200; // ms between API calls

// Workspace types with priorities
const WORKSPACE_TYPES = {
  PRIMARY: [
    'cafe',
    'coffee_shop',
    'library',
    'coworking_space',
    'book_store'
  ],
  SECONDARY: [
    'restaurant',
    'bakery'
  ]
};

// Excluded types
const EXCLUDED_TYPES = [
  'bar',
  'night_club',
  'lodging',
  'gym',
  'spa',
  'shopping_mall',
  'supermarket',
  'pharmacy',
  'hospital',
  'school',
  'university',
  'car_repair',
  'gas_station',
  'bank',
  'atm'
];

// Excluded keywords
const EXCLUDED_KEYWORDS = [
  'pub', 'club', 'lounge', 'hotel', 'motel', 'resort', 'casino',
  'theater', 'cinema', 'museum', 'gallery', 'stadium', 'arena',
  'park', 'playground', 'zoo', 'aquarium', 'amusement',
  'bowling', 'golf', 'swimming', 'sports',
  'hair', 'barber', 'nail', 'tattoo', 'salon',
  'laundry', 'cleaner', 'car wash', 'tire', 'auto parts', 'dealership',
  'post office', 'police', 'fire station', 'courthouse', 'government',
  'church', 'temple', 'mosque', 'synagogue', 'cemetery', 'funeral'
];

// Minimum rating requirement
const MIN_RATING = 3.5;

// Validate required environment variables
function validateEnvironment() {
  const missing = [];
  
  if (!GOOGLE_API_KEY) missing.push('GOOGLE_PLACES_API_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Initialize Supabase client
let supabase: any;

function initializeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Cannot initialize Supabase client: missing credentials');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Helper function to check if a place should be excluded
function shouldExcludePlace(place: any): boolean {
  // Check for minimum rating
  if (place.rating && place.rating < MIN_RATING) {
    return true;
  }

  // Check excluded types
  if (place.types && place.types.some((type: string) => EXCLUDED_TYPES.includes(type))) {
    return true;
  }

  // Check excluded keywords in name
  const nameLower = place.name.toLowerCase();
  if (EXCLUDED_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return true;
  }

  // For secondary types (restaurants/bakeries), ensure they have cafe-like qualities
  if (
    place.types &&
    place.types.some((type: string) => WORKSPACE_TYPES.SECONDARY.includes(type)) &&
    !place.types.some((type: string) => WORKSPACE_TYPES.PRIMARY.includes(type))
  ) {
    // If it's a secondary type but doesn't have any primary type characteristics, exclude it
    return true;
  }

  return false;
}

async function getExistingPlaceIds() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('google_place_id');

  if (error) throw error;
  return new Set(data.map((w: any) => w.google_place_id));
}

async function fetchPlaceDetails(placeId: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key is not configured');
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,photos,opening_hours,rating,types&key=${GOOGLE_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'ERROR' || data.status === 'INVALID_REQUEST') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`);
  }
  
  return data.result;
}

async function searchPlaces(city: string, type: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key is not configured');
  }

  const query = `${type} in ${city}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'ERROR' || data.status === 'INVALID_REQUEST') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`);
  }
  
  return data.results;
}

function determineAmenities(types: string[]) {
  return {
    wifi: types.includes('cafe') || types.includes('library'),
    coffee: types.includes('cafe') || types.includes('coffee_shop'),
    food: types.includes('restaurant') || types.includes('cafe'),
    outlets: types.includes('cafe') || types.includes('library') || types.includes('coworking_space'),
    seating: true,
    meetingRooms: types.includes('library') || types.includes('coworking_space')
  };
}

function determineAttributes(types: string[], rating?: number) {
  return {
    parking: 'street',
    capacity: 'medium',
    noiseLevel: types.includes('library') ? 'quiet' : 'moderate',
    seatingComfort: 3,
    rating: rating || null,
    openLate: false,
    coffeeRating: types.includes('cafe') ? 4 : null
  };
}

function parseOpeningHours(weekdayText?: string[]) {
  if (!weekdayText) return [];
  
  return weekdayText.map(text => {
    const [day, hours] = text.split(': ');
    if (hours === 'Closed') {
      return { day, open: 'Closed', close: 'Closed' };
    }
    const [open, close] = hours.split(' – ');
    return { day, open, close };
  });
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateEnvironment();
    supabase = initializeSupabase();
    
    const { city } = await req.json();
    
    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const existingPlaceIds = await getExistingPlaceIds();
    let allPlaces: any[] = [];

    // First search for primary types
    for (const type of WORKSPACE_TYPES.PRIMARY) {
      const places = await searchPlaces(city, type);
      allPlaces.push(...places);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }

    // Then search for secondary types
    for (const type of WORKSPACE_TYPES.SECONDARY) {
      const places = await searchPlaces(city, type);
      allPlaces.push(...places);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }

    // Filter and deduplicate places
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(place => [place.place_id, place])).values()
    )
    .filter(place => !existingPlaceIds.has(place.place_id))
    .filter(place => !shouldExcludePlace(place))
    .slice(0, MAX_PLACES_PER_REQUEST);

    // Process places and get details
    const workspaces = await Promise.all(
      uniquePlaces.map(async (place, index) => {
        await new Promise(resolve => setTimeout(resolve, index * RATE_LIMIT_DELAY));
        
        try {
          const details = await fetchPlaceDetails(place.place_id);
          
          if (!details.geometry?.location) {
            return null;
          }

          const location = `POINT(${details.geometry.location.lng} ${details.geometry.location.lat})`;

          const workspace: Workspace = {
            name: details.name,
            description: `A workspace located in ${city}`,
            address: details.formatted_address,
            location,
            amenities: determineAmenities(details.types),
            attributes: determineAttributes(details.types, details.rating),
            opening_hours: parseOpeningHours(details.opening_hours?.weekday_text),
            photos: details.photos?.map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
            ) || [],
            google_place_id: place.place_id,
            is_public: true
          };

          return workspace;
        } catch (error) {
          console.error(`Error processing place ${place.place_id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and insert into database
    const validWorkspaces = workspaces.filter(Boolean);
    
    const { data: insertedWorkspaces, error: insertError } = await supabase
      .from('workspaces')
      .insert(validWorkspaces)
      .select();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${insertedWorkspaces.length} workspaces for ${city}`,
        workspaces: insertedWorkspaces,
        total: uniquePlaces.length,
        processed: insertedWorkspaces.length,
        maxPlacesPerRequest: MAX_PLACES_PER_REQUEST
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});