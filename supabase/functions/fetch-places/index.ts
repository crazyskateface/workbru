import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Type definitions
interface ImportSession {
  id: string;
  city: string;
  processed_count: number;
  completed_types: string[];
  next_page_tokens: Record<string, string | undefined>;
  last_processed_at: string;
  status: 'in_progress' | 'completed' | 'failed';
}

interface Workspace {
  name: string;
  description: string;
  address: string;
  location: string;
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
const MAX_PLACES_PER_REQUEST = 10; // Reduced for cost optimization
const BATCH_SIZE = 3; // Process places in smaller batches
const RATE_LIMIT_DELAY = 200; // ms between API calls

// Workspace types with priorities
const WORKSPACE_TYPES = {
  HIGH_PRIORITY: ['cafe', 'library', 'coworking_space'],
  MEDIUM_PRIORITY: ['coffee_shop', 'book_store', 'restaurant'],
  LOW_PRIORITY: ['bar', 'shopping_mall']
};

// Keywords for filtering
const EXCLUDE_KEYWORDS = [
  'gas', 'station', 'pharmacy', 'hospital', 'clinic',
  'bank', 'gym', 'fitness', 'school', 'daycare'
];

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

async function getOrCreateImportSession(city: string, resume: boolean): Promise<ImportSession> {
  const { data: existingSession } = await supabase
    .from('import_sessions')
    .select('*')
    .eq('city', city)
    .eq('status', 'in_progress')
    .single();

  if (existingSession && resume) {
    return existingSession;
  }

  const newSession = {
    city,
    processed_count: 0,
    completed_types: [],
    next_page_tokens: {},
    last_processed_at: new Date().toISOString(),
    status: 'in_progress'
  };

  const { data: session, error } = await supabase
    .from('import_sessions')
    .insert([newSession])
    .select()
    .single();

  if (error) throw error;
  return session;
}

async function updateImportSession(id: string, updates: Partial<ImportSession>) {
  const { error } = await supabase
    .from('import_sessions')
    .update({
      ...updates,
      last_processed_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

async function getExistingPlaceIds() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('google_place_id');

  if (error) throw error;
  return new Set(data.map((w: any) => w.google_place_id));
}

async function geocodeCity(city: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`
  );
  
  const data = await response.json();
  
  if (data.status !== 'OK') {
    throw new Error(`Failed to geocode city: ${data.status}`);
  }
  
  return {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng
  };
}

function calculateProgress(session: ImportSession) {
  const allTypes = [
    ...WORKSPACE_TYPES.HIGH_PRIORITY,
    ...WORKSPACE_TYPES.MEDIUM_PRIORITY,
    ...WORKSPACE_TYPES.LOW_PRIORITY
  ];
  
  return {
    typesCompleted: session.completed_types.length,
    totalTypes: allTypes.length,
    percentage: Math.round((session.completed_types.length / allTypes.length) * 100)
  };
}

function isRetryableError(error: any) {
  return error.status === 429 || // Rate limit
         error.status >= 500 || // Server errors
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('ECONNRESET');
}

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
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
    
    const { city, resume = false } = await req.json();
    
    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get or create import session
    const session = await getOrCreateImportSession(city, resume);
    
    // Get remaining workspace types to process
    const allTypes = [
      ...WORKSPACE_TYPES.HIGH_PRIORITY,
      ...WORKSPACE_TYPES.MEDIUM_PRIORITY,
      ...WORKSPACE_TYPES.LOW_PRIORITY
    ];
    
    const remainingTypes = allTypes.filter(type => 
      !session.completed_types.includes(type)
    );

    if (remainingTypes.length === 0) {
      await updateImportSession(session.id, {
        status: 'completed'
      });
      
      return new Response(
        JSON.stringify({ 
          message: 'Import completed successfully',
          session: {
            id: session.id,
            city,
            status: 'completed',
            processed_count: session.processed_count
          }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const currentType = remainingTypes[0];
    const existingPlaceIds = await getExistingPlaceIds();
    
    // Get places for current type
    const places = await retryWithExponentialBackoff(async () => {
      const location = await geocodeCity(city);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${encodeURIComponent(currentType)} in ${encodeURIComponent(city)}&` +
        `location=${location.lat},${location.lng}&` +
        `radius=5000&` +
        `key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }
      
      return await response.json();
    });

    // Filter places
    const filteredPlaces = places.results
      .filter((place: any) => !existingPlaceIds.has(place.place_id))
      .filter((place: any) => {
        const name = place.name.toLowerCase();
        return !EXCLUDE_KEYWORDS.some(keyword => name.includes(keyword));
      })
      .slice(0, MAX_PLACES_PER_REQUEST);

    // Process places in batches
    const workspaces = [];
    for (let i = 0; i < filteredPlaces.length; i += BATCH_SIZE) {
      const batch = filteredPlaces.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (place: any, index: number) => {
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, index * RATE_LIMIT_DELAY));
          
          try {
            const details = await retryWithExponentialBackoff(async () => {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?` +
                `place_id=${place.place_id}&` +
                `fields=name,formatted_address,geometry,photos,opening_hours,rating,types&` +
                `key=${GOOGLE_API_KEY}`
              );
              
              if (!response.ok) {
                throw new Error(`Place Details API error: ${response.status}`);
              }
              
              return await response.json();
            });

