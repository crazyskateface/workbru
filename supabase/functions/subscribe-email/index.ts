import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PICA_API_KEY = Deno.env.get('PICA_API_KEY');
const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function addToPica(email: string) {
  if (!PICA_API_KEY) {
    throw new Error('Pica API key not configured');
  }

  const response = await fetch('https://api.pica.com/v1/subscribers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PICA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(`Pica API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function addToHubSpot(email: string) {
  if (!HUBSPOT_API_KEY) {
    throw new Error('HubSpot API key not configured');
  }

  const response = await fetch('https://api.hubapi.com/contacts/v1/contact/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: [
        { property: 'email', value: email },
        { property: 'source', value: 'Workbru Waitlist' },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Add to both services in parallel
    const [picaResult, hubspotResult] = await Promise.all([
      addToPica(email),
      addToHubSpot(email),
    ]);

    return new Response(
      JSON.stringify({ 
        message: 'Successfully subscribed to waitlist',
        pica: picaResult,
        hubspot: hubspotResult,
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error processing subscription:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process subscription' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});