# Vercel Deployment Guide — Step by Step

Deploy in this exact order: **backend → Student-Main → Admin → Teachers-dashboard**

---

## STEP 1 — Deploy Backend

### Vercel Project Settings
- **Root Directory:** `backend`
- **Framework Preset:** Other
- **Build Command:** *(leave empty)*
- **Output Directory:** *(leave empty)*
- **Install Command:** `npm install`

### Environment Variables to add in Vercel Dashboard:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `true` |
| `MONGODB_URI` | `mongodb+srv://moodyelfouly:Qeuv4yxcpygCSG4t@cluster0.5ukqxgo.mongodb.net/ai_teacher?retryWrites=true&w=majority&appName=Cluster0` |
| `ACTIVE_LLM` | `openrouter` |
| `OPENROUTER_API_KEY` | `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` |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `ADMIN_EMAIL` | `admin@site.test` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `NewAdminPass!234` |
| `ADMIN_PASSWORD_FORCE` | `true` |
| `TTS_PROVIDER` | `speechify` |
| `SPEECHIFY_API_KEY` | `sk_f6kw830mr9xm8dd37y51jbaf179sctdgx9jrhx24w8g` |
| `SPEECHIFY_VOICE_ID` | `henry` |
| `SPEECHIFY_MODEL` | `simba-english` |
| `SMTP_TEST_MODE` | `true` |
| `ALLOWED_ORIGINS` | *(fill in after deploying frontends — see Step 4)* |
| `BACKEND_PUBLIC_URL` | *(fill in after first deploy — your backend Vercel URL)* |
| `PUBLIC_BASE_URL` | *(fill in after deploying Student-Main)* |

After deploying, note your backend URL: `https://YOUR-BACKEND.vercel.app`

**Test it:** `https://YOUR-BACKEND.vercel.app/health` → should return `{"status":"ok"}`

---

## STEP 2 — Deploy Student-Main

### Vercel Project Settings
- **Root Directory:** `Student-Main`
- **Framework Preset:** Next.js
- **Build Command:** `next build`
- **Output Directory:** `.next`

### Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.vercel.app/api/v1` |
| `NEXT_PUBLIC_FASTAPI_URL` | *(leave blank or set if you deploy fastapi_service)* |

---

## STEP 3 — Deploy Admin

### Vercel Project Settings
- **Root Directory:** `Admin`
- **Framework Preset:** Next.js

### Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.vercel.app/api/v1` |
| `NEXT_PUBLIC_FASTAPI_URL` | *(leave blank or set if needed)* |

---

## STEP 4 — Deploy Teachers-dashboard

### Vercel Project Settings
- **Root Directory:** `Teachers-dashboard`
- **Framework Preset:** Next.js

### Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.vercel.app/api/v1` |
| `NEXT_PUBLIC_FASTAPI_URL` | *(leave blank or set if needed)* |

---

## STEP 5 — Update Backend CORS & URLs

Go back to your **backend** Vercel project → Settings → Environment Variables and update:

| Variable | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://YOUR-STUDENT.vercel.app,https://YOUR-ADMIN.vercel.app,https://YOUR-TEACHER.vercel.app` |
| `BACKEND_PUBLIC_URL` | `https://YOUR-BACKEND.vercel.app` |
| `PUBLIC_BASE_URL` | `https://YOUR-STUDENT.vercel.app` |

Then **Redeploy** the backend (Deployments → ⋯ → Redeploy).

---

## MongoDB Atlas — Required Network Setting

In MongoDB Atlas → Network Access → add IP: `0.0.0.0/0` (Allow from anywhere)
This is required because Vercel serverless functions use dynamic IPs.

---

## Verify Everything Works

1. `GET https://YOUR-BACKEND.vercel.app/health` → `{"status":"ok","version":"2.0.0"}`
2. Open Student-Main → login page loads without errors
3. Open Admin → login with `admin` / `NewAdminPass!234`
4. Open Teachers-dashboard → login page loads

---

## Common Errors & Fixes

| Error | Fix |
|---|---|
| `MongoServerSelectionError` | Add `0.0.0.0/0` to MongoDB Atlas Network Access |
| `CORS error` in browser | Update `ALLOWED_ORIGINS` in backend env vars and redeploy |
| `401 Unauthorized` on all requests | Cookie `SameSite=None` requires HTTPS — make sure all URLs are `https://` |
| Frontend shows `localhost:8000` | `NEXT_PUBLIC_API_URL` env var not set in Vercel dashboard |
| Backend 500 on first request | Check Vercel function logs — usually a missing env var |
