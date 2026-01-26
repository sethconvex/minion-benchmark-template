import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

// Import pre-generated manifest (created by scripts/generate-manifest.ts)
import manifest from "./manifest.generated.json";

const http = httpRouter();

// Serve manifest at well-known endpoint
http.route({
  path: "/.well-known/minion-manifest",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify(manifest), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=60",
      },
    });
  }),
});

// CORS preflight handler
http.route({
  path: "/.well-known/minion-manifest",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
