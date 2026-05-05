import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
}
const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}
const COLUMN_STYLES = {
  TODO: { header: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400', count: 'bg-gray-200 text-gray-600' },
  IN_PROGRESS: { header: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', count: 'bg-blue-100 text-blue-700' },
  DONE: { header: 'bg-green-50 border-green-200', dot: 'bg-green-500', count: 'bg-green-100 text-green-700' },
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
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [filterAssignee, setFilterAssignee] = useState('ALL')
  const [activeTab, setActiveTab] = useState('board')

  const fetchProject = () => {
    api.get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch(() => { toast.error('Project not found'); navigate('/projects') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProject() }, [id])

  const isAdmin = project?.myRole === 'ADMIN'

  const filteredTasks = (project?.tasks || []).filter((t) => {
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false
    if (filterAssignee !== 'ALL' && t.assigneeId !== filterAssignee) return false
    return true
  })

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter((t) => t.status === s)
    return acc
  }, {})

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
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete project')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!project) return null

  const overdueCount = project.tasks.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'DONE'
  ).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mb-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projects
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-1 text-sm">{project.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            {overdueCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <button onClick={handleDeleteProject}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Project
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {['board', 'members'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'board' ? `Board (${project.tasks.length})` : `Members (${project.members.length})`}
          </button>
        ))}
      </div>

      {/* Board tab */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="ALL">All Priorities</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {/* Assignee filter */}
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="ALL">All Members</option>
                {project.members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
              {(filterPriority !== 'ALL' || filterAssignee !== 'ALL') && (
                <button onClick={() => { setFilterPriority('ALL'); setFilterAssignee('ALL') }}
                  className="text-xs text-indigo-600 hover:underline">Clear filters</button>
              )}
            </div>
            {isAdmin && (
              <button onClick={() => setShowTaskForm(!showTaskForm)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
          </div>

          {/* Task create form */}
          {showTaskForm && isAdmin && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">New Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-3">
                <input type="text" placeholder="Task title" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                <textarea placeholder="Description (optional)" rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Due Date</label>
                    <input type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Priority</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Assign to</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                      <option value="">Unassigned</option>
                      {project.members.map((m) => (
                        <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Create Task
                  </button>
                  <button type="button" onClick={() => setShowTaskForm(false)}
                    className="border border-gray-300 px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Kanban columns */}
          <div className="grid md:grid-cols-3 gap-4">
            {STATUSES.map((status) => {
              const col = COLUMN_STYLES[status]
              const tasks = tasksByStatus[status] || []
              return (
                <div key={status} className="flex flex-col gap-3">
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${col.header}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="text-sm font-semibold text-gray-700">{STATUS_LABELS[status]}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.count}`}>{tasks.length}</span>
                  </div>
                  {/* Task cards */}
                  <div className="space-y-3 min-h-[100px]">
                    {tasks.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                        No tasks
                      </div>
                    )}
                    {tasks.map((task) => (
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
              )
            })}
          </div>
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="max-w-xl space-y-4">
          {isAdmin && (
            <div>
              <button onClick={() => setShowMemberForm(!showMemberForm)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Member
              </button>
              {showMemberForm && (
                <form onSubmit={handleAddMember} className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Member Email</label>
                    <input type="email" placeholder="colleague@example.com" required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
                    <p className="text-xs text-gray-400 mt-1">The user must already have an account.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                      Add Member
                    </button>
                    <button type="button" onClick={() => setShowMemberForm(false)}
                      className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {project.members.map((m, idx) => {
              const initials = m.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              const taskCount = project.tasks.filter((t) => t.assigneeId === m.user.id).length
              return (
                <div key={m.user.id} className={`flex items-center justify-between px-5 py-4 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{m.user.name}</p>
                      <p className="text-xs text-gray-500">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.role}
                    </span>
                    {isAdmin && m.user.id !== user?.id && (
                      <button onClick={() => handleRemoveMember(m.user.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
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
  const isAssignedToMe = task.assigneeId === currentUserId

  if (isEditing && isAdmin) {
    return (
      <div className="bg-white rounded-xl border border-indigo-300 shadow-md p-4 space-y-3">
        <input type="text" required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
        <textarea rows={2} placeholder="Description"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Priority</label>
            <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Assignee</label>
            <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={editForm.assigneeId} onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onUpdate(task.id, { ...editForm, assigneeId: editForm.assigneeId || null, dueDate: editForm.dueDate || null })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors">
            Save
          </button>
          <button onClick={() => setEditingTask(null)}
            className="border border-gray-300 px-4 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition-shadow hover:shadow-md ${
      isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</h3>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditingTask(task.id)}
              className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task.id)}
              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        {isOverdue && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
            OVERDUE
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                {task.assignee.name[0].toUpperCase()}
              </div>
              <span>{task.assignee.name}</span>
            </div>
          )}
          {task.dueDate && (
            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
              📅 {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>

        {/* Member status update */}
        {!isAdmin && isAssignedToMe && (
          <select
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            value={task.status}
            onChange={(e) => onUpdate(task.id, { status: e.target.value })}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}
