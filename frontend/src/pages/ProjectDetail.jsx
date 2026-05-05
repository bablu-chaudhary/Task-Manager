import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
const PRIORITY_COLORS = { LOW: 'text-green-600', MEDIUM: 'text-yellow-600', HIGH: 'text-red-600' }
const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', priority: 'MEDIUM', assigneeId: '' })
  const [memberEmail, setMemberEmail] = useState('')
  const [editingTask, setEditingTask] = useState(null)

  const fetchProject = () => {
    api.get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch(() => { toast.error('Project not found'); navigate('/projects') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProject() }, [id])

  const isAdmin = project?.myRole === 'ADMIN'

  const handleCreateTask = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...taskForm, projectId: id, assigneeId: taskForm.assigneeId || undefined }
      const { data } = await api.post('/tasks', payload)
      setProject({ ...project, tasks: [data, ...project.tasks] })
      setTaskForm({ title: '', description: '', dueDate: '', priority: 'MEDIUM', assigneeId: '' })
      setShowTaskForm(false)
      toast.success('Task created')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task')
    }
  }

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}`, updates)
      setProject({ ...project, tasks: project.tasks.map((t) => t.id === taskId ? data : t) })
      setEditingTask(null)
      toast.success('Task updated')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setProject({ ...project, tasks: project.tasks.filter((t) => t.id !== taskId) })
      toast.success('Task deleted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete task')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail })
      setProject({ ...project, members: [...project.members, data] })
      setMemberEmail('')
      setShowMemberForm(false)
      toast.success('Member added')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      setProject({ ...project, members: project.members.filter((m) => m.user.id !== userId) })
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member')
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete project')
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>
  if (!project) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-sm text-indigo-600 hover:underline mb-1 block">
            ← Projects
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        </div>
        {isAdmin && (
          <button onClick={handleDeleteProject}
            className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg">
            Delete Project
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tasks column */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Tasks ({project.tasks.length})</h2>
            {isAdmin && (
              <button onClick={() => setShowTaskForm(!showTaskForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                + Add Task
              </button>
            )}
          </div>

          {showTaskForm && isAdmin && (
            <form onSubmit={handleCreateTask} className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
              <input type="text" placeholder="Task title" required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              <textarea placeholder="Description (optional)" rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                  <input type="date"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Assign to</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  Create Task
                </button>
                <button type="button" onClick={() => setShowTaskForm(false)}
                  className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {project.tasks.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">No tasks yet.</div>
            )}
            {project.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                currentUserId={user?.id}
                members={project.members}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                editingTask={editingTask}
                setEditingTask={setEditingTask}
              />
            ))}
          </div>
        </div>

        {/* Members sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Members ({project.members.length})</h2>
            {isAdmin && (
              <button onClick={() => setShowMemberForm(!showMemberForm)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
                + Add
              </button>
            )}
          </div>

          {showMemberForm && isAdmin && (
            <form onSubmit={handleAddMember} className="bg-white rounded-xl shadow p-4 mb-4 space-y-2">
              <input type="email" placeholder="Member email" required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
              <div className="flex gap-2">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                  Add
                </button>
                <button type="button" onClick={() => setShowMemberForm(false)}
                  className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow divide-y">
            {project.members.map((m) => (
              <div key={m.user.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.user.name}</p>
                  <p className="text-xs text-gray-500">{m.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                    {m.role}
                  </span>
                  {isAdmin && m.user.id !== user?.id && (
                    <button onClick={() => handleRemoveMember(m.user.id)}
                      className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, isAdmin, currentUserId, members, onUpdate, onDelete, editingTask, setEditingTask }) {
  const isEditing = editingTask === task.id
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    priority: task.priority,
    status: task.status,
    assigneeId: task.assigneeId || '',
  })

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE'
  const canEdit = isAdmin || task.assigneeId === currentUserId

  if (isEditing && isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <input type="text" required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
        <textarea rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
            <input type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Priority</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Assignee</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.assigneeId} onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onUpdate(task.id, { ...editForm, assigneeId: editForm.assigneeId || null, dueDate: editForm.dueDate || null })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Save
          </button>
          <button onClick={() => setEditingTask(null)}
            className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow p-4 ${isOverdue ? 'border-l-4 border-red-400' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {isOverdue && <span className="text-xs text-red-500 font-medium">OVERDUE</span>}
          </div>
          {task.description && <p className="text-sm text-gray-500 mb-2">{task.description}</p>}
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            {task.assignee && <span>👤 {task.assignee.name}</span>}
            {task.dueDate && <span>📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Member: quick status update */}
          {!isAdmin && task.assigneeId === currentUserId && (
            <select
              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value })}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          )}
          {isAdmin && (
            <>
              <button onClick={() => setEditingTask(task.id)}
                className="text-gray-400 hover:text-indigo-600 text-sm px-1">✏️</button>
              <button onClick={() => onDelete(task.id)}
                className="text-gray-400 hover:text-red-500 text-sm px-1">🗑️</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
