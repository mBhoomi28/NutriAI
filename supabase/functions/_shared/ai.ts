export type ChatMessage = {
  role: "system" | "user";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
};

type ChatOptions = {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
};

const getAiConfig = () => {
  const apiKey = Deno.env.get("AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("AI_API_KEY or OPENAI_API_KEY is not configured");
  }

  const baseUrl = (Deno.env.get("AI_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
  return { apiKey, baseUrl };
};

export const chatJson = async <T>({ messages, model, temperature = 0.2 }: ChatOptions): Promise<T> => {
  const { apiKey, baseUrl } = getAiConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("AI provider error:", response.status, detail);
    if (response.status === 401) throw new Error("AI provider rejected the API key");
    if (response.status === 429) throw new Error("AI provider rate limit exceeded. Try again shortly.");
    throw new Error("AI provider request failed");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("AI provider returned an empty response");
  }

  return parseJson<T>(content);
};

const parseJson = <T>(content: string): T => {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed) as T;
};
