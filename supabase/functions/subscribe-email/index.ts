import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PICA_API_KEY = Deno.env.get('PICA_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
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
    body: JSON.stringify({ 
      email,
      source: 'Workbru Waitlist',
      tags: ['waitlist', 'pre-launch']
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `Pica API error: ${response.status} ${response.statusText}${
        errorData ? ` - ${JSON.stringify(errorData)}` : ''
      }`
    );
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const result = await addToPica(email);

    return new Response(
      JSON.stringify({ 
        message: 'Successfully subscribed to waitlist',
        data: result
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