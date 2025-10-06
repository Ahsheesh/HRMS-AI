import express from 'express';
import PerformanceReview from '../models/PerformanceReview.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const filter: any = {};

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const reviews = await PerformanceReview.find(filter)
      .populate('employeeId', 'employeeId')
      .populate('reviewerId', 'employeeId')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single review
router.get('/:id', async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id)
      .populate('employeeId', 'employeeId')
      .populate('reviewerId', 'employeeId');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create review
router.post('/', async (req, res) => {
  try {
    const review = await PerformanceReview.create(req.body);
    const populated = await review.populate(['employeeId', 'reviewerId']);
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update review
router.patch('/:id', async (req, res) => {
  try {
    const review = await PerformanceReview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['employeeId', 'reviewerId']);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const review = await PerformanceReview.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
