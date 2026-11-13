# Shivam Academy Result Portal

A production-ready **Student Examination Results & Scorecard Portal** built for **Shivam Academy for Navoday & Sainik School**.

---

## 🏛️ Architecture

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript
- **Backend API:** Node.js, Express, TypeScript, JWT Authentication, Helmet, CORS
- **Database:** PostgreSQL on Railway with connection pooling and SSL

---

## 🌟 Features

- **Cadet Result Verification:** Fast search by Student Name or Roll Number (e.g. `NS-101`).
- **Top Scorers & Merit Rankers:** Hall of Fame showing top rankers with toggleable Top 3 / Top 5 views.
- **Administrator Dashboard (`/admin`):**
  - Secure JWT authentication.
  - Add new student examination records with auto-incrementing roll numbers.
  - In-place Edit and Delete controls.
  - Real-time synchronization with cloud database.
- **Connection Indicator:** Live badge displaying connection status to Railway PostgreSQL (`🟢 Cloud DB`).

---

## 🚀 Deployment (Railway)

This repository is structured for zero-configuration deployment on [Railway](https://railway.app):

1. **PostgreSQL Database:** Provision a managed PostgreSQL instance.
2. **Backend Service (`/backend`):**
   - Root Directory: `/backend`
   - Pre-deploy Command: `npm run setup`
   - Healthcheck Path: `/api/health`
   - Variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET`, `NODE_ENV=production`
3. **Frontend Service (`/`):**
   - Root Directory: `/`
   - Variables: `NEXT_PUBLIC_API_URL` (points to your Railway backend URL)

---

## 💻 Local Development

### Backend:
```bash
cd backend
npm install
npm run dev
```

### Frontend:
```bash
npm install
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) for the frontend and [http://localhost:3000](http://localhost:3000) for the backend API.
