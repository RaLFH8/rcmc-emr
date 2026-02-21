# RCMC EMR - Quick Start (5 Minutes)

## 1. Install Dependencies (1 min)

```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
npm install
```

## 2. Set Up Supabase (2 min)

1. Go to [supabase.com](https://supabase.com) → Your Project
2. SQL Editor → New Query
3. Copy/paste contents of `supabase-schema.sql`
4. Click "Run"

## 3. Configure Environment (1 min)

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get credentials from: Supabase Dashboard → Settings → API

## 4. Run Development Server (1 min)

```cmd
npm run dev
```

Open `http://localhost:3001`

## ✅ Done!

You should see the MediLens dashboard with:
- 4 stat cards
- Patient statistics chart
- Calendar widget
- Recent patients table

## Deploy to Cloudflare (Optional)

```cmd
npm run build
```

Then upload `dist` folder to Cloudflare Pages.

---

**Need help?** Check `SETUP_GUIDE.md` for detailed instructions.
