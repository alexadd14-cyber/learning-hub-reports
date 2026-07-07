export interface OllamaConfig {
  apiKey?: string;
  baseUrl: string;
  textModel: string;
  visionModel: string;
}

export function getOllamaConfig(): OllamaConfig {
  return {
    apiKey: process.env.OLLAMA_API_KEY,
    baseUrl: (process.env.OLLAMA_BASE_URL ?? "https://ollama.com").replace(
      /\/$/,
      ""
    ),
    textModel: process.env.OLLAMA_MODEL ?? "llama3.2",
    visionModel: process.env.OLLAMA_VISION_MODEL ?? "llava",
  };
}

export function getOllamaHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

interface OllamaChatResponse {
  message?: { content?: string };
  error?: string;
}

export async function ollamaChat(options: {
  model: string;
  prompt: string;
  images?: string[];
  json?: boolean;
}): Promise<string> {
  const { apiKey, baseUrl } = getOllamaConfig();

  if (!apiKey && baseUrl.includes("ollama.com")) {
    throw new Error("OLLAMA_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model: options.model,
    messages: [
      {
        role: "user",
        content: options.prompt,
        ...(options.images?.length ? { images: options.images } : {}),
      },
    ],
    stream: false,
  };

  if (options.json) {
    body.format = "json";
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: getOllamaHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Ollama request failed (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data = (await response.json()) as OllamaChatResponse;

  if (data.error) {
    throw new Error(`Ollama error: ${data.error}`);
  }

  const content = data.message?.content;
  if (!content) {
    throw new Error("No response from Ollama");
  }

  return content;
}

export function parseJsonContent<T>(content: string): T {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as T;
}
