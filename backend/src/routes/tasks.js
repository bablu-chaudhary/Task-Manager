const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// POST /api/tasks — create task (Admin only)
router.post('/', async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, projectId, assigneeId } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId are required' });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.userId, projectId } },
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });
    if (membership.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can create tasks' });

    // Validate assignee is a project member
    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId } },
      });
      if (!assigneeMembership) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id — update task
router.patch('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.userId, projectId: task.projectId } },
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const { title, description, dueDate, priority, status, assigneeId } = req.body;

    // Members can only update status of their assigned tasks
    if (membership.role === 'MEMBER') {
      if (task.assigneeId !== req.userId) {
        return res.status(403).json({ error: 'You can only update your own assigned tasks' });
      }
      const updated = await prisma.task.update({
        where: { id: req.params.id },
        data: { status: status || task.status },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      });
      return res.json(updated);
    }

    // Admin can update everything
    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId: task.projectId } },
      });
      if (!assigneeMembership) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title: title ?? task.title,
        description: description ?? task.description,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        priority: priority ?? task.priority,
        status: status ?? task.status,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id — Admin only
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.userId, projectId: task.projectId } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete tasks' });
    }
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
