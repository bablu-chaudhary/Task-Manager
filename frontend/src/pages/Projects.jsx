import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  const fetchProjects = () => {
    api.get('/projects')
      .then((res) => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const { data } = await api.post('/projects', form)
      setProjects([data, ...projects])
      setForm({ name: '', description: '' })
      setShowForm(false)
      toast.success('Project created')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          + New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
          <input
            type="text" placeholder="Project name" required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            placeholder="Description (optional)" rows={2}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No projects yet. Create one to get started.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}
              className="bg-white rounded-xl shadow p-5 hover:shadow-md transition block">
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-gray-800 text-lg">{p.name}</h2>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.myRole === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {p.myRole}
                </span>
              </div>
              {p.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{p.members?.length || 0} member{p.members?.length !== 1 ? 's' : ''}</span>
                <span>{p._count?.tasks || 0} task{p._count?.tasks !== 1 ? 's' : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
