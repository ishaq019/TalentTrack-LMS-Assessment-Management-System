# TalentTrack - Vercel Deployment Options

This is a monorepo containing both client and server. You have two deployment options:

## Option 1: Deploy Server Only (Recommended)

### Method A: Deploy from `server` directory
1. Create a **new repository** with only the server code
2. Copy everything from `TalentTrack/server/` to the new repo
3. Deploy that repository to Vercel

**Steps:**
```bash
# Create a new directory for server deployment
mkdir talenttrack-server
cd talenttrack-server

# Copy server files
cp -r ../TalentTrack/server/* .

# Initialize git
git init
git add .
git commit -m "Initial server deployment"

# Push to GitHub (create repo first on GitHub)
git remote add origin https://github.com/yourusername/talenttrack-server.git
git push -u origin main

# Then deploy via Vercel GUI
```

### Method B: Deploy from monorepo (specify root directory)
1. Push the entire TalentTrack project to GitHub
2. When importing to Vercel, set **Root Directory** to `server`
3. Vercel will only deploy the server folder

**Vercel Settings:**
- Root Directory: `server`
- Framework Preset: Other
- Build Command: (leave empty)
- Output Directory: (leave empty)

---

## Option 2: Deploy Both Client and Server (Two Projects)

### For Server:
- Root Directory: `server`
- Follow documentation in `server/VERCEL_READY.md`

### For Client:
- Root Directory: `client`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Then update:
- Server CORS to include client URL
- Client API URL to point to server URL

---

## Current Setup

```
TalentTrack/
├── .env (root - for local development)
├── client/ (React + Vite frontend)
│   ├── .env (client-specific, if needed)
│   └── .gitignore
├── server/ (Express backend)
│   ├── .env (create from .env.example)
│   ├── .env.example ✅
│   ├── .gitignore ✅
│   ├── vercel.json ✅
│   ├── VERCEL_READY.md ✅
│   ├── README.md ✅
│   └── DEPLOY.md ✅
└── .gitignore ✅
```

---

## Important Notes

### Environment Variables
- **Root `.env`**: Used for local development only
- **Server `.env`**: Should be created from `.env.example` for local server testing
- **Production**: Set all variables in Vercel Dashboard (never commit `.env`)

### Before Deployment
1. ✅ `.gitignore` files are in place (root, client, server)
2. ✅ `.env` files are excluded from Git
3. ✅ Server is configured for Vercel serverless
4. ✅ Documentation is complete

### Recommended Workflow
1. **Server First**: Deploy server to get API URL
2. **Client Second**: Update client with server API URL, then deploy
3. **Update Server**: Add client URL to CORS allowed origins, redeploy

---

## Ready to Deploy? 

Follow the guide in: **[server/VERCEL_READY.md](server/VERCEL_READY.md)**

Quick checklist:
- [ ] MongoDB Atlas ready
- [ ] SMTP credentials ready
- [ ] JWT secrets generated
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Ready to add environment variables

🚀 **Let's deploy!**
