# LegitCheck PH — Deploy in 15 Minutes

## What you need (all free to start)

| Service | What for | Link |
|---------|----------|------|
| Supabase | Database + Auth | supabase.com |
| Anthropic | AI agents | console.anthropic.com |
| Vercel | Hosting | vercel.com |
| GitHub | Code repo | github.com |

---

## Step 1 — Supabase (5 min)

1. Go to **supabase.com** → New project
2. Pick a name (e.g. `legitcheck-ph`), set a DB password, choose **Singapore** region
3. Wait ~2 min for it to spin up
4. Go to **Project Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

5. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`
6. Run `supabase/migrations/002_share_links.sql`

7. Go to **Authentication → Providers** → enable **Google**:
   - Create a Google Cloud project at console.cloud.google.com
   - Enable Google+ API → OAuth 2.0 credentials
   - Authorized redirect URI: `https://[your-project].supabase.co/auth/v1/callback`
   - Paste Client ID and Secret into Supabase

---

## Step 2 — Anthropic API Key (2 min)

1. Go to **console.anthropic.com**
2. API Keys → Create key
3. Copy it — this is your `ANTHROPIC_API_KEY`

---

## Step 3 — Local setup (2 min)

```bash
cd legitcheck-ph
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000 ✅

---

## Step 4 — Deploy to Vercel (5 min)

### Option A: GitHub + Vercel (recommended)

```bash
# Push to GitHub
git init
git add .
git commit -m "LegitCheck PH initial"
gh repo create legitcheck-ph --public --push
```

Then:
1. Go to **vercel.com** → Import → select your repo
2. Framework: **Next.js** (auto-detected)
3. Add environment variables (copy from your `.env.local`)
4. Click **Deploy**

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

Follow prompts, add env vars when asked.

---

## Step 5 — Post-deploy Supabase config

After you have your Vercel URL (e.g. `legitcheck-ph.vercel.app`):

1. Supabase → **Authentication → URL Configuration**
   - Site URL: `https://legitcheck-ph.vercel.app`
   - Redirect URLs: `https://legitcheck-ph.vercel.app/auth/callback`

2. Vercel → Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` to `https://legitcheck-ph.vercel.app`
   - Redeploy

---

## Step 6 — Custom domain (optional)

1. Buy `legitcheck.ph` at a PH domain registrar (e.g. DotPH, Namecheap)
2. Vercel → Settings → Domains → Add `legitcheck.ph`
3. Follow DNS instructions (add CNAME or A record)
4. Update Supabase Site URL and Redirect URLs to `https://legitcheck.ph`
5. Update `NEXT_PUBLIC_APP_URL` to `https://legitcheck.ph`

---

## Quick test checklist after deploy

- [ ] Home page loads
- [ ] Sign up with email works (check email for confirmation)
- [ ] Sign up with Google works
- [ ] Paste FB seller example → run check → get result
- [ ] Result shows Green/Yellow/Red card
- [ ] Copy report works
- [ ] Share link generates
- [ ] Seller dispute flow works
- [ ] AI agents respond (FraudGuard, QA Rex, etc.)
- [ ] Seller help + appeal copy works
- [ ] Privacy policy page loads

---

## Costs at scale

| Service | Free tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, 50K auth users | $25/mo Pro |
| Vercel | 100GB bandwidth | $20/mo Pro |
| Anthropic | Pay per token | ~₱0.50–₱2 per AI chat |
| Domain | — | ~₱1,500/yr for .ph |

**Total at MVP launch: ~₱0/mo** (all free tiers)
**At 1,000 users: ~₱2,500/mo** (Supabase Pro + Anthropic tokens)

---

## Support

Email: support@legitcheck.ph
Privacy: privacy@legitcheck.ph
