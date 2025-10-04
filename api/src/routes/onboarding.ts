import express from 'express';
import OnboardingTask from '../models/OnboardingTask.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all tasks for an employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const tasks = await OnboardingTask.find({ employeeId: req.params.employeeId })
      .sort({ phase: 1, order: 1 })
      .populate('assignedTo', 'employeeId');

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const task = await OnboardingTask.create(req.body);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk create tasks (for AI generation)
router.post('/bulk', async (req, res) => {
  try {
    const { employeeId, tasks } = req.body;

    const tasksWithEmployee = tasks.map((task: any) => ({
      ...task,
      employeeId
    }));

    const created = await OnboardingTask.insertMany(tasksWithEmployee);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.patch('/:id', async (req, res) => {
  try {
    const task = await OnboardingTask.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await OnboardingTask.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
