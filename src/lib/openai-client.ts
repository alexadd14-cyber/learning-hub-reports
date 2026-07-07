export interface OpenAIConfig {
  apiKey?: string;
  baseUrl: string;
  textModel: string;
  visionModel: string;
}

export function getOpenAIConfig(): OpenAIConfig {
  const sharedModel = process.env.OPENAI_MODEL;

  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
      /\/$/,
      ""
    ),
    textModel:
      process.env.OPENAI_TEXT_MODEL ?? sharedModel ?? "gpt-4o-mini",
    visionModel:
      process.env.OPENAI_VISION_MODEL ?? sharedModel ?? "gpt-4o",
  };
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
}

type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };

function toImageDataUrl(base64: string): string {
  if (base64.startsWith("data:")) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

export async function openaiChat(options: {
  model: string;
  prompt: string;
  images?: string[];
  json?: boolean;
}): Promise<string> {
  const { apiKey, baseUrl } = getOpenAIConfig();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const messageContent: string | OpenAIContentPart[] = options.images?.length
    ? [
        { type: "text", text: options.prompt },
        ...options.images.map((image) => ({
          type: "image_url" as const,
          image_url: { url: toImageDataUrl(image), detail: "high" as const },
        })),
      ]
    : options.prompt;

  const body: Record<string, unknown> = {
    model: options.model,
    messages: [{ role: "user", content: messageContent }],
  };

  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data = (await response.json()) as OpenAIChatResponse;

  if (data.error?.message) {
    throw new Error(`OpenAI error: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content;
}

export function parseJsonContent<T>(content: string): T {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as T;
}
