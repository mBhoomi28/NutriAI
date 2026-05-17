import { chatJson } from "../_shared/ai.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RecipeSearch = {
  recipes: Array<{
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    prep_minutes: number;
    ingredients: string[];
    steps: string[];
    diet_tags: string[];
  }>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { query = "", maxCalories = 800, diet = "any" } = await req.json().catch(() => ({}));

    const model = Deno.env.get("AI_TEXT_MODEL") ?? Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
    const result = await chatJson<RecipeSearch>({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a nutritionist chef. Return only valid JSON shaped as {\"recipes\":[...]}. Include exactly 5 healthy recipes with calories, macros, prep_minutes, ingredients, steps, and diet_tags.",
        },
        {
          role: "user",
          content: `Suggest ${diet === "any" ? "" : diet} recipes${query ? ` matching ${query}` : ""} under ${Number(maxCalories) || 800} calories per serving.`,
        },
      ],
    });

    return json({ recipes: Array.isArray(result.recipes) ? result.recipes : [] });
  } catch (e) {
    if (e instanceof Response) return withCors(e);
    console.error("get-recipes error:", e);
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
