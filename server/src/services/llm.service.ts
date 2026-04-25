import type { AgentName } from "../utils/enums";

export type LlmProvider = "gemini" | "groq" | "structured_fallback";

export interface LlmResult<T> {
  provider: LlmProvider;
  data: T;
  rawText?: string;
  error?: string;
}

interface LlmRequest<T> {
  agentName: AgentName;
  goal: string;
  input: unknown;
  outputContract: string;
  fallback: () => T | Promise<T>;
}

const geminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function buildPrompt(request: Omit<LlmRequest<unknown>, "fallback">): string {
  return [
    `You are ${request.agentName}, an emergency dispatch reasoning agent in CrisisWeave.`,
    `Goal: ${request.goal}`,
    "Return ONLY valid JSON. No markdown. No prose outside JSON.",
    `Output contract: ${request.outputContract}`,
    "Input:",
    JSON.stringify(request.input, null, 2)
  ].join("\n\n");
}

function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM response did not contain a JSON object.");
    }
    return JSON.parse(match[0]) as T;
  }
}

async function callGemini<T>(prompt: string): Promise<{ data: T; rawText: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  return { data: parseJsonObject<T>(rawText), rawText };
}

async function callGroq<T>(prompt: string): Promise<{ data: T; rawText: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: groqModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are an emergency dispatch reasoning agent. Return only strict JSON."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Groq request failed with ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = body.choices?.[0]?.message?.content || "";
  if (!rawText) {
    throw new Error("Groq returned an empty response.");
  }

  return { data: parseJsonObject<T>(rawText), rawText };
}

export async function reasonWithLlmOrFallback<T>(request: LlmRequest<T>): Promise<LlmResult<T>> {
  const prompt = buildPrompt(request);
  const errors: string[] = [];

  try {
    const gemini = await callGemini<T>(prompt);
    return { provider: "gemini", data: gemini.data, rawText: gemini.rawText };
  } catch (error) {
    errors.push(`Gemini: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  try {
    const groq = await callGroq<T>(prompt);
    return { provider: "groq", data: groq.data, rawText: groq.rawText };
  } catch (error) {
    errors.push(`Groq: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  return {
    provider: "structured_fallback",
    data: await request.fallback(),
    error: errors.join(" | ")
  };
}
