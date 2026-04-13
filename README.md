# 🚕 TaxiBot Admin Dashboard

Full-stack admin panel — **frontend + backend deployed together on Vercel**.

## Stack
- **Frontend**: React + Vite + Tailwind + Recharts
- **Backend**: Node.js + Express (Vercel serverless functions)
- **Database**: PostgreSQL (Railway)

---

## Deploy to Vercel (everything at once)

### 1. Push to GitHub
Push the entire `taxi-bot-admin/` folder to a GitHub repo.

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import repo
2. **Root Directory**: leave as `/` (repo root)
3. Vercel auto-detects `vercel.json` — no framework preset needed
4. Add these **Environment Variables**:
   ```
   DATABASE_URL = postgresql://postgres:FTXVHEyUmXiSBraRmmSMTZPPNwgmRQHU@postgres.railway.internal:5432/railway
   SECRET_KEY   = any_random_string
   ```
5. Click **Deploy** ✓

That's it. Frontend and backend ship as one project.

---

## Local Development

**Backend:**
```bash
cd backend
npm install
DATABASE_URL=your_db_url SECRET_KEY=secret node server.js
# runs on http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# runs on http://localhost:5173
# /api calls are proxied to localhost:8000 automatically
```

---

## Login
| Username | Password |
|----------|----------|
| admin | admin123 |

---

## How it works on Vercel

```
vercel.json
├── buildCommand   → builds frontend/dist
├── outputDirectory → serves frontend/dist as static site
└── rewrites
    ├── /api/*     → backend/api/index.js  (serverless function)
    └── /*         → index.html            (SPA fallback)
```

All API calls from the frontend go to `/api/...` which Vercel routes
to the Express serverless function. No separate backend deployment needed.
