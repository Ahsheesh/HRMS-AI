import express from 'express';
import Employee from '../models/Employee.js';
import PerformanceReview from '../models/PerformanceReview.js';
import OnboardingTask from '../models/OnboardingTask.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/employees', authenticate, async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('userId', 'firstName lastName')
      .select('employeeId userId jobTitle department status')
      .sort({ employeeId: 1 });

    const employeeList = employees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId,
      name: `${(emp.userId as any).firstName} ${(emp.userId as any).lastName}`,
      jobTitle: emp.jobTitle,
      department: emp.department,
      status: emp.status
    }));

    res.json(employeeList);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId).populate('userId', 'firstName lastName email');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const reviews = await PerformanceReview.find({ employeeId })
      .sort({ 'reviewPeriod.endDate': -1 })
      .limit(6);

    const tasks = await OnboardingTask.find({ employeeId });

    const performanceHistory = reviews.map(review => ({
      period: `${new Date(review.reviewPeriod.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(review.reviewPeriod.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      date: review.reviewPeriod.endDate,
      score: review.averageScore,
      technical: review.scores.technical,
      communication: review.scores.communication,
      teamwork: review.scores.teamwork,
      leadership: review.scores.leadership,
      initiative: review.scores.initiative
    })).reverse();

    const totalPresent = employee.attendance.filter(a => a.status === 'Present').length;
    const totalLate = employee.attendance.filter(a => a.status === 'Late').length;
    const totalAbsent = employee.attendance.filter(a => a.status === 'Absent').length;
    const totalDays = totalPresent + totalLate + totalAbsent;

    const attendanceByMonth: { [key: string]: { Present: number; Late: number; Absent: number } } = {};
    employee.attendance.forEach(record => {
      const monthKey = new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!attendanceByMonth[monthKey]) {
        attendanceByMonth[monthKey] = { Present: 0, Late: 0, Absent: 0 };
      }
      attendanceByMonth[monthKey][record.status]++;
    });

    const last6Months = Object.keys(attendanceByMonth).slice(-6);
    const attendanceStats = {
      totalPresent,
      totalLate,
      totalAbsent,
      totalDays,
      presentPercentage: totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : '0',
      monthlyBreakdown: last6Months.map(month => ({
        month,
        Present: attendanceByMonth[month].Present,
        Late: attendanceByMonth[month].Late,
        Absent: attendanceByMonth[month].Absent
      }))
    };

    const completedTasks = tasks.filter(t => t.status === 'completed' && t.startDate && t.completedAt);
    let totalCompletionTime = 0;
    let onTimeCount = 0;

    completedTasks.forEach(task => {
      if (task.startDate && task.completedAt) {
        const completionTime = (new Date(task.completedAt).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60);
        totalCompletionTime += completionTime;

        if (task.dueDate && new Date(task.completedAt) <= new Date(task.dueDate)) {
          onTimeCount++;
        } else if (!task.dueDate) {
          onTimeCount++;
        }
      }
    });

    const avgCompletionTimeHours = completedTasks.length > 0 ? (totalCompletionTime / completedTasks.length).toFixed(1) : '0';
    const onTimeCompletionRate = completedTasks.length > 0 ? ((onTimeCount / completedTasks.length) * 100).toFixed(1) : '100';

    const taskStats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      onTimeCompletionRate: parseFloat(onTimeCompletionRate),
      avgCompletionTimeHours: parseFloat(avgCompletionTimeHours)
    };

    const latestReview = reviews[0];
    const coreCompetencies = latestReview ? {
      technical: latestReview.scores.technical,
      communication: latestReview.scores.communication,
      teamwork: latestReview.scores.teamwork,
      initiative: latestReview.scores.initiative,
      leadership: latestReview.scores.leadership,
      punctuality: totalDays > 0 ? Math.min(5, Math.max(1, (totalPresent / totalDays) * 5)) : 5
    } : {
      technical: 3,
      communication: 3,
      teamwork: 3,
      initiative: 3,
      leadership: 3,
      punctuality: 3
    };

    const userData = employee.userId as any;

    const response = {
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        jobTitle: employee.jobTitle,
        department: employee.department,
        hireDate: employee.hireDate,
        status: employee.status
      },
      performanceHistory,
      attendanceStats,
      taskStats,
      coreCompetencies,
      latestReview: latestReview ? {
        period: `${new Date(latestReview.reviewPeriod.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(latestReview.reviewPeriod.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        averageScore: latestReview.averageScore,
        strengths: latestReview.strengths,
        areasForImprovement: latestReview.areasForImprovement,
        goals: latestReview.goals
      } : null
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching performance analysis:', error);
    res.status(500).json({ error: 'Failed to fetch performance analysis' });
  }
});

export default router;
