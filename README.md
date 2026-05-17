# NutriAI

## Local development

Run the app with:

```bash
npm install
npm run dev
```

The Vite dev server should be available at `http://localhost:8080`.

Create a local `.env` from `.env.example` and fill in your Supabase project URL and publishable/anon key.

## Supabase setup

This app is designed to run directly against Supabase, not the Lovable preview runtime.

1. Apply the SQL migrations in `supabase/migrations`.
2. Deploy the Edge Functions:
   ```bash
   supabase functions deploy recognize-food
   supabase functions deploy search-food
   supabase functions deploy get-recipes
   ```
3. Set AI provider secrets for the functions:
   ```bash
   supabase secrets set AI_API_KEY=your_api_key
   supabase secrets set AI_BASE_URL=https://api.openai.com/v1
   supabase secrets set AI_TEXT_MODEL=gpt-4o-mini
   supabase secrets set AI_VISION_MODEL=gpt-4o-mini
   ```

The Edge Functions require a signed-in Supabase user and use `AI_API_KEY`/`OPENAI_API_KEY` instead of Lovable's AI gateway.

## Google login on localhost

The app now uses Supabase's native Google OAuth flow for local sign-in. To make Google login work outside Lovable preview, you need both of these configured in your Supabase project:

1. In `Supabase Dashboard -> Authentication -> URL Configuration`, add:
   - `http://localhost:8080/auth`
   - your production callback URL, for example `https://your-domain.com/auth`
2. In `Supabase Dashboard -> Authentication -> Providers -> Google`, make sure your Google OAuth app includes Supabase's callback URL:
   - `https://qagexcflwcuisqcamlpi.supabase.co/auth/v1/callback`

If your local dev server uses a different port, replace `8080` with that port in the allowed redirect URL.
