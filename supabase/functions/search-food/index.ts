import { chatJson } from "../_shared/ai.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FoodSearch = {
  foods: Array<{
    name: string;
    serving: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return json({ error: "query required" }, 400);
    }

    const model = Deno.env.get("AI_TEXT_MODEL") ?? Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
    const result = await chatJson<FoodSearch>({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition database. Return only valid JSON shaped as {\"foods\":[...]}. Include exactly 5 realistic matches with name, serving, calories, protein_g, carbs_g, and fat_g.",
        },
        { role: "user", content: `Food query: ${query}` },
      ],
    });

    return json({ foods: Array.isArray(result.foods) ? result.foods : [] });
  } catch (e) {
    if (e instanceof Response) return withCors(e);
    console.error("search-food error:", e);
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
