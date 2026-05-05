const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard — stats for all projects the user belongs to
router.get('/', async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const now = new Date();

    const [total, byStatus, byUser, overdue] = await Promise.all([
      // Total tasks
      prisma.task.count({ where: { projectId: { in: projectIds } } }),

      // Tasks by status
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId: { in: projectIds } },
        _count: { status: true },
      }),

      // Tasks per assignee
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId: { in: projectIds }, assigneeId: { not: null } },
        _count: { assigneeId: true },
      }),

      // Overdue tasks (dueDate in past, not done)
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
      }),
    ]);

    // Enrich assignee data
    const assigneeIds = byUser.map((b) => b.assigneeId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const tasksPerUser = byUser.map((b) => ({
      user: userMap[b.assigneeId] || null,
      count: b._count.assigneeId,
    }));

    res.json({
      total,
      byStatus: byStatus.map((b) => ({ status: b.status, count: b._count.status })),
      tasksPerUser,
      overdue,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
