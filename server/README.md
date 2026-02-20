# TalentTrack Server - Vercel Deployment Guide

This backend is ready to deploy on Vercel as a serverless function.

## Pre-Deployment Checklist

### 1. **MongoDB Atlas Setup**
- Create a MongoDB Atlas account at https://cloud.mongodb.com
- Create a new cluster (free tier available)
- Create a database user with password
- Whitelist all IPs (0.0.0.0/0) for Vercel deployment
- Get your connection string (MONGO_URI)

### 2. **Email Configuration (SMTP)**
If using Gmail:
- Enable 2-factor authentication on your Google account
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use the generated password for `SMTP_PASS`

Alternative SMTP providers:
- SendGrid (recommended for production)
- Mailgun
- AWS SES

### 3. **Environment Variables**
Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

Required variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - Strong secret (32+ characters)
- `JWT_REFRESH_SECRET` - Different strong secret (32+ characters)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email config
- `FRONTEND_URL` - Your deployed frontend URL

## Deploy to Vercel (GUI Method)

### Step 1: Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Ready for Vercel deployment"

# Create a new repository on GitHub and push
git remote add origin https://github.com/yourusername/talenttrack-server.git
git branch -M main
git push -u origin main
```

### Step 2: Vercel Dashboard
1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `server` (if monorepo) or leave as `.` (if separate repo)
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty

### Step 3: Environment Variables
In Vercel project settings, add all environment variables from your `.env` file:

1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.example`:
   - `MONGO_URI`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `EMAIL_FROM`
   - `FRONTEND_URL`
   - `JOBS_ENABLED=false` (recommended for serverless)
   - `NODE_ENV=production`

3. Make sure to add them for "Production" environment

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Your API will be available at: `https://your-project.vercel.app`

### Step 5: Update Frontend
Update your frontend's API URL to point to:
```
https://your-project.vercel.app
```

### Step 6: Add CORS Origin
After deploying frontend, add its URL to CORS allowed origins in `src/server.js`:
```javascript
const ALLOWED_ORIGINS = [
  "https://your-frontend.vercel.app",
  // ... other origins
];
```

Commit and push to redeploy.

## Testing Your Deployment

Test the health endpoint:
```bash
curl https://your-project.vercel.app/health
```

Should return:
```json
{
  "ok": true,
  "brand": "TalentTrack",
  "service": "lms-assessment-backend",
  "env": "production",
  "time": "2026-02-20T..."
}
```

## Initial Data Seeding

After deployment, you can seed data using the Vercel CLI or create API endpoints:

### Option 1: Local Seeding (Before Deployment)
```bash
npm run seed:admin
npm run seed:tests
```

### Option 2: Create Admin via API
Use the signup endpoint with the admin flag:
```bash
curl -X POST https://your-project.vercel.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

## Troubleshooting

### Function Timeout
Vercel free tier has a 10-second timeout. If requests timeout:
- Optimize database queries
- Add proper indexes to MongoDB collections
- Consider upgrading to Pro plan

### CORS Errors
- Make sure frontend URL is added to ALLOWED_ORIGINS
- Check that credentials: true is set in CORS config

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Ensure database user has proper permissions

### Email Not Sending
- Verify SMTP credentials
- Check if email provider allows less secure apps
- For Gmail, ensure App Password is used, not regular password

## Production Recommendations

1. **Use Environment-Specific Secrets**
   - Different JWT secrets for production
   - Separate database for production

2. **Monitor Your App**
   - Use Vercel Analytics
   - Set up error tracking (Sentry)
   - Monitor MongoDB performance

3. **Security**
   - Rotate JWT secrets regularly
   - Use strong passwords
   - Enable MongoDB encryption at rest

4. **Backup**
   - Enable MongoDB Atlas automated backups
   - Export critical data regularly

## Local Development

To run locally:
```bash
npm install
npm run dev
```

Server runs on http://localhost:8080

## Support

For issues:
- Check Vercel deployment logs
- Review MongoDB Atlas logs
- Check Node.js version compatibility (use Node 18+)
