import { Router } from "express";
import prisma from "../../db.js";

const router = Router();

// GET all tasks
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { assignedTo: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new task
router.post("/tasks", async (req, res) => {
  const { title, description, estimatedHours } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        estimatedHours: parseFloat(estimatedHours) || 1.0,
      },
    });
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE task
router.put("/tasks/:id", async (req, res) => {
  const { title, description, estimatedHours, assignedToId, status } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        description,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        status,
      },
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users (team members)
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { tasks: true },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new user
router.post("/users", async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const user = await prisma.user.create({
      data: { name, email, role },
    });
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// WORKLOAD ALLOCATOR ALGORITHM
router.post("/allocate", async (req, res) => {
  try {
    const unassignedTasks = await prisma.task.findMany({
      where: { assignedToId: null },
      orderBy: { estimatedHours: "desc" },
    });

    if (unassignedTasks.length === 0) {
      return res.json({ message: "No unassigned tasks found for allocation." });
    }

    const users = await prisma.user.findMany({
      include: {
        tasks: {
          where: {
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        },
      },
    });

    if (users.length === 0) {
      return res.status(400).json({ error: "No users found in the system to allocate tasks to." });
    }

    const userWorkloads = users.map(user => ({
      userId: user.id,
      totalHours: user.tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
    }));

    const allocations: Array<{ taskId: number; taskTitle: string; userId: number; userName: string }> = [];

    for (const task of unassignedTasks) {
      userWorkloads.sort((a, b) => a.totalHours - b.totalHours);
      const targetUserIndex = 0;
      const targetUser = userWorkloads[targetUserIndex];

      await prisma.task.update({
        where: { id: task.id },
        data: { assignedToId: targetUser.userId },
      });

      targetUser.totalHours += task.estimatedHours;

      const userName = users.find(u => u.id === targetUser.userId)?.name || `User ${targetUser.userId}`;
      allocations.push({
        taskId: task.id,
        taskTitle: task.title,
        userId: targetUser.userId,
        userName,
      });
    }

    res.json({
      message: "Tasks successfully allocated.",
      allocations,
      updatedWorkloads: userWorkloads,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all StackAgent boards
router.get("/boards", async (req, res) => {
  try {
    const boards = await prisma.stackAgentBoard.findMany({
      orderBy: { updatedAt: "desc" }
    });
    res.json(boards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST new StackAgent board
router.post("/boards", async (req, res) => {
  const { name, boardData } = req.body;
  try {
    const board = await prisma.stackAgentBoard.create({
      data: {
        name,
        boardData
      }
    });
    res.status(201).json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE StackAgent board
router.delete("/boards/:id", async (req, res) => {
  try {
    await prisma.stackAgentBoard.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
