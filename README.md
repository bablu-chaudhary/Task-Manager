# TaskFlow — Team Task Manager

A full-stack collaborative task management web application with role-based access control.

## Live Demo

- **Frontend**: https://task-manager-1-gizd.onrender.com
- **Backend API**: https://task-manager-y7et.onrender.com/api
- **GitHub**: https://github.com/bablu-chaudhary/Task-Manager

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js, Express.js |
| ORM | Prisma |
| Database | SQLite |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Render (frontend + backend) |

---

## Features

### Authentication
- Signup with name, email, password
- Secure login with JWT (7-day expiry)
- Protected routes — unauthenticated users redirected to login

### Project Management
- Create projects (creator automatically becomes Admin)
- Admin can add members by email
- Admin can remove members
- Admin can edit or delete projects
- Members can view all projects they belong to

### Task Management
- Create tasks with title, description, due date, priority (Low/Medium/High)
- Assign tasks to project members
- Update task status: To Do → In Progress → Done
- Admin: full CRUD on tasks
- Member: can only update status of their own assigned tasks

### My Tasks Page
- View all tasks assigned to you across all projects
- Filter by status (All / To Do / In Progress / Done)
- Update status directly from this page

### Dashboard
- Total task count
- Tasks breakdown by status with progress bars
- Tasks per team member with workload chart
- Overdue task count + list of overdue tasks with links

### Role-Based Access
- **Admin**: manage projects, members, and all tasks
- **Member**: view assigned projects, update own task status only

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # DB schema (User, Project, Task)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # signup, login, /me
│   │   │   ├── projects.js      # project CRUD + members
│   │   │   ├── tasks.js         # task CRUD + my tasks
│   │   │   └── dashboard.js     # stats aggregation
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT middleware
│   │   ├── lib/
│   │   │   └── prisma.js        # Prisma client
│   │   └── index.js             # Express app entry
│   ├── .env.example
│   ├── render.yaml
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx  # Kanban board
    │   │   └── MyTasks.jsx
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── api/
    │   │   └── axios.js
    │   └── main.jsx
    ├── _redirects               # Render SPA routing fix
    ├── vercel.json
    └── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 18+

### 1. Clone the repo
```bash
git clone https://github.com/bablu-chaudhary/Task-Manager.git
cd Task-Manager/team-task-manager
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev
```
Backend runs on `http://localhost:5000`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

> The Vite dev server proxies `/api` requests to `localhost:5000` automatically.

---

## Deployment on Render (Free)

### Backend (Web Service)
1. [render.com](https://render.com) → New → **Web Service**
2. Connect GitHub → select `Task-Manager`
3. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npx prisma db push`
   - Start Command: `node src/index.js`
4. Environment Variables:
   ```
   DATABASE_URL  = file:./dev.db
   JWT_SECRET    = your-secret-key
   PORT          = 5000
   FRONTEND_URL  = https://your-frontend.onrender.com
   ```

### Frontend (Static Site)
1. Render → New → **Static Site**
2. Connect same repo
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `frontend/dist`
4. Environment Variables:
   ```
   VITE_API_URL = https://your-backend.onrender.com/api
   ```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | Public | Register new user |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/me | JWT | Get current user |
| GET | /api/projects | JWT | List user's projects |
| POST | /api/projects | JWT | Create project |
| GET | /api/projects/:id | JWT | Project + tasks |
| PATCH | /api/projects/:id | Admin | Update project |
| DELETE | /api/projects/:id | Admin | Delete project |
| POST | /api/projects/:id/members | Admin | Add member by email |
| DELETE | /api/projects/:id/members/:userId | Admin | Remove member |
| GET | /api/tasks/my | JWT | My assigned tasks |
| POST | /api/tasks | Admin | Create task |
| PATCH | /api/tasks/:id | JWT | Update task |
| DELETE | /api/tasks/:id | Admin | Delete task |
| GET | /api/dashboard | JWT | Dashboard stats |

---

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path — `file:./dev.db` |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Server port (default 5000) |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
