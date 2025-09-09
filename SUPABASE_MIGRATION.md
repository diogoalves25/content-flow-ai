# ContentFlow AI - Supabase Migration Guide

## Overview
This guide helps you migrate ContentFlow AI from SQLite to Supabase PostgreSQL.

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [Supabase.com](https://supabase.com)
2. Create new project named "ContentFlowAI"
3. Note your project URL and anon key

### 1.2 Run Database Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

## Step 2: Environment Configuration

### 2.1 Update .env.local
Replace your current database configuration with:

```env
# Supabase Database (get from Supabase Dashboard > Settings > Database)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Optional: Supabase client configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 2.2 Get Database Credentials
From Supabase Dashboard > Settings > Database:
- **Connection string**: Use for `DATABASE_URL`
- **Direct connection**: Use for `DIRECT_URL` (if using connection pooling)

## Step 3: Deploy Updated Schema

### 3.1 Generate Prisma Client
```bash
npx prisma generate
```

### 3.2 Push Schema to Supabase
```bash
npx prisma db push
```

### 3.3 Test Connection
```bash
npm run dev
```

## Step 4: Vercel Environment Variables

In your Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add/update these variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `DIRECT_URL`: Your Supabase direct connection string
   - `NEXTAUTH_SECRET`: Generate a new secret if needed

## Step 5: Deploy to Production

```bash
git add .
git commit -m "🚀 Migrate to Supabase PostgreSQL database"
git push
```

## What Changed

### Database
- ✅ **SQLite → PostgreSQL**: Modern, scalable database
- ✅ **Row Level Security**: Built-in user data protection
- ✅ **Connection Pooling**: Better performance under load
- ✅ **Real-time subscriptions**: Ready for live features

### Security Improvements
- ✅ **RLS Policies**: Users can only access their own data
- ✅ **Auth Integration**: Works seamlessly with NextAuth.js
- ✅ **Prepared for Scale**: Handle thousands of users

### Features Ready
- ✅ **User Authentication**: NextAuth.js + Supabase
- ✅ **Project Management**: Store and manage content projects
- ✅ **Content Generation**: AI-generated social media content
- ✅ **Usage Tracking**: Monitor API usage and credits
- ✅ **Template System**: Reusable prompt templates

## Troubleshooting

### Connection Issues
- Verify your connection string format
- Check that your IP is allowlisted (Supabase > Settings > Database > Network Restrictions)
- Ensure you're using the correct password

### Migration Errors
- Make sure to run the SQL schema first
- Verify all tables are created in Supabase dashboard
- Check Prisma schema matches the database structure

### Authentication Issues
- Ensure RLS policies are enabled
- Verify NextAuth.js configuration
- Check that auth.uid() is working in your policies

## Next Steps

Once migrated, you can:
1. **Enable Real-time Features**: Use Supabase subscriptions
2. **Add Storage**: Use Supabase Storage for file uploads
3. **Implement Analytics**: Track user behavior with Supabase
4. **Scale Globally**: Use Supabase's global edge functions

Your ContentFlow AI is now powered by enterprise-grade PostgreSQL! 🎉