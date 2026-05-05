import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">TaskManager</span>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'underline font-semibold' : 'hover:underline'}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'underline font-semibold' : 'hover:underline'}>
            Projects
          </NavLink>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.name}</span>
          <button onClick={handleLogout} className="bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded text-sm">
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