            if (!details.result.geometry?.location) {
              return null;
            }

            const location = `POINT(${
              details.result.geometry.location.lng
            } ${
              details.result.geometry.location.lat
            })`;

            return {
              name: details.result.name,
              description: `A workspace located in ${city}`,
              address: details.result.formatted_address,
              location,
              amenities: determineAmenities(details.result.types),
              attributes: determineAttributes(details.result.types, details.result.rating),
              opening_hours: parseOpeningHours(details.result.opening_hours?.weekday_text),
              photos: details.result.photos?.map((photo: any) => 
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
              ) || [],
              google_place_id: place.place_id,
              is_public: true
            };
          } catch (error) {
            console.error(`Error processing place ${place.place_id}:`, error);
            return null;
          }
        })
      );
      
      workspaces.push(...batchResults.filter(Boolean));
    }

    // Insert workspaces
    const { data: insertedWorkspaces, error: insertError } = await supabase
      .from('workspaces')
      .insert(workspaces)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Update session progress
    await updateImportSession(session.id, {
      processed_count: session.processed_count + insertedWorkspaces.length,
      completed_types: [...session.completed_types, currentType],
      next_page_tokens: {
        ...session.next_page_tokens,
        [currentType]: places.next_page_token
      }
    });

    // Calculate cost estimate
    const costEstimate = {
      searchCost: 0.032, // $0.032 per Places API call
      detailsCost: filteredPlaces.length * 0.017, // $0.017 per Place Details call
      total: 0.032 + (filteredPlaces.length * 0.017)
    };

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${insertedWorkspaces.length} workspaces`,
        workspaces: insertedWorkspaces,
        session: {
          id: session.id,
          city,
          currentType,
          processed: insertedWorkspaces.length,
          totalProcessed: session.processed_count + insertedWorkspaces.length,
          progress: calculateProgress(session),
          costEstimate,
          remainingTypes: remainingTypes.length - 1
        }
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Import error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'import_error',
        retryable: isRetryableError(error)
      }),
      { 
        status: error.status || 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

// Helper Functions
function determineAmenities(types: string[]) {
  return {
    wifi: types.includes('cafe') || types.includes('library'),
    coffee: types.includes('cafe') || types.includes('restaurant'),
    food: types.includes('restaurant') || types.includes('cafe'),
    outlets: types.includes('cafe') || types.includes('library'),
    seating: true,
    meetingRooms: types.includes('library') || types.includes('book_store')
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