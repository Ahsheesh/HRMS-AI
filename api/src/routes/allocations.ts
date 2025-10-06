import express from 'express';
import Allocation from '../models/Allocation.js';
import Employee from '../models/Employee.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all allocations
router.get('/', async (req, res) => {
  try {
    const { employeeId, projectId, status } = req.query;
    const filter: any = {};

    if (employeeId) filter.employeeId = employeeId;
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;

    const allocations = await Allocation.find(filter)
      .populate('employeeId', 'employeeId skills')
      .populate('projectId', 'projectId name')
      .sort({ startDate: -1 });

    res.json(allocations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create allocation
router.post('/', async (req, res) => {
  try {
    const allocation = await Allocation.create(req.body);

    // Update employee allocation percentage
    const activeAllocations = await Allocation.find({
      employeeId: allocation.employeeId,
      status: { $in: ['planned', 'active'] }
    });

    const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.allocationPercent, 0);

    await Employee.findByIdAndUpdate(allocation.employeeId, {
      currentAllocationPercent: totalAllocation
    });

    const populated = await allocation.populate(['employeeId', 'projectId']);
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update allocation
router.patch('/:id', async (req, res) => {
  try {
    const allocation = await Allocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['employeeId', 'projectId']);

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Recalculate employee allocation
    const activeAllocations = await Allocation.find({
      employeeId: allocation.employeeId,
      status: { $in: ['planned', 'active'] }
    });

    const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.allocationPercent, 0);

    await Employee.findByIdAndUpdate(allocation.employeeId, {
      currentAllocationPercent: totalAllocation
    });

    res.json(allocation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete allocation
router.delete('/:id', async (req, res) => {
  try {
    const allocation = await Allocation.findByIdAndDelete(req.params.id);

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Recalculate employee allocation
    const activeAllocations = await Allocation.find({
      employeeId: allocation.employeeId,
      status: { $in: ['planned', 'active'] }
    });

    const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.allocationPercent, 0);

    await Employee.findByIdAndUpdate(allocation.employeeId, {
      currentAllocationPercent: totalAllocation
    });

    res.json({ message: 'Allocation deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
