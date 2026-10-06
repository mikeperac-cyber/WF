export type AiProvider = "gemini" | "openai" | "anthropic" | "openrouter";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  temperature: number;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "gemini",
  apiKey: "",
  model: "gemini-2.0-flash",
  temperature: 0.7,
};

export const PROVIDER_MODELS: Record<AiProvider, { label: string; models: string[] }> = {
  gemini: {
    label: "Google Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  openai: {
    label: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  },
  anthropic: {
    label: "Anthropic Claude",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
  },
  openrouter: {
    label: "OpenRouter (Universal)",
    models: ["google/gemini-2.0-flash-001", "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet"],
  },
};

/**
 * Execute real client-side AI completion using user's BYOK API key with 15s timeout
 */
export async function executeAiCompletion(
  prompt: string,
  systemInstruction: string,
  config: AiConfig
): Promise<{ text: string; latencyMs: number }> {
  const startTime = performance.now();

  if (!config.apiKey || !config.apiKey.trim()) {
    throw new Error("No API key provided. Please configure your BYOK key in AI Settings.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // 1. Google Gemini
    if (config.provider === "gemini") {
      const model = config.model || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: config.temperature ?? 0.7,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API Error (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
      const latencyMs = Math.round(performance.now() - startTime);
      return { text, latencyMs };
    }

    // 2. OpenAI / OpenRouter (OpenAI Compatible)
    if (config.provider === "openai" || config.provider === "openrouter") {
      const endpoint =
        config.provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model || (config.provider === "openrouter" ? "google/gemini-2.0-flash-001" : "gpt-4o"),
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
          ],
          temperature: config.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "No response generated.";
      const latencyMs = Math.round(performance.now() - startTime);
      return { text, latencyMs };
    }

    // 3. Anthropic Claude (Direct CORS client)
    if (config.provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model || "claude-3-5-sonnet-20241022",
          max_tokens: 1500,
          system: systemInstruction,
          messages: [{ role: "user", content: prompt }],
          temperature: config.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Anthropic API Error (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || "No response generated.";
      const latencyMs = Math.round(performance.now() - startTime);
      return { text, latencyMs };
    }

    throw new Error(`Unsupported AI Provider: ${config.provider}`);
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("AI request timed out (15s limit). Please check your internet connection.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
