// Supabase Edge Function: golf-course-search
// Proxies golfcourseapi.com so the API key never reaches the browser.
// Requires the caller to be a signed-in Supabase Auth user (verify_jwt = true).
//
// This has already been deployed to your Supabase project. This copy is
// here purely so it lives in version control alongside the rest of the app.
//
// Usage from the app:
//   const { data, error } = await supabase.functions.invoke('golf-course-search', {
//     body: { courseName: 'Royal Pines' }
//   })

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOLF_API_KEY = Deno.env.get("GOLF_COURSE_API_KEY") ?? "";
const GOLF_API_BASE = "https://api.golfcourseapi.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { courseName } = await req.json();

    if (!courseName || typeof courseName !== "string") {
      return new Response(
        JSON.stringify({ error: "courseName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GOLF_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOLF_COURSE_API_KEY secret is not configured on this project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upstream = await fetch(
      `${GOLF_API_BASE}/search?search_query=${encodeURIComponent(courseName)}`,
      {
        headers: {
          Authorization: `Key ${GOLF_API_KEY}`,
        },
      }
    );

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
