const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/projects — list projects for current user
router.get('/', async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.userId },
      include: {
        project: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
            _count: { select: { tasks: true } },
          },
        },
      },
    });
    const projects = memberships.map((m) => ({ ...m.project, myRole: m.role }));
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create project (creator becomes Admin)
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: { create: { userId: req.userId, role: 'ADMIN' } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    res.status(201).json({ ...project, myRole: 'ADMIN' });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.userId, projectId: req.params.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    res.json({ ...project, myRole: membership.role });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/members — Admin adds member by email
router.post('/:id/members', async (req, res, next) => {
  try {
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.userId, projectId: req.params.id } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.id } },
    });
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    const newMember = await prisma.projectMember.create({
      data: { userId: user.id, projectId: req.params.id, role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(newMember);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/members/:userId — Admin removes member
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.userId, projectId: req.params.id } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }
    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.id } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id — Admin deletes project
router.delete('/:id', async (req, res, next) => {
  try {
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.userId, projectId: req.params.id } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete projects' });
    }
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
