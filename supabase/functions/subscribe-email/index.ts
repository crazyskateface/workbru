import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the incoming request body for email
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

    // Get secrets from environment variables
    const PICA_API_KEY = Deno.env.get("PICA_API_KEY");
    const HUBSPOT_CONNECTION_KEY = Deno.env.get("HUBSPOT_CONNECTION_KEY");
    const ACTION_ID = "conn_mod_def::GDcIHDalaS8::eEv4pjvCTcuDT-052kCSgg"; // Create Contact

    if (!PICA_API_KEY || !HUBSPOT_CONNECTION_KEY) {
      throw new Error('API keys not configured');
    }

    // Prepare the contact data with only standard HubSpot properties
    const contactData = {
      properties: {
        email,
        // Use standard HubSpot properties or create custom ones in HubSpot first
        company: "Workbru Waitlist", // Standard property
        // Remove lifecycle_stage and source for now
      }
    };

    console.log('Creating HubSpot contact via Pica for:', email);

    // Pica passthrough endpoint for creating a HubSpot contact
    const picaUrl = "https://api.picaos.com/v1/passthrough/crm/v3/objects/contacts";

    // Make the request to Pica
    const response = await fetch(picaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pica-secret": PICA_API_KEY,
        "x-pica-connection-key": HUBSPOT_CONNECTION_KEY,
        "x-pica-action-id": ACTION_ID
      },
      body: JSON.stringify(contactData)
    });

    console.log('Pica API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pica API Error:', errorText);
      
      throw new Error(
        `Pica API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log('HubSpot contact created successfully:', result);

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