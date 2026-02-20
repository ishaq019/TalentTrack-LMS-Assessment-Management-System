<!-- =========================
TalentTrack — README
Banner uses local import-style reference:
Place your banner image at: client/src/assets/banner.png
Or update the path below to match your setup.
========================= -->

<p align="center">
  <img src="./client/src/assets/banner.png" alt="TalentTrack Banner" width="100%" />
</p>

<h1 align="center">🎓 TalentTrack — LMS & Assessment Management System</h1>

<p align="center">
  A full-stack Learning Management + Assessment platform for quizzes, coding tests, assignments, submissions, and reporting — built for teams and training programs.
</p>

<p align="center">
  <a href="https://syedishaq.me/TalentTrack-LMS-Assessment-Management-System/"><b>🚀 Live Demo</b></a>
  ·
  <a href="https://talent-track-lms-assessment-managem.vercel.app/health"><b>✅ API Health</b></a>
  ·
  <a href="https://github.com/ishaq019/TalentTrack-LMS-Assessment-Management-System"><b>📦 Repository</b></a>
</p>

---

## 📚 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Key Features](#-key-features)
- [🧱 Tech Stack](#-tech-stack)
- [📁 Monorepo Structure](#-monorepo-structure)
- [⚙️ Installation](#️-installation)
- [🔐 Environment Variables](#-environment-variables)
- [▶️ Running Locally](#️-running-locally)
- [🧪 API Endpoints](#-api-endpoints)
- [🌍 Deployment](#-deployment)
- [🧰 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📬 Contact](#-contact)
- [⭐ Support](#-support)

---

## ✨ Overview

**TalentTrack** is a monorepo containing:

- **Client**: React + Vite frontend (TailwindCSS, React Router, Axios)
- **Server**: Node.js + Express backend (MongoDB, JWT auth, OTP email verification, rate limiting, security headers)
- **Deployments supported**:
  - Frontend on **GitHub Pages** (Live Demo above)
  - Backend on **Vercel** (serverless wrapper)

**Backend health check** ✅  
`https://talent-track-lms-assessment-managem.vercel.app/health`

---

## 🚀 Key Features

| Area | Features ✅ |
|------|------------|
| 🔐 Authentication | OTP email verification, login, refresh tokens, forgot/reset password |
| 👥 Roles | Role-based access control (**admin** / **user**) |
| 🧩 Assessments | Quiz + coding assessments, scoring and evaluation |
| 📝 Assignments | Admin assigns tests, users start & submit assignments |
| 📊 Dashboards | Admin overview stats + user dashboard progress |
| 📦 Submissions | View submissions; admins can review assignment results |
| 🗓️ Reports | Monthly report endpoint + email report trigger |
| 🛡️ Security | Helmet headers, rate limiting, CORS allowlist (Vercel + GitHub Pages) |
| ⚡ Deployment-ready | Vercel serverless setup + GitHub Pages workflow included |

---

## 🧱 Tech Stack

| Layer | Tech |
|------|------|
| Frontend | React 18, Vite, TailwindCSS, React Router, Axios |
| Backend | Node.js (>= 18), Express, Mongoose |
| Auth/Security | JWT, Refresh Tokens, bcrypt, helmet, express-rate-limit, zod validation |
| Email | Nodemailer (SMTP: Gmail App Password supported) |
| Hosting | GitHub Pages (Client), Vercel (API), GitHub Actions (Pages deploy) |

---

## 📁 Monorepo Structure

```text
TalentTrack-LMS-Assessment-Management-System/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── assets/          # Put banner here (banner.png)
│   │   ├── config/api.js    # API base URL config (prod + local toggle)
│   │   ├── state/auth.jsx   # Auth context, token storage, refresh logic
│   │   ├── pages/           # Auth/User/Admin pages
│   │   └── ui/              # Layouts/components
│   ├── DEPLOY.md            # Frontend deployment guide
│   └── package.json
├── server/                 # Express backend
│   ├── api/index.js         # Vercel serverless handler
│   ├── src/
│   │   ├── server.js        # App setup, middleware, CORS, routes
│   │   └── routes/          # auth/admin/user routes
│   ├── .env.example         # Required env template
│   ├── vercel.json          # Vercel routes + headers
│   ├── VERCEL_READY.md      # Vercel-ready checklist
│   └── DEPLOY.md            # Quick deploy checklist
├── .github/workflows/
│   └── deploy-pages.yml     # GitHub Pages deploy workflow (client build + deploy)
├── DEPLOYMENT_GUIDE.md      # Deployment options summary
└── README.md                # (This file)
```

---

## ⚙️ Installation

### ✅ Prerequisites

- Node.js **>= 18** (recommended: **20** for local)
- MongoDB Atlas (or local MongoDB)
- SMTP credentials (Gmail App Password recommended for quick start)

### 📦 Clone & Install

```bash
git clone https://github.com/ishaq019/TalentTrack-LMS-Assessment-Management-System.git
cd TalentTrack-LMS-Assessment-Management-System
```

Install dependencies:

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

---

## 🔐 Environment Variables

Create your backend env file:

```bash
cd server
cp .env.example .env
```

### 🧾 Server `.env` reference

| Variable | Required | Example | Notes |
|---|---:|---|---|
| `MONGO_URI` | ✅ | `mongodb+srv://...` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | `min 32 chars...` | Strong random secret |
| `JWT_REFRESH_SECRET` | ✅ | `min 32 chars...` | Must be different from access secret |
| `PORT` | ⛔ | `8080` | Local only (Vercel ignores) |
| `NODE_ENV` | ✅ | `production` | Use `development` for local |
| `SMTP_HOST` | ✅ | `smtp.gmail.com` | Your SMTP provider host |
| `SMTP_PORT` | ✅ | `587` | TLS commonly `587` |
| `SMTP_USER` | ✅ | `you@gmail.com` | Email user |
| `SMTP_PASS` | ✅ | `app-password` | Gmail App Password recommended |
| `EMAIL_FROM` | ✅ | `TalentTrack` | Sender label |
| `FRONTEND_URL` | ⚠️ | `https://syedishaq.me/TalentTrack-LMS-Assessment-Management-System/` | Used for CORS + email links |
| `JOBS_ENABLED` | ⚠️ | `false` | Recommended `false` on Vercel serverless |

---

## ▶️ Running Locally

### 1) Start Backend (Express)

```bash
cd server
npm run dev
```

Backend runs on: `http://localhost:8080`  
Health check: `http://localhost:8080/health`

### 2) Start Frontend (Vite)

```bash
cd client
npm run dev -- --host
```

Frontend runs on: `http://localhost:5173`

### 3) Switch client API to local backend

Edit:

`client/src/config/api.js`

```js
// export const API_BASE_URL = "https://talent-track-lms-assessment-managem.vercel.app";
export const API_BASE_URL = "http://localhost:8080";
```

---

## 🧪 API Endpoints

> Base URL (Prod): `https://talent-track-lms-assessment-managem.vercel.app`

### ❤️ Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |

### 🔐 Auth (`/auth`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Signup → sends OTP to email |
| POST | `/auth/verify-otp` | Verify OTP → activates account + returns tokens |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/login` | Login → returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh tokens (rotation) |
| POST | `/auth/forgot-password` | Send reset OTP |
| POST | `/auth/reset-password` | Verify OTP + set new password |

### 👤 User / Me (`/me`) — requires auth

| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Current user profile |
| GET | `/me/dashboard` | User dashboard stats |
| GET | `/me/assignments` | List my assignments |
| POST | `/me/assignments/:assignmentId/start` | Start assignment |
| GET | `/me/assignments/:assignmentId` | Assignment details |
| POST | `/me/assignments/:assignmentId/submit` | Submit assignment |
| GET | `/me/practice-tests` | List practice tests |
| POST | `/me/practice/start` | Start practice session |
| GET | `/me/submissions` | List my submissions |
| GET | `/me/submissions/:assignmentId` | Submission details by assignment |
| GET | `/me/reports/monthly` | Monthly report |
| POST | `/me/reports/monthly/email` | Email monthly report |

### 🛠️ Admin (`/admin`) — requires `role=admin`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/tests` | Create a test |
| GET | `/admin/tests` | List tests |
| PATCH | `/admin/tests/:id/toggle` | Toggle test active/inactive |
| POST | `/admin/assignments` | Assign a test to users |
| GET | `/admin/assignments` | List assignments |
| GET | `/admin/users` | List users (filter by role) |
| GET | `/admin/submissions` | List all submissions |
| GET | `/admin/submissions/:assignmentId` | Submission details per assignment |
| GET | `/admin/overview` | Admin dashboard stats |

---

## 🌍 Deployment

### ✅ Current Deployment (as configured)

| Component | URL | Platform |
|---|---|---|
| Frontend | `https://syedishaq.me/TalentTrack-LMS-Assessment-Management-System/` | GitHub Pages (custom domain) |
| Backend | `https://talent-track-lms-assessment-managem.vercel.app` | Vercel |

### Backend on Vercel (Server)

1. Deploy the `server` directory as the **root directory** in Vercel:
   - **Root Directory:** `server`
   - **Framework Preset:** `Other`
2. Add env variables from `server/.env.example` in the Vercel dashboard.
3. Test:
   ```bash
   curl https://<your-vercel-app>.vercel.app/health
   ```

Repo docs:
- `server/VERCEL_READY.md`
- `server/DEPLOY.md`
- `DEPLOYMENT_GUIDE.md`

### Frontend on GitHub Pages (Client)

This repo includes a GitHub Actions workflow to build and deploy `client/dist` to GitHub Pages:
- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: pushes to `main`

---

## 🧰 Troubleshooting

| Issue | Common Cause | Fix ✅ |
|---|---|---|
| CORS error | Wrong `FRONTEND_URL` | Set `FRONTEND_URL` to your deployed frontend URL |
| Email not sent | Incorrect SMTP or Gmail password | Use Gmail App Password, verify host/port |
| 401 Unauthorized | Expired access token | Ensure refresh endpoint is reachable; re-login |
| MongoDB connect fail | Atlas whitelist / bad URI | Check IP allowlist and connection string |

---

## 🤝 Contributing

Contributions are welcome! 🙌

1. Fork the repo  
2. Create a feature branch: `git checkout -b feature/amazing-feature`  
3. Commit changes: `git commit -m "Add amazing feature"`  
4. Push: `git push origin feature/amazing-feature`  
5. Open a Pull Request  

---

## 📄 License

Add your license here (MIT/Apache-2.0/GPL/etc).  
If you haven’t decided yet, a common choice for open source is **MIT**.

---

## 📬 Contact

Author: **Ishaq**  
Repo: `https://github.com/ishaq019/TalentTrack-LMS-Assessment-Management-System`

---

## ⭐ Support

If you find this project useful, please consider starring it on GitHub 🌟
