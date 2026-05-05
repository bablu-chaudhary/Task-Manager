# Team Task Manager

A full-stack collaborative task management app with role-based access (Admin/Member).

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: SQLite (file-based, zero setup)
- **Auth**: JWT
- **Deployment**: Render (backend) + Vercel (frontend)

## Features

- Signup / Login with JWT authentication
- Create projects (creator becomes Admin)
- Admin: add/remove members, create/edit/delete tasks
- Member: view and update assigned tasks
- My Tasks page — all tasks assigned to you across projects
- Dashboard: total tasks, by status, per user, overdue list

## Local Setup

### Prerequisites
- Node.js 18+

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Deployment (Free)

### Backend → Render

1. Go to [render.com](https://render.com) → Sign up free
2. New → **Web Service** → Connect GitHub → select `Task-Manager`
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `node src/index.js`
4. Environment Variables:
   ```
   DATABASE_URL   = file:./dev.db
   JWT_SECRET     = taskflow-secret-2024
   PORT           = 5000
   FRONTEND_URL   = https://YOUR-VERCEL-URL.vercel.app
   ```
5. Click **Create Web Service** — free tier, no credit card

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
2. New Project → Import `Task-Manager`
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
4. Environment Variables:
   ```
   VITE_API_URL = https://YOUR-RENDER-URL.onrender.com/api
   ```
5. Click **Deploy**

### Connect them

- Copy your Render backend URL → paste into Vercel `VITE_API_URL`
- Copy your Vercel frontend URL → paste into Render `FRONTEND_URL`
- Redeploy both if needed

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/signup | — | Register |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | ✓ | Current user |
| GET | /api/projects | ✓ | List my projects |
| POST | /api/projects | ✓ | Create project |
| PATCH | /api/projects/:id | Admin | Update project |
| GET | /api/projects/:id | ✓ | Project detail + tasks |
| POST | /api/projects/:id/members | Admin | Add member |
| DELETE | /api/projects/:id/members/:userId | Admin | Remove member |
| DELETE | /api/projects/:id | Admin | Delete project |
| GET | /api/tasks/my | ✓ | My assigned tasks |
| POST | /api/tasks | Admin | Create task |
| PATCH | /api/tasks/:id | ✓ | Update task |
| DELETE | /api/tasks/:id | Admin | Delete task |
| GET | /api/dashboard | ✓ | Dashboard stats |
