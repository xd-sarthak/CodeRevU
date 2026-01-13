# 🚀 Vercel Deployment Guide for CodeRevU

This guide provides step-by-step instructions for deploying your CodeRevU application to Vercel.

---

## 📋 Pre-Deployment Checklist

Before deploying to Vercel, ensure you have:

- [ ] A GitHub account with your CodeRevU repository pushed
- [ ] A Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] A PostgreSQL database (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))
- [ ] GitHub OAuth App credentials (production URLs)
- [ ] Google AI API key
- [ ] Pinecone account with an index created
- [ ] Inngest account (for background jobs)
- [ ] (Optional) Polar.sh account for payments

---

## 🗄️ Step 1: Setup Production Database

### Option A: Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the **Connection String** (looks like `postgresql://user:password@host/database?sslmode=require`)
4. Save this as your `DATABASE_URL`

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Settings** → **Database**
3. Copy the **Connection String** (URI format)
4. Save this as your `DATABASE_URL`

### Option C: Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** service
3. Copy the **Database URL** from the service variables
4. Save this as your `DATABASE_URL`

---

## 🔑 Step 2: Setup GitHub OAuth App (Production)

You need a **separate** GitHub OAuth App for production (different from your local development app).

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: `CodeRevU Production`
   - **Homepage URL**: `https://your-app-name.vercel.app` (you'll get this after first deploy)
   - **Authorization callback URL**: `https://your-app-name.vercel.app/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it
7. Save these as:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

> **Note**: You'll need to update the URLs after your first deployment with the actual Vercel URL.

---

## 🌲 Step 3: Setup Pinecone Index

1. Go to [pinecone.io](https://www.pinecone.io/) and sign in
2. Create a new index with these settings:
   - **Name**: `coderevu` (or your preferred name)
   - **Dimensions**: `768` (for Google text-embedding-004)
   - **Metric**: `Cosine`
   - **Cloud Provider**: Choose based on your preference
3. Copy your **API Key** from the dashboard
4. Save these as:
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`

---

## ⚡ Step 4: Setup Inngest (Background Jobs)

1. Go to [inngest.com](https://www.inngest.com/) and sign up
2. Create a new app
3. Navigate to **Settings** → **Keys**
4. Copy the **Event Key** and **Signing Key**
5. Save these as:
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`

---

## 🔐 Step 5: Generate Secrets

Run these commands in your terminal to generate secure secrets:

```bash
# For GITHUB_WEBHOOK_SECRET
openssl rand -hex 32

# For BETTER_AUTH_SECRET
openssl rand -hex 32
```

Save the outputs as:
- `GITHUB_WEBHOOK_SECRET`
- `BETTER_AUTH_SECRET`

---

## 🚀 Step 6: Deploy to Vercel

### 6.1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your **CodeRevU** repository from GitHub
4. Vercel will auto-detect it's a Next.js project

### 6.2: Configure Project Settings

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `my-app` ⚠️ **IMPORTANT**
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 6.3: Add Environment Variables

Click **Environment Variables** and add all the following:

#### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# GitHub OAuth & Webhooks
GITHUB_CLIENT_ID=your_production_github_client_id
GITHUB_CLIENT_SECRET=your_production_github_client_secret
GITHUB_WEBHOOK_SECRET=generated_with_openssl_rand_hex_32

# Application URLs (update after first deploy)
APP_BASE_URL=https://your-app-name.vercel.app
BETTER_AUTH_URL=https://your-app-name.vercel.app/api/auth
BETTER_AUTH_SECRET=generated_with_openssl_rand_hex_32
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app-name.vercel.app/api/auth

# AI & Vector Database
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=coderevu

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Node Environment
NODE_ENV=production
```

#### Optional Variables (for Payments)

```env
# Polar.sh (if using payments)
POLAR_ACCESS_TOKEN=your_polar_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_SUCCESS_URL=https://your-app-name.vercel.app/dashboard/subscriptions?success=true
```

> **Tip**: For the first deployment, use placeholder URLs for `APP_BASE_URL`, `BETTER_AUTH_URL`, etc. You'll update these after getting your Vercel URL.

### 6.4: Deploy

1. Click **Deploy**
2. Wait for the build to complete (2-5 minutes)
3. Once deployed, copy your **Vercel URL** (e.g., `https://your-app-name.vercel.app`)

---

## 🔄 Step 7: Update Environment Variables with Production URL

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update the following variables with your actual Vercel URL:
   - `APP_BASE_URL=https://your-app-name.vercel.app`
   - `BETTER_AUTH_URL=https://your-app-name.vercel.app/api/auth`
   - `NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app-name.vercel.app/api/auth`
   - `POLAR_SUCCESS_URL=https://your-app-name.vercel.app/dashboard/subscriptions?success=true` (if using Polar)
4. Click **Save**
5. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

---

## 🔧 Step 8: Update GitHub OAuth App URLs

1. Go back to your [GitHub OAuth App settings](https://github.com/settings/developers)
2. Update the URLs:
   - **Homepage URL**: `https://your-app-name.vercel.app`
   - **Authorization callback URL**: `https://your-app-name.vercel.app/api/auth/callback/github`
3. Click **Update application**

---

## 🗃️ Step 9: Run Database Migrations

You need to run Prisma migrations on your production database.

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   cd my-app
   vercel link
   ```

4. Pull environment variables:
   ```bash
   vercel env pull .env.production
   ```

5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Option B: Using Database Connection String Directly

1. In your local `my-app` directory, create a temporary `.env.production` file:
   ```env
   DATABASE_URL=your_production_database_url
   ```

2. Run migrations:
   ```bash
   npx dotenv -e .env.production -- npx prisma migrate deploy
   ```

3. Delete the `.env.production` file for security

---

## 🔗 Step 10: Setup Inngest Integration

1. Go to your [Inngest dashboard](https://app.inngest.com)
2. Navigate to your app
3. Click **Sync** or **Add App**
4. Enter your Vercel URL: `https://your-app-name.vercel.app/api/inngest`
5. Click **Sync** to register your functions
6. Verify that your functions appear in the dashboard (e.g., `review-pull-request`)

---

## ✅ Step 11: Verify Deployment

### 11.1: Test Authentication

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Click **Sign in with GitHub**
3. Authorize the application
4. Verify you're redirected to the dashboard

### 11.2: Test Repository Connection

1. In the dashboard, go to **Repositories**
2. Click **Connect Repository**
3. Select a test repository
4. Verify the webhook is created in your GitHub repository settings:
   - Go to your repo → **Settings** → **Webhooks**
   - You should see a webhook pointing to `https://your-app-name.vercel.app/api/webhooks/github`

### 11.3: Test AI Review (End-to-End)

1. In your connected repository, create a new branch
2. Make a code change and open a Pull Request
3. Wait 30-60 seconds
4. Check the PR for an AI-generated review comment
5. Verify the review appears in your CodeRevU dashboard under **Reviews**

### 11.4: Check Logs

- **Vercel Logs**: Go to your Vercel project → **Deployments** → Click on latest → **Functions** tab
- **Inngest Logs**: Go to Inngest dashboard → **Runs** to see background job execution

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `Cannot find module 'prisma'`
- **Solution**: Ensure `prisma` is in `devDependencies` in `package.json`

**Error**: `Environment variable validation failed`
- **Solution**: Double-check all required environment variables are set in Vercel

### Database Connection Issues

**Error**: `Can't reach database server`
- **Solution**: Ensure your database allows connections from Vercel IPs (most managed databases do by default)
- **Solution**: Check if your `DATABASE_URL` includes `?sslmode=require` for SSL connections

### GitHub OAuth Not Working

**Error**: `Redirect URI mismatch`
- **Solution**: Verify the callback URL in your GitHub OAuth App matches exactly: `https://your-app-name.vercel.app/api/auth/callback/github`

### Webhooks Not Triggering

**Error**: PR created but no review posted
- **Solution**: Check webhook delivery in GitHub repo settings → Webhooks → Recent Deliveries
- **Solution**: Verify `GITHUB_WEBHOOK_SECRET` matches in both Vercel and your webhook configuration
- **Solution**: Check Inngest dashboard for failed runs

### Inngest Functions Not Syncing

**Error**: Functions don't appear in Inngest dashboard
- **Solution**: Manually trigger a sync: `curl https://your-app-name.vercel.app/api/inngest`
- **Solution**: Check Vercel function logs for errors in `/api/inngest` endpoint

---

## 🔒 Security Checklist

Before going live, ensure:

- [ ] All environment variables are set in Vercel (not in code)
- [ ] `GITHUB_WEBHOOK_SECRET` is a strong random string
- [ ] `BETTER_AUTH_SECRET` is at least 32 characters
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] GitHub OAuth app is set to production URLs only
- [ ] No `.env` files are committed to Git
- [ ] Vercel project is set to **Production** environment

---

## 🎉 You're Live!

Your CodeRevU application is now deployed to Vercel! 

### Next Steps:

1. **Custom Domain** (optional): Add a custom domain in Vercel → **Settings** → **Domains**
2. **Monitoring**: Set up error tracking with [Sentry](https://sentry.io) or similar
3. **Analytics**: Add analytics with Vercel Analytics or Google Analytics
4. **Backups**: Set up automated database backups with your database provider

### Useful Links:

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Inngest Dashboard**: [app.inngest.com](https://app.inngest.com)
- **GitHub OAuth Apps**: [github.com/settings/developers](https://github.com/settings/developers)
- **Pinecone Console**: [app.pinecone.io](https://app.pinecone.io)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Inngest Deployment Guide](https://www.inngest.com/docs/deploy)

---

**Need Help?** Check the [CodeRevU README](./README.md) or open an issue on GitHub.
