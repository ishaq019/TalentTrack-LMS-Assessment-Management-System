# TalentTrack Client - Deployment Guide

## ✅ Backend Integration Complete

Your frontend is now configured to use the deployed backend:
- **API URL:** `https://talent-track-lms-assessment-managem.vercel.app`
- **Configuration:** [src/config/api.js](src/config/api.js)
- **No environment variables needed** - API URL is hardcoded in the app

---

## 🚀 Deploy Frontend to Vercel

### Quick Deploy via Vercel GUI

1. **Prepare the Project**
   ```bash
   cd client
   npm install  # Ensure dependencies are installed
   npm run build  # Test build locally
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for frontend deployment"
   git push
   ```

3. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - **Framework Preset:** Vite
   - **Root Directory:** `client` (if monorepo) or `.` (if separate repo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Click "Deploy"

4. **No Environment Variables Needed!**
   The API URL is already configured in the code.

---

## 🌐 Alternative Deployment Options

### Netlify
1. Go to https://netlify.com
2. Drag and drop the `dist` folder after running `npm run build`
3. Or connect GitHub repo with these settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
   ```json
   "homepage": "https://yourusername.github.io/talenttrack",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Update vite.config.js:
   ```javascript
   export default {
     base: '/talenttrack/'
   }
   ```
4. Run: `npm run deploy`

### Cloudflare Pages
1. Go to https://pages.cloudflare.com
2. Connect GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`

---

## 🔧 Switch Between Local and Production API

Edit [src/config/api.js](src/config/api.js):

```javascript
// For Production (deployed backend)
export const API_BASE_URL = "https://talent-track-lms-assessment-managem.vercel.app";

// For Local Development (comment production, uncomment below)
// export const API_BASE_URL = "http://localhost:8080";
```

---

## ✅ Pre-Deployment Checklist

- [x] Backend API integrated
- [x] API URL configured in code (no env vars needed)
- [x] CORS already configured on backend (allows *.vercel.app)
- [x] Build tested locally
- [x] Routes configured
- [x] Assets optimized

---

## 🧪 Test Your Deployment

After deploying, test these features:

1. **Health Check**
   - Open browser console
   - App should connect to backend automatically

2. **Authentication**
   - Try signup/login
   - Check if JWT tokens are stored

3. **User Flow**
   - Login as user
   - View assignments
   - Take a test
   - View results

4. **Admin Flow**
   - Login as admin
   - Create assignments
   - View submissions

---

## 📱 Frontend Features

- ✅ React 18 + Vite
- ✅ TailwindCSS styling
- ✅ React Router for navigation
- ✅ Axios for API calls
- ✅ JWT authentication
- ✅ Role-based routing (Admin/User)
- ✅ Responsive design
- ✅ Code editor for coding tests
- ✅ Real-time timer
- ✅ Toast notifications

---

## 🎯 Default Admin Credentials

After backend deployment, create admin via backend:
- Email: `syedishaq0123@gmail.com` (or as configured)
- Password: `Ishaq@123` (or as configured)

Or use the signup API to create a new admin user.

---

## 🔐 CORS Configuration

The backend is already configured to accept requests from:
- ✅ All `*.vercel.app` domains (your frontend will work automatically)
- ✅ Localhost (for development)
- ✅ GitHub Pages (`*.github.io`)

No additional configuration needed!

---

## 🎉 You're Ready to Deploy!

**Simple Steps:**
1. Push code to GitHub
2. Connect to Vercel
3. Set Root Directory to `client`
4. Deploy
5. Done! 🚀

Your TalentTrack LMS is production-ready!

---

## 📞 Need Help?

- **Deployment Issues:** Check Vercel build logs
- **API Errors:** Verify backend URL in browser console
- **CORS Errors:** Backend already accepts Vercel domains
- **Build Fails:** Run `npm run build` locally to debug

---

## 🔄 Switching API for Local Development

When developing locally:

1. Edit `src/config/api.js`:
   ```javascript
   export const API_BASE_URL = "http://localhost:8080";
   ```

2. Start local backend:
   ```bash
   cd ../server
   npm run dev
   ```

3. Start frontend:
   ```bash
   cd client
   npm run dev
   ```

Access at: http://localhost:5173

---

**Happy Deploying! 🎊**
