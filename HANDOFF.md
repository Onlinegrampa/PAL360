# PAL360 — Project Handoff
**Date:** 2026-04-09  
**Status:** Deployed & live — demo-ready  
**Demo target:** PAL Executive Team, Trinidad & Tobago (April 13, 2026)

---

## Live URLs

| Service    | URL                                        | Status |
|------------|--------------------------------------------|--------|
| Frontend   | https://pal-360-ib81.vercel.app            | ✅ Live |
| Backend    | https://pal360-backend.onrender.com        | ✅ Live |
| API Health | https://pal360-backend.onrender.com/health | ✅ Live |
| API Docs   | https://pal360-backend.onrender.com/docs   | ✅ Live |

---

## Demo Credentials

**All accounts share the same password:** `Demo@PAL360!`

| Name              | Email                                | Policies |
|-------------------|--------------------------------------|----------|
| Marcus Williams   | marcus.williams@demo.pal360.tt       | Life, Health, Annuities, PA&S — **use this one for the demo** |
| Priya Ramkissoon  | priya.ramkissoon@demo.pal360.tt      | Life, Health |
| Jerome Alexander  | jerome.alexander@demo.pal360.tt      | Life |

---

## Repository

**GitHub:** https://github.com/Onlinegrampa/PAL360  
**Branch:** `main` (auto-deploys to both Vercel and Render on push)

```
pal360/
  frontend/       → Next.js 14 — deployed to Vercel
  backend/        → FastAPI + uvicorn — deployed to Render
  HANDOFF.md      ← this file
```

---

## Infrastructure

### Frontend — Vercel
- **Project:** pal-360-ib81
- **Root directory:** `frontend`
- **Framework:** Next.js 14 (auto-detected)
- **Build command:** `npm run build` (default)
- **Environment variables set on Vercel:**
  ```
  NEXT_PUBLIC_API_URL = https://pal360-backend.onrender.com
  ```
- **Auto-deploys:** Yes — any push to `main` triggers a redeploy

### Backend — Render
- **Service:** pal360-backend
- **Root directory:** `backend`
- **Runtime:** Python 3.11 (set via `backend/runtime.txt`)
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Instance type:** Free (note: spins down after 15 min inactivity — first request takes ~30s)
- **Environment variables set on Render:**
  ```
  DATABASE_URL   = <Neon PostgreSQL connection string>
  JWT_SECRET_KEY = <your JWT secret>
  ENVIRONMENT    = production
  ```

> ⚠️ **Render free tier cold starts:** If the backend hasn't had a request in 15 minutes it will spin down. The first request after idle takes ~30 seconds. For the demo, open https://pal360-backend.onrender.com/health in a browser tab ~2 minutes before presenting to pre-warm it.

### Database — Neon PostgreSQL
- **Provider:** Neon (neon.tech)
- **Region:** US East 1
- **Connection string:** stored in Render environment variables (never commit to git)
- **Schema:** auto-created on first backend boot via `main.py → _create_tables()`
- **Seed data:** auto-inserted on first boot if `clients` table is empty (`_seed_if_empty()`)

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+

### Start backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Start frontend
```bash
cd frontend
npm install
# .env.local is already present with NEXT_PUBLIC_API_URL=http://localhost:8001
npm run dev      # runs on http://localhost:4001
```

> Port 4001 is intentional — port 3000 is reserved for another local project.

---

## Architecture

```
Browser (Vercel frontend)
    │  HTTPS REST + WebSocket
    ▼
FastAPI backend (Render)
    │  asyncpg / SSL
    ▼
Neon PostgreSQL
```

### Key files

| File | Purpose |
|------|---------|
| `backend/main.py` | App entrypoint, DB init, seed data, CORS config |
| `backend/auth.py` | JWT creation/verification, bcrypt password hashing |
| `backend/db.py` | asyncpg connection pool, Neon SSL handling |
| `backend/routes/auth.py` | `POST /auth/login` |
| `backend/routes/policies.py` | `GET /policies` |
| `backend/routes/claims.py` | `GET /claims`, `GET /claims/{id}`, `WS /ws/claims/{id}` |
| `backend/routes/products.py` | `GET /products` |
| `backend/routes/payments.py` | `POST /payment` (WiPay demo mode) |
| `frontend/lib/api.ts` | Central fetch client — attaches JWT, handles errors |
| `frontend/lib/auth.tsx` | AuthContext — sign in/out, token restore from localStorage |
| `frontend/middleware.ts` | Redirects unauthenticated users to `/login` |
| `frontend/next.config.js` | CSP headers, next-pwa config |

---

## Screens — Build Status

| Screen | Route | Status |
|--------|-------|--------|
| Login | `/login` | ✅ Complete |
| Dashboard | `/dashboard` | ✅ Complete |
| Claims Tracker | `/claims` | ✅ Complete |
| Products Catalog | `/products` | ✅ Complete |
| Payment | `/payment` | ✅ Complete |
| Offline fallback | `/offline` | ✅ Complete |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/auth/login` | No | Returns JWT |
| `GET` | `/policies` | JWT | Policies for logged-in client |
| `GET` | `/claims` | JWT | Claims for logged-in client |
| `GET` | `/claims/{id}` | JWT | Single claim |
| `WS` | `/ws/claims/{id}?token=` | JWT (query param) | Real-time claim stage updates (advances every 8s for demo) |
| `GET` | `/products` | JWT | Full product catalog (28 products) |
| `POST` | `/payment` | JWT | Process premium payment (WiPay demo mode — always succeeds) |

---

## Known Limitations & Next Steps

### For the demo (April 13)
- [ ] Pre-warm backend 2 minutes before demo (visit `/health`)
- [ ] Log in as **Marcus Williams** — he has all 4 policy lines and an active claim
- [ ] The WebSocket on Claims Tracker auto-advances the claim stage every 8 seconds — good for live demo

### Post-demo / V2 work
- [ ] **WiPay live mode:** set `WIPAY_ACCOUNT_NUMBER` + `WIPAY_API_KEY` in Render env vars and uncomment the live block in `backend/routes/payments.py`
- [ ] **Upgrade Render to paid tier** to eliminate cold start delays
- [ ] **Custom domain** — connect `pal360.pal360.tt` or similar to Vercel
- [ ] **PWA install flow** — works in production (Vercel HTTPS), disabled in local dev
- [ ] **MFA on demo accounts** — currently password-only
- [ ] **Upgrade Next.js** from 14.2.3 to latest (security advisory flagged by Vercel)
- [ ] **Push notifications** (V2) — service worker is registered but push is out of scope for V1

---

## Bugs Fixed During This Session

| Bug | Fix |
|-----|-----|
| `Failed to fetch` on login | CSP `connect-src` was missing `localhost:8001` and `*.onrender.com` |
| Frontend port conflict | `npm run dev` pinned to port 4001 in `package.json` |
| Render exit code 3 | `bcrypt==4.0.1` broke `passlib` — downgraded to `3.2.2`; added `runtime.txt` for Python 3.11 |
| Vercel build hang at static page generation | `useSearchParams()` in login page lacked `Suspense` boundary |
| Neon SSL connection | `db.py` updated to strip `sslmode` query param and pass SSL context directly to asyncpg |
