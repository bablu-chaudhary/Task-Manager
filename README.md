# Team Task Manager

A full-stack collaborative task management app with role-based access (Admin/Member).

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: SQLite (file-based, zero setup)
- **Auth**: JWT
- **Deployment**: Railway

## Features

- Signup / Login with JWT authentication
- Create projects (creator becomes Admin)
- Admin: add/remove members, create/edit/delete tasks
- Member: view assigned tasks, update task status
- Dashboard: total tasks, tasks by status, tasks per user, overdue count

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

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
# For local dev, the Vite proxy handles /api → localhost:5000
npm run dev
```

## Deployment on Railway

### 1. Create a Railway project

Go to [railway.app](https://railway.app) and create a new project.

### 2. Deploy the Backend

- Click **+ New** → **GitHub Repo** → select your repo
- Set the **Root Directory** to `backend`
- Add environment variables:
  ```
  DATABASE_URL=file:./dev.db
  JWT_SECRET=<a long random string>
  FRONTEND_URL=<your frontend Railway URL>
  PORT=5000
  ```
- Railway will run `npx prisma db push && node src/index.js` on deploy

### 3. Deploy the Frontend

- Click **+ New** → **GitHub Repo** → select your repo again
- Set the **Root Directory** to `frontend`
- Add environment variable:
  ```
  VITE_API_URL=https://<your-backend-railway-url>/api
  ```
- Railway will build with `npm run build` and serve the `dist` folder

### 4. Connect them

Update `FRONTEND_URL` on the backend to match the frontend Railway URL (for CORS), and `VITE_API_URL` on the frontend to point to the backend URL.

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
