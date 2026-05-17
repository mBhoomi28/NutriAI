import { chatJson } from "../_shared/ai.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FoodRecognition = {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: string;
  confidence: "low" | "medium" | "high";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return json({ error: "imageBase64 required" }, 400);
    }

    const model = Deno.env.get("AI_VISION_MODEL") ?? Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
    const result = await chatJson<FoodRecognition>({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition vision expert. Return only valid JSON with name, portion, calories, protein_g, carbs_g, fat_g, ingredients, and confidence. Use realistic estimates.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this food and estimate one serving of nutrition." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
    });

    return json(result);
  } catch (e) {
    if (e instanceof Response) return withCors(e);
    console.error("recognize-food error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const withCors = (response: Response) =>
  new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: { ...Object.fromEntries(response.headers.entries()), ...corsHeaders },
  });
