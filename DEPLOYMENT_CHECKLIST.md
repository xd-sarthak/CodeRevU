# 🚀 Quick Vercel Deployment Checklist

Use this as a quick reference. For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

## ✅ Pre-Deployment

- [ ] GitHub repository pushed
- [ ] Vercel account created
- [ ] Production database ready (Neon/Supabase/Railway)
- [ ] GitHub OAuth App created (production URLs)
- [ ] Google AI API key obtained
- [ ] Pinecone index created (768 dimensions, cosine metric)
- [ ] Inngest account setup
- [ ] Secrets generated (`openssl rand -hex 32`)

## 🔧 Deployment Steps

1. **Import to Vercel**
   - Root Directory: `my-app`
   - Framework: Next.js (auto-detected)

2. **Add Environment Variables**
   ```
   DATABASE_URL
   GITHUB_CLIENT_ID
   GITHUB_CLIENT_SECRET
   GITHUB_WEBHOOK_SECRET
   APP_BASE_URL
   BETTER_AUTH_URL
   BETTER_AUTH_SECRET
   NEXT_PUBLIC_BETTER_AUTH_URL
   GOOGLE_GENERATIVE_AI_API_KEY
   PINECONE_API_KEY
   PINECONE_INDEX_NAME
   INNGEST_EVENT_KEY
   INNGEST_SIGNING_KEY
   NODE_ENV=production
   ```

3. **Deploy & Get URL**

4. **Update Environment Variables**
   - Replace placeholder URLs with actual Vercel URL
   - Redeploy

5. **Update GitHub OAuth App**
   - Homepage: `https://your-app.vercel.app`
   - Callback: `https://your-app.vercel.app/api/auth/callback/github`

6. **Run Database Migrations**
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

7. **Sync Inngest**
   - Add app URL: `https://your-app.vercel.app/api/inngest`

8. **Test Everything**
   - [ ] Sign in with GitHub
   - [ ] Connect a repository
   - [ ] Create a PR and verify AI review

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check `prisma` in devDependencies |
| Database connection error | Add `?sslmode=require` to DATABASE_URL |
| OAuth redirect mismatch | Verify callback URL matches exactly |
| Webhooks not working | Check GITHUB_WEBHOOK_SECRET matches |
| Inngest functions missing | Manually sync at `/api/inngest` |

## 📚 Full Guide

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed step-by-step instructions.
