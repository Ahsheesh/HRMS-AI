import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import PerformanceReview from '../models/PerformanceReview.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.use(authenticate);

// Generate onboarding tasks
router.post('/generate-onboarding', async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();

  try {
    const { jobTitle, jobDescription, companyContext, constraints } = req.body;

    const response = await axios.post(
      `${AI_SERVICE_URL}/ai/generate-onboarding`,
      {
        requestId,
        jobTitle,
        jobDescription,
        companyContext: companyContext || 'HRMS Demo Company',
        constraints: constraints || { maxTasks: 12, lang: 'en', format: 'short' }
      },
      { timeout: 5000 }
    );

    const duration = Date.now() - startTime;

    // Log AI call
    await AuditLog.create({
      requestId,
      userId: req.user._id,
      action: 'AI: Generate Onboarding',
      endpoint: '/ai/generate-onboarding',
      method: 'POST',
      aiCall: {
        service: 'ai-service',
        endpoint: '/ai/generate-onboarding',
        duration,
        fallback: response.data.fallback || false,
        modelUsed: response.data.fallback ? 'heuristic-fallback' : 'llm'
      },
      statusCode: 200
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('AI service error:', error.message);

    // Return fallback
    const fallbackResponse = {
      requestId,
      fallback: true,
      generatedChecklist: [
        {
          phase: 'day1',
          title: 'Account setup',
          description: 'Get access to email, Slack, and repository',
          duration: '1h',
          order: 0
        },
        {
          phase: 'day1',
          title: 'Meet your team',
          description: 'Introduction meeting with immediate team members',
          duration: '2h',
          order: 1
        },
        {
          phase: 'week1',
          title: 'Environment setup',
          description: 'Set up development environment and tools',
          duration: '4h',
          order: 2
        },
        {
          phase: 'week1',
          title: 'Code review',
          description: 'Review codebase structure and coding standards',
          duration: '3h',
          order: 3
        },
        {
          phase: 'month1',
          title: 'First feature delivery',
          description: 'Complete and deploy your first feature with mentor guidance',
          duration: '2w',
          order: 4
        }
      ],
      rationale: 'Fallback heuristic: Standard onboarding template based on job title keywords',
      todo: 'Replace fallback with real LLM call when AI service is available'
    };

    const duration = Date.now() - startTime;

    await AuditLog.create({
      requestId,
      userId: req.user._id,
      action: 'AI: Generate Onboarding (Fallback)',
      endpoint: '/ai/generate-onboarding',
      method: 'POST',
      aiCall: {
        service: 'ai-service',
        endpoint: '/ai/generate-onboarding',
        duration,
        fallback: true,
        modelUsed: 'heuristic-fallback'
      },
      statusCode: 200
    });

    res.json(fallbackResponse);
  }
});

// Skills matching for project
router.get('/skills-match', async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();

  try {
    const { projectId, topK } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const response = await axios.get(
      `${AI_SERVICE_URL}/ai/skills-match`,
      {
        params: { projectId, requiredSkills: project.requiredSkills.join(','), topK: topK || 5 },
        timeout: 5000
      }
    );

    const duration = Date.now() - startTime;

    await AuditLog.create({
      requestId,
      userId: req.user._id,
      action: 'AI: Skills Match',
      endpoint: '/ai/skills-match',
      method: 'GET',
      aiCall: {
        service: 'ai-service',
        endpoint: '/ai/skills-match',
        duration,
        fallback: response.data.fallback || false,
        modelUsed: response.data.fallback ? 'heuristic-fallback' : 'embedding-match'
      },
      statusCode: 200
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('AI service error:', error.message);

    // Fallback: token overlap + availability
    const project = await Project.findById(req.query.projectId);
    const employees = await Employee.find({ status: 'active' }).populate('userId', 'firstName lastName');

    const requiredSkills = project?.requiredSkills || [];
    const candidates = employees.map(emp => {
      const matchingSkills = emp.skills.filter(s =>
        requiredSkills.some(rs => rs.toLowerCase().includes(s.toLowerCase()))
      );

      const tokenOverlap = matchingSkills.length / Math.max(requiredSkills.length, 1);
      const availabilityScore = (100 - emp.currentAllocationPercent) / 100;
      const score = 0.6 * tokenOverlap + 0.4 * availabilityScore;

      return {
        employeeId: emp._id,
        employeeName: `${(emp.userId as any)?.firstName} ${(emp.userId as any)?.lastName}`,
        score: Math.round(score * 100) / 100,
        matchingSkills,
        explain: `Token overlap: ${matchingSkills.length}/${requiredSkills.length} skills. Current allocation: ${emp.currentAllocationPercent}%`
      };
    });

    candidates.sort((a, b) => b.score - a.score);

    const fallbackResponse = {
      projectId: req.query.projectId,
      topCandidates: candidates.slice(0, parseInt(req.query.topK as string) || 5),
      fallback: true,
      todo: 'Replace with embedding-based matching when AI service is available'
    };

    const duration = Date.now() - startTime;

    await AuditLog.create({
      requestId,
      userId: req.user._id,
      action: 'AI: Skills Match (Fallback)',
      endpoint: '/ai/skills-match',
      method: 'GET',
      aiCall: {
        service: 'ai-service',
        endpoint: '/ai/skills-match',
        duration,
        fallback: true,
        modelUsed: 'token-overlap'
      },
      statusCode: 200
    });

    res.json(fallbackResponse);
  }
});

// Performance insight
router.get('/perf-insight', async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();

  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const response = await axios.get(
      `${AI_SERVICE_URL}/ai/perf-insight`,
      {
        params: { employeeId },
        timeout: 5000
      }
    );

    const duration = Date.now() - startTime;

    await AuditLog.create({
      requestId,
      userId: req.user._id,
      action: 'AI: Performance Insight',
      endpoint: '/ai/perf-insight',
      method: 'GET',
      aiCall: {
        service: 'ai-service',
        endpoint: '/ai/perf-insight',
        duration,
        fallback: response.data.fallback || false,
        modelUsed: response.data.fallback ? 'rule-based' : 'ml-model'
      },
      statusCode: 200
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('AI service error:', error.message);

    // Fallback: simple rule-based
    const reviews = await PerformanceReview.find({ employeeId: req.query.employeeId })
      .sort({ createdAt: -1 })
      .limit(3);

    const avgScore = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.averageScore, 0) / reviews.length
      : 3.0;

    const employee = await Employee.findById(req.query.employeeId);
    const allocationFactor = (employee?.currentAllocationPercent || 50) / 100;

    let risk = 0.5;
    if (avgScore < 2.5) risk += 0.3;
    if (avgScore > 4.0) risk -= 0.3;
    if (allocationFactor > 0.8) risk += 0.1;

    risk = Math.max(0, Math.min(1, risk));

    const fallbackResponse = {
      employeeId: req.query.employeeId,
      attritionRisk: Math.round(risk * 100) / 100,
      topFactors: [
        { feature: 'avgReviewScore', impact: avgScore < 3 ? 0.3 : -0.2 },
        { feature: 'recentAllocations', impact: allocationFactor > 0.8 ? 0.1 : -0.05 }
      ],
      explain: `Rule-based: avg score=${avgScore.toFixed(1)}, allocation=${Math.round(allocationFactor * 100)}%`,
      fallback: true,
      todo: 'Replace with ML model when AI service is available'
    };

    const duration = Date.now() - startTime;

    await AuditLog.create({
      requestId,
      userId: req.user._id,
      action: 'AI: Performance Insight (Fallback)',
      endpoint: '/ai/perf-insight',
      method: 'GET',
      aiCall: {
        service: 'ai-service',
        endpoint: '/ai/perf-insight',
        duration,
        fallback: true,
        modelUsed: 'rule-based'
      },
      statusCode: 200
    });

    res.json(fallbackResponse);
  }
});

// AI health status
router.get('/health', async (req, res) => {
  try {
    // Get fallback stats from audit logs
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalCalls, fallbackCalls] = await Promise.all([
      AuditLog.countDocuments({
        createdAt: { $gte: last24h },
        'aiCall.service': 'ai-service'
      }),
      AuditLog.countDocuments({
        createdAt: { $gte: last24h },
        'aiCall.fallback': true
      })
    ]);

    res.json({
      aiServiceUrl: AI_SERVICE_URL,
      last24Hours: {
        totalCalls,
        fallbackCalls,
        successRate: totalCalls > 0 ? ((totalCalls - fallbackCalls) / totalCalls * 100).toFixed(1) + '%' : 'N/A'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
