// Import from Deno's standard library
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
const MAX_PLACES_PER_REQUEST = 25;

// Coffee chains to include in search
const COFFEE_CHAINS = [
  'coffee shop',
  'Starbucks',
  'Peet\'s Coffee',
  '7 Brew Coffee',
  'Dunkin\'',
  'Tim Horton\'s',
];

// Other workspace types
const WORKSPACE_TYPES = [
  'library',
  'coworking space'
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
    .update(updates)
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

function calculateProgress(session: ImportSession, totalTypes: string[]) {
  return {
    typesCompleted: session.completed_types.length,
    totalTypes: totalTypes.length,
    percentage: Math.round((session.completed_types.length / totalTypes.length) * 100)
  };
}

function isRetryableError(error: any) {
  return error.status === 429 || // Rate limit
         error.status >= 500 || // Server errors
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('ECONNRESET');
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
    
    const { city, batchSize = 10, resume = false } = await req.json();
    
    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get or create import session
    const session = await getOrCreateImportSession(city, resume);
    
    // Smart type selection - prioritize high-value types
    const prioritizedTypes = prioritizeSearchTypes(COFFEE_CHAINS, WORKSPACE_TYPES);
    const remainingTypes = prioritizedTypes.filter(type => 
      !session.completed_types.includes(type)
    );

    if (remainingTypes.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Import already completed for this city' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const currentType = remainingTypes[0];
    const existingPlaceIds = await getExistingPlaceIds();
    
    // Phase 1: Get candidate places (cheaper API call)
    const candidates = await getCandidatePlaces(city, currentType, session.next_page_tokens[currentType]);
    
    // Phase 2: Smart filtering before expensive calls
    const filteredCandidates = candidates.places
      .filter(place => !existingPlaceIds.has(place.place_id))
      .filter(isLikelyWorkspace)
      .slice(0, batchSize);

    if (filteredCandidates.length === 0) {
      // Mark this type as completed and move to next
      await updateImportSession(session.id, {
        completed_types: [...session.completed_types, currentType]
      });
      
      return new Response(
        JSON.stringify({ 
          message: `No new places found for ${currentType} in ${city}`,
          nextType: remainingTypes[1] || null,
          progress: calculateProgress(session, prioritizedTypes)
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Phase 3: Fetch details with rate limiting and error handling
    const workspaces = await processPlacesWithRetry(filteredCandidates, city);
    
    // Phase 4: Bulk insert successful workspaces
    const insertedWorkspaces = await bulkInsertWorkspaces(workspaces.filter(Boolean));
    
    // Update session progress
    await updateImportSession(session.id, {
      processed_count: session.processed_count + insertedWorkspaces.length,
      last_processed_at: new Date().toISOString(),
      next_page_tokens: {
        ...session.next_page_tokens,
        [currentType]: candidates.nextPageToken
      }
    });

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${insertedWorkspaces.length} workspaces`,
        workspaces: insertedWorkspaces,
        session: {
          city,
          currentType,
          processed: insertedWorkspaces.length,
          totalProcessed: session.processed_count + insertedWorkspaces.length,
          remainingTypes: remainingTypes.length - (candidates.nextPageToken ? 0 : 1),
          progress: calculateProgress(session, prioritizedTypes),
          hasMore: remainingTypes.length > 1 || candidates.nextPageToken,
          costEstimate: calculateCostEstimate(session)
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
async function getCandidatePlaces(city: string, type: string, nextPageToken: string | null = null) {
  const location = await geocodeCity(city);
  
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    radius: '5000',
    type: type.replace(/\s+/g, '_').toLowerCase(),
    key: GOOGLE_API_KEY!
  });
  
  if (nextPageToken) {
    params.set('pagetoken', nextPageToken);
    // Wait for token to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      places: data.results,
      nextPageToken: data.next_page_token
    };
  } catch (error) {
    if (error.status === 429) {
      // Rate limited - wait and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      return getCandidatePlaces(city, type, nextPageToken);
    }
    throw error;
  }
}

function isLikelyWorkspace(place: any) {
  const name = (place.name || '').toLowerCase();
  const types = place.types || [];
  
  // Exclude obvious non-workspaces
  const excludeKeywords = [
    'gas station', 'pharmacy', 'hospital', 'bank', 
    'car wash', 'auto repair', 'liquor', 'dispensary'
  ];
  
  if (excludeKeywords.some(keyword => name.includes(keyword))) {
    return false;
  }
  
  // Include likely workspaces
  const includeKeywords = [
    'coffee', 'cafe', 'library', 'coworking', 'study', 
    'book', 'tea', 'wifi', 'laptop'
  ];
  
  const hasWorkspaceType = types.some(type => 
    ['cafe', 'library', 'book_store', 'university'].includes(type)
  );
  
  const hasWorkspaceName = includeKeywords.some(keyword => 
    name.includes(keyword)
  );
  
  return hasWorkspaceType || hasWorkspaceName;
}

async function processPlacesWithRetry(candidates: any[], city: string) {
  const results = [];
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (place, index) => {
      await new Promise(resolve => setTimeout(resolve, index * 200));
      
      try {
        return await fetchPlaceDetailsWithRetry(place.place_id, city);
      } catch (error) {
        console.error(`Failed to process place ${place.place_id}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (i + BATCH_SIZE < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

async function fetchPlaceDetailsWithRetry(placeId: string, city: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,photos,opening_hours,rating,types,business_status,price_level,website,formatted_phone_number&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Place Details API error: ${response.status}`);
      }
      
      const data = await response.json();
      const details = data.result;

      if (!details.geometry?.location?.lat || !details.geometry?.location?.lng) {
        return null;
      }

      const location = `POINT(${details.geometry.location.lng} ${details.geometry.location.lat})`;

      return {
        name: details.name,
        description: `A workspace located in ${city}`,
        address: details.formatted_address,
        location,
        amenities: determineAmenities(details.types, details.business_status),
        attributes: determineAttributes(details.types, details.rating, details.price_level),
        opening_hours: parseOpeningHours(details.opening_hours?.weekday_text),
        photos: details.photos?.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
        ) || [],
        google_place_id: placeId,
        is_public: true,
        website: details.website,
        phone: details.formatted_phone_number
      };
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed to fetch place details after ${maxRetries} attempts`);
}

function determineAmenities(types: string[], businessStatus?: string) {
  return {
    wifi: types.includes('cafe') || types.includes('library'),
    coffee: types.includes('cafe') || types.includes('restaurant'),
    food: types.includes('restaurant') || types.includes('cafe'),
    outlets: types.includes('cafe') || types.includes('library'),
    seating: true,
    meetingRooms: types.includes('library') || types.includes('book_store')
  };
}

function determineAttributes(types: string[], rating?: number, priceLevel?: number) {
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

function prioritizeSearchTypes(coffeeChains: string[], workspaceTypes: string[]) {
  const highValue = ['cafe', 'library', 'coworking_space'];
  const mediumValue = [...coffeeChains];
  const lowValue = workspaceTypes.filter(type => !highValue.includes(type));
  
  return [...highValue, ...mediumValue, ...lowValue];
}

async function bulkInsertWorkspaces(workspaces: Workspace[]) {
  if (workspaces.length === 0) return [];
  
  const { data, error } = await supabase
    .from('workspaces')
    .insert(workspaces)
    .select();

  if (error) {
    console.error('Bulk insert error:', error);
    return await insertWorkspacesIndividually(workspaces);
  }

  return data;
}

async function insertWorkspacesIndividually(workspaces: Workspace[]) {
  const results = [];
  
  for (const workspace of workspaces) {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([workspace])
        .select()
        .single();
        
      if (!error && data) {
        results.push(data);
      }
    } catch (error) {
      console.error('Individual insert error:', error);
    }
  }
  
  return results;
}

function calculateCostEstimate(session: ImportSession) {
  const placeSearchCost = 0.032;
  const placeDetailsCost = 0.017;
  
  const estimatedSearches = session.processed_count * 1.2;
  const detailsCalls = session.processed_count;
  
  return {
    searchCost: estimatedSearches * placeSearchCost,
    detailsCost: detailsCalls * placeDetailsCost,
    total: (estimatedSearches * placeSearchCost) + (detailsCalls * placeDetailsCost)
  };
}