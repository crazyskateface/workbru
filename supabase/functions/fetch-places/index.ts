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
const MAX_PLACES_PER_REQUEST = 25; // Updated to 25 places per request

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

// Helper functions
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

async function searchPlaces(city: string, type: string, pageToken?: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key is not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const query = `${type} in ${city}`;
  const url = pageToken
    ? `${baseUrl}?pagetoken=${pageToken}&key=${GOOGLE_API_KEY}`
    : `${baseUrl}?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'ERROR' || data.status === 'INVALID_REQUEST') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`);
  }
  
  return {
    placeIds: data.results.map((result: any) => result.place_id),
    nextPageToken: data.next_page_token
  };
}

async function getExistingPlaceIds() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('google_place_id');

  if (error) throw error;
  return new Set(data.map((w: any) => w.google_place_id));
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

function determineAmenities(types: string[]) {
  return {
    wifi: types.includes('cafe') || types.includes('library'),
    coffee: types.includes('cafe') || types.includes('restaurant'),
    outlets: types.includes('cafe') || types.includes('library'),
    seating: true,
    food: types.includes('restaurant') || types.includes('cafe'),
    meetingRooms: types.includes('coworking_space') || types.includes('library'),
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
    coffeeRating: types.includes('cafe') ? 4 : null,
  };
}

// Format location for PostGIS
function formatLocation(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

// Main handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment before processing
    validateEnvironment();
    
    // Initialize Supabase client
    supabase = initializeSupabase();
    
    // Parse request body
    const { city } = await req.json();
    
    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City parameter is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    const placeTypes = ['coffee shop', 'library', 'coworking space'];
    const existingPlaceIds = await getExistingPlaceIds();
    let allNewPlaceIds: string[] = [];
    let nextPageTokens: Record<string, string | undefined> = {};

    // Fetch place IDs from all types
    for (const type of placeTypes) {
      const result = await searchPlaces(city, type);
      allNewPlaceIds.push(...result.placeIds);
      if (result.nextPageToken) {
        nextPageTokens[type] = result.nextPageToken;
      }
    }

    // Filter out existing places
    let uniquePlaceIds = [...new Set(allNewPlaceIds)]
      .filter(id => !existingPlaceIds.has(id));

    // If we have less than MAX_PLACES_PER_REQUEST new places, try to get more using next page tokens
    if (uniquePlaceIds.length < MAX_PLACES_PER_REQUEST) {
      for (const [type, token] of Object.entries(nextPageTokens)) {
        if (token) {
          // Add delay to respect Google Places API pagination token availability
          await new Promise(resolve => setTimeout(resolve, 2000));
          const nextResult = await searchPlaces(city, type, token);
          const newIds = nextResult.placeIds.filter(id => !existingPlaceIds.has(id));
          uniquePlaceIds.push(...newIds);
        }
      }
    }

    // Take only up to MAX_PLACES_PER_REQUEST places
    uniquePlaceIds = uniquePlaceIds.slice(0, MAX_PLACES_PER_REQUEST);
    
    const places = await Promise.all(
      uniquePlaceIds.map(async (placeId) => {
        try {
          const details = await fetchPlaceDetails(placeId);
          
          if (!details.geometry?.location?.lat || !details.geometry?.location?.lng) {
            console.error(`Invalid location data for place ${placeId}`);
            return null;
          }

          const location = formatLocation(
            details.geometry.location.lat,
            details.geometry.location.lng
          );

          const workspace: Workspace = {
            name: details.name,
            description: `A workspace located in ${city}`,
            address: details.formatted_address,
            location,
            amenities: determineAmenities(details.types),
            attributes: determineAttributes(details.types, details.rating),
            opening_hours: parseOpeningHours(details.opening_hours?.weekday_text),
            photos: details.photos?.map(photo => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
            ) || [],
            google_place_id: placeId,
            is_public: true,
          };

          const { data, error } = await supabase
            .from('workspaces')
            .insert([workspace])
            .select()
            .single();

          if (error) {
            console.error('Error inserting workspace:', error);
            return null;
          }

          return data;
        } catch (error) {
          console.error(`Error processing place ${placeId}:`, error);
          return null;
        }
      })
    );

    const successfulPlaces = places.filter(Boolean);

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${successfulPlaces.length} workspaces for ${city}`,
        workspaces: successfulPlaces,
        total: uniquePlaceIds.length,
        processed: successfulPlaces.length,
        hasMore: Object.keys(nextPageTokens).length > 0
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
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
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});