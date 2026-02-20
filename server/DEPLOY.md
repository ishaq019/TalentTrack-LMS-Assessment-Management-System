# TalentTrack Backend - Quick Deploy Checklist

## ✅ Pre-Deployment Checklist

### Environment Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist set to 0.0.0.0/0 (allow all)
- [ ] Connection string copied
- [ ] SMTP credentials ready (Gmail App Password or other)
- [ ] JWT secrets generated (32+ chars each)

### Code Ready
- [x] vercel.json configured
- [x] api/index.js serverless handler ready
- [x] CORS configured for Vercel URLs
- [x] Environment validation setup
- [x] .gitignore includes .env
- [x] .vercelignore created

## 🚀 Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Vercel Import
- Go to https://vercel.com/new
- Click "Import Project"
- Select your GitHub repository
- Root Directory: `server` (if monorepo) or `.` (if separate)
- Click "Deploy"

### 3. Add Environment Variables in Vercel
Go to Project Settings → Environment Variables and add:

```
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=your-secret-here-min-32-chars
JWT_REFRESH_SECRET=different-secret-min-32-chars
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=TalentTrack <noreply@talenttrack.com>
FRONTEND_URL=https://your-frontend.vercel.app
JOBS_ENABLED=false
NODE_ENV=production
```

### 4. Redeploy
After adding env vars, trigger a new deployment

### 5. Test
```bash
curl https://your-project.vercel.app/health
```

## 📋 Post-Deployment

### Update Frontend
Update frontend API URL to: `https://your-project.vercel.app`

### Seed Data
Create admin user via API:
```bash
curl -X POST https://your-project.vercel.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "password": "StrongPass123!",
    "role": "admin"
  }'
```

### Monitor
- Check Vercel deployment logs
- Monitor MongoDB Atlas metrics
- Test all API endpoints

## 🔧 Troubleshooting

**Function timeout?** 
- Add indexes to MongoDB collections
- Optimize queries
- Upgrade Vercel plan

**CORS errors?**
- Add frontend URL to environment variables
- Check ALLOWED_ORIGINS in server.js

**Database connection fails?**
- Verify IP whitelist (0.0.0.0/0)
- Check connection string format
- Test connection string locally first

**Emails not sending?**
- Gmail: Use App Password, not regular password
- Check SMTP settings
- Verify port (587 for TLS, 465 for SSL)

## ✨ Your Backend is Ready!

API URL: `https://your-project.vercel.app`
Health Check: `https://your-project.vercel.app/health`
