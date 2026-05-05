import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const STATUS_CONFIG = {
  TODO:        { label: 'To Do',       bg: 'bg-gray-100',   text: 'text-gray-700',  bar: 'bg-gray-400',  icon: '○' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-100',   text: 'text-blue-700',  bar: 'bg-blue-500',  icon: '◑' },
  DONE:        { label: 'Done',        bg: 'bg-green-100',  text: 'text-green-700', bar: 'bg-green-500', icon: '●' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const allStatuses = ['TODO', 'IN_PROGRESS', 'DONE']
  const statusMap = Object.fromEntries(stats.byStatus.map((s) => [s.status, s.count]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name} — here's your overview</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={stats.total}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          iconBg="bg-indigo-100 text-indigo-600"
          border="border-l-4 border-indigo-500"
        />
        <StatCard
          label="Completed"
          value={statusMap['DONE'] || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-green-100 text-green-600"
          border="border-l-4 border-green-500"
        />
        <StatCard
          label="In Progress"
          value={statusMap['IN_PROGRESS'] || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-blue-100 text-blue-600"
          border="border-l-4 border-blue-500"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          iconBg="bg-red-100 text-red-600"
          border="border-l-4 border-red-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks by status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tasks by Status</h2>
          {stats.total === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-4">
              {allStatuses.map((status) => {
                const count = statusMap[status] || 0
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                const cfg = STATUS_CONFIG[status]
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${cfg.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tasks per member */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tasks per Member</h2>
          {stats.tasksPerUser.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No assigned tasks yet</p>
          ) : (
            <div className="space-y-3">
              {stats.tasksPerUser
                .sort((a, b) => b.count - a.count)
                .map((item) => {
                  const initials = item.user?.name
                    ? item.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '?'
                  const maxCount = Math.max(...stats.tasksPerUser.map((u) => u.count))
                  const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
                  return (
                    <div key={item.user?.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.user?.name}</p>
                          <span className="text-sm font-semibold text-gray-700 ml-2">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-indigo-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Overdue tasks list */}
      {stats.overdueList && stats.overdueList.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="font-semibold text-gray-800">Overdue Tasks</h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{stats.overdueList.length}</span>
          </div>
          <div className="space-y-2">
            {stats.overdueList.map((task) => (
              <Link key={task.id} to={`/projects/${task.project?.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-red-700">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {task.assignee && (
                    <span className="text-xs text-gray-500">{task.assignee.name}</span>
                  )}
                  <span className="text-xs text-red-600 font-medium">
                    {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.total === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-gray-700 font-semibold mb-1">No tasks yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create a project and start adding tasks to see your stats here.</p>
          <Link to="/projects" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Go to Projects
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, iconBg, border }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
