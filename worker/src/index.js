/**
 * FSE API Proxy Worker
 *
 * Securely proxies requests to Gemini API without exposing the API key.
 * The GEMINI_API_KEY is stored as a Cloudflare secret, not in code.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Verify origin
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',');

    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed.trim()))) {
      return new Response('Forbidden: Invalid origin', { status: 403 });
    }

    // Parse the request URL to get the endpoint
    const url = new URL(request.url);
    const endpoint = url.pathname;

    // Route to appropriate handler
    if (endpoint === '/api/gemini/generate') {
      return handleGeminiGenerate(request, env, origin);
    }

    return new Response('Not found', { status: 404 });
  }
};

async function handleGeminiGenerate(request, env, origin) {
  try {
    // Check for API key
    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: 'API key not configured' }, 500, origin);
    }

    // Get request body
    const body = await request.json();

    // Validate request has required fields
    if (!body.contents) {
      return jsonResponse({ error: 'Missing contents field' }, 400, origin);
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: body.contents,
        generationConfig: body.generationConfig || {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    // Get response
    const responseData = await geminiResponse.json();

    // Check for errors
    if (!geminiResponse.ok) {
      console.error('Gemini API error:', responseData);
      return jsonResponse({
        error: responseData.error?.message || 'Gemini API error',
        status: geminiResponse.status
      }, geminiResponse.status, origin);
    }

    return jsonResponse(responseData, 200, origin);

  } catch (error) {
    console.error('Worker error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, origin);
  }
}

function handleCORS(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',');

  const responseOrigin = allowedOrigins.some(allowed => origin?.startsWith(allowed.trim()))
    ? origin
    : allowedOrigins[0];

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': responseOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
