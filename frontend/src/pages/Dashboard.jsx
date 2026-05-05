import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}

const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>
  if (!stats) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={stats.total} color="bg-indigo-50 text-indigo-700" />
        <StatCard label="Overdue" value={stats.overdue} color="bg-red-50 text-red-700" />
        {stats.byStatus.map((s) => (
          <StatCard
            key={s.status}
            label={STATUS_LABELS[s.status] || s.status}
            value={s.count}
            color={STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-700'}
          />
        ))}
      </div>

      {/* Tasks per user */}
      {stats.tasksPerUser.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tasks per Member</h2>
          <div className="space-y-3">
            {stats.tasksPerUser.map((item) => (
              <div key={item.user?.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{item.user?.email}</p>
                </div>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {item.count} task{item.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div className="text-center py-16 text-gray-400">
          No tasks yet. Create a project and start adding tasks.
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-5 ${color} flex flex-col items-center shadow-sm`}>
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-sm mt-1 font-medium">{label}</span>
    </div>
  )
}
