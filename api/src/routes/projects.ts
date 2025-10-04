import express from 'express';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('manager', 'employeeId')
      .sort({ startDate: -1 });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'employeeId');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    const populated = await project.populate('manager', 'employeeId');
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.patch('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'employeeId');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
