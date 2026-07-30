# CommsBrain


AI-powered social media comment analysis. Paste a YouTube or Facebook link, raw comments, or a CSV — get an instant summary, sentiment split, topics, keywords, complaints, compliments, common questions, and recommended actions.

Built with Next.js 14 (App Router), plain CSS, and the Anthropic API. No database required.

## Features

- **Paste comments** — one per line
- **Upload CSV** — drag & drop; auto-detects a "comment"/"text" column
- **YouTube import** — up to 1,000 comments from any public video (official Data API)
- **Facebook import** — up to 1,000 comments from public posts (Graph API, optional token)
- **AI analysis** — summary, sentiment %, topics with share, keywords, top complaints & compliments, common questions, suggested improvements, recommended actions
- **History** — last 25 analyses saved in the browser (nothing stored server-side)
- **Sample analysis** — one click, no setup, works as soon as your Anthropic key is set

## 1. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open http://localhost:3000.

### Required keys

| Variable | Needed for | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | All AI analysis | https://console.anthropic.com → API Keys |
| `YOUTUBE_API_KEY` | YouTube tab | https://console.cloud.google.com → create a project → enable **YouTube Data API v3** → Credentials → API key |
| `FACEBOOK_ACCESS_TOKEN` | Facebook tab (optional) | https://developers.facebook.com → create an app → Graph API token with access to the target Page |
| `ANTHROPIC_MODEL` | Optional override | Defaults to `claude-sonnet-4-6` |

Without `FACEBOOK_ACCESS_TOKEN`, the Facebook tab shows a helpful message pointing users to CSV upload instead.

## 2. Deploy to Vercel

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "SocialLens AI"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sociallens-ai.git
   git push -u origin main
   ```
2. Go to https://vercel.com → **Add New → Project** → import the repo. Vercel auto-detects Next.js; keep the defaults.
3. Before deploying, open **Environment Variables** and add `ANTHROPIC_API_KEY` and `YOUTUBE_API_KEY` (and `FACEBOOK_ACCESS_TOKEN` if you have one).
4. Click **Deploy**. Your app will be live at `https://your-project.vercel.app`.

Alternatively, from the CLI: `npm i -g vercel && vercel` and follow the prompts, then add the env vars with `vercel env add`.

> API routes set `maxDuration = 60`. On the Vercel free (Hobby) plan the limit is 60s, which is enough for ~1,000-comment analyses.

## 3. Project structure

```
app/
  page.jsx              # main UI (tabs, inputs, results)
  layout.jsx            # header, footer, fonts
  globals.css           # design system
  api/analyze/route.js  # Claude analysis (server-side, key never exposed)
  api/youtube/route.js  # YouTube Data API v3 comment import
  api/facebook/route.js # Meta Graph API comment import
  history/  pricing/  billing/  about/  privacy/  terms/
```

## 4. Extending it

**Instagram** — Instagram has no public comments API; you must use the Meta Graph API with an Instagram Professional account linked to a Facebook Page, and your app needs `instagram_basic` + `instagram_manage_comments` permissions (App Review required). Once approved, add an `app/api/instagram/route.js` mirroring the Facebook route.

**Sign-in** — DONE in this build: Auth.js v5 with email+password and optional Google sign-in, Neon Postgres for users + per-account analysis history, a 5/day free quota, and a sentiment-over-time chart for signed-in users. Required env vars: `DATABASE_URL` (Neon), `AUTH_SECRET`, and optionally `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` for the Google button.

**Billing (Stripe)** — create Products/Prices for the Creator and Team plans, add an `/api/checkout` route that creates a Checkout Session, and a webhook route to record subscription status. Wire the Pricing page buttons to `/api/checkout`.

**Server-side history** — swap localStorage for Vercel Postgres or KV, keyed by user ID once auth exists.

## Notes

- Comments are truncated to 1,000 items / ~120k characters per analysis to stay fast and within limits.
- The analysis endpoint normalizes sentiment so the bar always sums to 100%.
- No tracking, no cookies, no database in this build.
