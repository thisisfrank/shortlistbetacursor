import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req) => {
  console.log(`Test function called: ${req.method}`)
  
  return new Response(JSON.stringify({ 
    status: "test_success",
    message: "Simple test function working",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
})