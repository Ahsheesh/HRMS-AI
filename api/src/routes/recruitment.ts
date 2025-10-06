import express from 'express';
import JobOpening from '../models/JobOpening.js';
import MockResume from '../models/MockResume.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import axios from 'axios';
import bcrypt from 'bcryptjs';

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await JobOpening.find({ status: 'Open' }).sort({ postedDate: -1 });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-profile', async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/generate-ideal-profile`, {
      job_description: jobDescription
    });

    res.json(aiResponse.data);
  } catch (error: any) {
    console.error('Error generating ideal profile:', error.message);
    res.status(500).json({ error: 'Failed to generate ideal profile' });
  }
});

router.post('/find-matches', async (req, res) => {
  try {
    const { jobId, idealProfile } = req.body;

    if (!jobId || !idealProfile) {
      return res.status(400).json({ error: 'Job ID and ideal profile are required' });
    }

    const job = await JobOpening.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    const allResumes = await MockResume.find({});

    const resumesForAI = allResumes.map(resume => ({
      id: resume._id.toString(),
      name: resume.name,
      email: resume.email,
      resumeText: resume.resumeText
    }));

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/rank-resumes`, {
      ideal_profile: idealProfile,
      resumes: resumesForAI
    });

    const topCandidates = aiResponse.data.topCandidates.map((candidate: any) => {
      const resume = allResumes.find(r => r._id.toString() === candidate.id);
      return {
        ...candidate,
        phone: resume?.phone,
        skills: resume?.skills,
        experienceYears: resume?.experienceYears,
        education: resume?.education,
        resumeText: resume?.resumeText
      };
    });

    res.json({
      topCandidates,
      totalProcessed: aiResponse.data.totalProcessed
    });
  } catch (error: any) {
    console.error('Error finding matches:', error.message);
    res.status(500).json({ error: 'Failed to find matching candidates' });
  }
});

router.post('/generate-questions', async (req, res) => {
  try {
    const { jobTitle, requiredSkills } = req.body;

    if (!jobTitle || !requiredSkills) {
      return res.status(400).json({ error: 'Job title and required skills are required' });
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/generate-questions`, {
      job_title: jobTitle,
      required_skills: requiredSkills
    });

    res.json(aiResponse.data);
  } catch (error: any) {
    console.error('Error generating questions:', error.message);
    res.status(500).json({ error: 'Failed to generate interview questions' });
  }
});

router.post('/hire', async (req, res) => {
  try {
    const { mockResumeId, jobId } = req.body;

    if (!mockResumeId) {
      return res.status(400).json({ error: 'Mock resume ID is required' });
    }

    const mockResume = await MockResume.findById(mockResumeId);
    if (!mockResume) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const job = jobId ? await JobOpening.findById(jobId) : null;

    const hashedPassword = await bcrypt.hash('demo123', 10);

    const newUser = await User.create({
      email: mockResume.email,
      password: hashedPassword,
      firstName: mockResume.name.split(' ')[0],
      lastName: mockResume.name.split(' ').slice(1).join(' ') || 'Unknown',
      role: 'employee'
    });

    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    let nextEmployeeId = 'EMP001';
    if (lastEmployee && lastEmployee.employeeId) {
      const lastNumber = parseInt(lastEmployee.employeeId.replace('EMP', ''));
      nextEmployeeId = `EMP${String(lastNumber + 1).padStart(3, '0')}`;
    }

    const newEmployee = await Employee.create({
      userId: newUser._id,
      employeeId: nextEmployeeId,
      jobTitle: job?.title || 'Software Engineer',
      department: job?.department || 'Engineering',
      skills: mockResume.skills,
      status: 'onboarding',
      currentAllocationPercent: 0,
      phoneNumber: mockResume.phone,
      hireDate: new Date()
    });

    const populatedEmployee = await Employee.findById(newEmployee._id).populate('userId');

    res.json({
      success: true,
      message: `${mockResume.name} has been hired successfully!`,
      employee: populatedEmployee
    });
  } catch (error: any) {
    console.error('Error hiring candidate:', error.message);
    res.status(500).json({ error: 'Failed to hire candidate' });
  }
});

export default router;
