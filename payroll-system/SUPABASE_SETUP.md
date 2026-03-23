# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Spectro Payroll
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
5. Click "Create new project" (takes ~2 minutes)

## Step 2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" or press Ctrl+Enter
5. You should see "Success. No rows returned"

This creates:
- `employees` table (stores employee data)
- `payroll_records` table (stores payroll history)
- Indexes for better performance
- Row Level Security policies
- Auto-update triggers

## Step 3: Get API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

### For Local Development:

1. Create a `.env` file in the `payroll-system` folder:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace with your actual values from Step 3

### For Vercel Deployment:

You'll add these in Vercel's dashboard (see VERCEL_DEPLOY.md)

## Step 5: Test Connection

1. Start your dev server:
```bash
npm run dev
```

2. Open http://localhost:5173
3. You should see 4 sample employees load automatically
4. Try adding a new employee - it should save to Supabase!

## Verify Data in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. Click on `employees` table
3. You should see your data there!

## Troubleshooting

### "Failed to load employees"
- Check your `.env` file has correct values
- Make sure you ran the SQL schema
- Check browser console for specific errors

### "Insert failed"
- Verify RLS policies are enabled (they're in the schema)
- Check that all required fields are filled

### Sample data not loading
- Check browser console for errors
- Verify the `employees` table exists
- Try manually inserting a row in Table Editor

## Security Notes

- The `.env` file is gitignored (never commit it!)
- The anon key is safe to use in frontend (it's public)
- RLS policies control what data can be accessed
- For production, consider adding authentication

## Next Steps

Once Supabase is working locally, proceed to `VERCEL_DEPLOY.md` to deploy online!
