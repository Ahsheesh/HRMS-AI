import express from 'express';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('userId', 'firstName lastName email')
      .populate('manager', 'employeeId');
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('manager', 'employeeId');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    const populated = await employee.populate('userId', 'firstName lastName email');
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee
router.patch('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
