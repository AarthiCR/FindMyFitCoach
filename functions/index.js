const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

// Define secrets — these are configured via Firebase CLI
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * AI Proxy Cloud Function
 *
 * Accepts AI prompt requests from authenticated clients,
 * calls Gemini (primary) or OpenAI (fallback) with server-side API keys,
 * and returns the AI response.
 *
 * This keeps API keys secure — they never leave the server.
 */
exports.generateAIResponse = onRequest(
  {
    cors: true,
    secrets: [geminiApiKey, openaiApiKey],
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized — missing auth token" });
      return;
    }

    try {
      const idToken = authHeader.split("Bearer ")[1];
      await admin.auth().verifyIdToken(idToken);
    } catch (authError) {
      console.error("Auth verification failed:", authError.message);
      res.status(401).json({ error: "Unauthorized — invalid auth token" });
      return;
    }

    // Extract request body
    const { prompt, type } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Missing 'prompt' in request body" });
      return;
    }

    console.log(`AI request received — type: ${type || "general"}, prompt length: ${prompt.length}`);

    // Try Gemini first, then fall back to OpenAI
    let result = null;
    let provider = null;

    // Attempt 1: Google Gemini
    const geminiKey = geminiApiKey.value();
    if (geminiKey) {
      try {
        result = await callGemini(geminiKey, prompt);
        provider = "gemini";
        console.log("Gemini response successful");
      } catch (geminiError) {
        console.warn("Gemini failed, trying OpenAI fallback:", geminiError.message);
      }
    } else {
      console.warn("No Gemini API key configured, trying OpenAI");
    }

    // Attempt 2: OpenAI fallback
    if (!result) {
      const openaiKey = openaiApiKey.value();
      if (openaiKey) {
        try {
          result = await callOpenAI(openaiKey, prompt);
          provider = "openai";
          console.log("OpenAI response successful");
        } catch (openaiError) {
          console.error("OpenAI also failed:", openaiError.message);
          res.status(502).json({
            error: "Both AI providers failed",
            details: openaiError.message,
          });
          return;
        }
      } else {
        console.error("No API keys configured for any AI provider");
        res.status(503).json({
          error: "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.",
        });
        return;
      }
    }

    res.status(200).json({
      text: result,
      provider: provider,
    });
  }
);

/**
 * Call Google Gemini API (gemini-1.5-flash)
 */
async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error ${response.status}: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text in Gemini response");
  }

  return text;
}

/**
 * Call OpenAI API (gpt-4o-mini)
 */
async function callOpenAI(apiKey, prompt) {
  const url = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an experienced fitness coach. Respond concisely and helpfully.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error ${response.status}: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No text in OpenAI response");
  }

  return text;
}
