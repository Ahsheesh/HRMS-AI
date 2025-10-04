import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import OnboardingTask from '../models/OnboardingTask.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Allocation from '../models/Allocation.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:demo123@localhost:27017/hrms?authSource=admin';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Project.deleteMany({}),
      OnboardingTask.deleteMany({}),
      PerformanceReview.deleteMany({}),
      Allocation.deleteMany({})
    ]);
    console.log('✓ Cleared existing data');

    // Create users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const users = await User.create([
      { email: 'admin@hrms.demo', password: hashedPassword, firstName: 'Alice', lastName: 'Admin', role: 'admin' },
      { email: 'hr@hrms.demo', password: hashedPassword, firstName: 'Bob', lastName: 'HR', role: 'hr' },
      { email: 'manager@hrms.demo', password: hashedPassword, firstName: 'Carol', lastName: 'Manager', role: 'manager' },
      { email: 'john@hrms.demo', password: hashedPassword, firstName: 'John', lastName: 'Smith', role: 'employee' },
      { email: 'sarah@hrms.demo', password: hashedPassword, firstName: 'Sarah', lastName: 'Johnson', role: 'employee' },
      { email: 'mike@hrms.demo', password: hashedPassword, firstName: 'Mike', lastName: 'Williams', role: 'employee' },
      { email: 'emily@hrms.demo', password: hashedPassword, firstName: 'Emily', lastName: 'Brown', role: 'employee' },
      { email: 'david@hrms.demo', password: hashedPassword, firstName: 'David', lastName: 'Lee', role: 'employee' }
    ]);
    console.log(`✓ Created ${users.length} users`);

    // Create employees
    console.log('Creating employees...');
    const [adminUser, hrUser, managerUser, ...employeeUsers] = users;

    const employees = await Employee.create([
      {
        userId: managerUser._id,
        employeeId: 'EMP001',
        jobTitle: 'Engineering Manager',
        department: 'Engineering',
        skills: ['leadership', 'nodejs', 'react', 'mongodb', 'architecture'],
        status: 'active',
        currentAllocationPercent: 30
      },
      {
        userId: employeeUsers[0]._id,
        employeeId: 'EMP002',
        jobTitle: 'Senior Node.js Engineer',
        department: 'Engineering',
        skills: ['nodejs', 'express', 'mongodb', 'docker', 'typescript'],
        status: 'active',
        currentAllocationPercent: 80,
        manager: null // Will set after creating manager
      },
      {
        userId: employeeUsers[1]._id,
        employeeId: 'EMP003',
        jobTitle: 'React Developer',
        department: 'Engineering',
        skills: ['react', 'typescript', 'tailwindcss', 'redux', 'jest'],
        status: 'active',
        currentAllocationPercent: 60
      },
      {
        userId: employeeUsers[2]._id,
        employeeId: 'EMP004',
        jobTitle: 'Full Stack Engineer',
        department: 'Engineering',
        skills: ['nodejs', 'react', 'python', 'postgresql', 'aws'],
        status: 'active',
        currentAllocationPercent: 45
      },
      {
        userId: employeeUsers[3]._id,
        employeeId: 'EMP005',
        jobTitle: 'Junior Frontend Developer',
        department: 'Engineering',
        skills: ['html', 'css', 'javascript', 'react'],
        status: 'onboarding',
        currentAllocationPercent: 0
      },
      {
        userId: employeeUsers[4]._id,
        employeeId: 'EMP006',
        jobTitle: 'Senior Python Engineer',
        department: 'Engineering',
        skills: ['python', 'fastapi', 'machine-learning', 'docker', 'postgresql'],
        status: 'active',
        currentAllocationPercent: 70
      }
    ]);

    // Set manager for employees
    const [manager, ...teamMembers] = employees;
    await Employee.updateMany(
      { _id: { $in: teamMembers.map(e => e._id) } },
      { manager: manager._id }
    );

    console.log(`✓ Created ${employees.length} employees`);

    // Create projects
    console.log('Creating projects...');
    const projects = await Project.create([
      {
        projectId: 'PROJ001',
        name: 'Customer Portal Redesign',
        description: 'Modernize customer-facing portal with new React UI and improved UX',
        requiredSkills: ['react', 'typescript', 'tailwindcss', 'nodejs'],
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-31'),
        status: 'active',
        priority: 'high',
        manager: manager._id
      },
      {
        projectId: 'PROJ002',
        name: 'AI Recommendation Engine',
        description: 'Build ML-powered recommendation system for product suggestions',
        requiredSkills: ['python', 'machine-learning', 'fastapi', 'mongodb'],
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-03-31'),
        status: 'planning',
        priority: 'critical',
        manager: manager._id
      },
      {
        projectId: 'PROJ003',
        name: 'Mobile App MVP',
        description: 'React Native mobile app for iOS and Android',
        requiredSkills: ['react', 'react-native', 'typescript', 'nodejs'],
        startDate: new Date('2026-01-01'),
        status: 'planning',
        priority: 'medium',
        manager: manager._id
      }
    ]);
    console.log(`✓ Created ${projects.length} projects`);

    // Create allocations
    console.log('Creating allocations...');
    const allocations = await Allocation.create([
      {
        employeeId: teamMembers[0]._id, // Senior Node.js Engineer
        projectId: projects[0]._id,
        allocationPercent: 80,
        startDate: new Date('2025-09-01'),
        role: 'Backend Lead',
        status: 'active'
      },
      {
        employeeId: teamMembers[1]._id, // React Developer
        projectId: projects[0]._id,
        allocationPercent: 60,
        startDate: new Date('2025-09-01'),
        role: 'Frontend Developer',
        status: 'active'
      },
      {
        employeeId: teamMembers[2]._id, // Full Stack Engineer
        projectId: projects[0]._id,
        allocationPercent: 45,
        startDate: new Date('2025-09-15'),
        role: 'Full Stack Developer',
        status: 'active'
      },
      {
        employeeId: teamMembers[4]._id, // Senior Python Engineer
        projectId: projects[1]._id,
        allocationPercent: 70,
        startDate: new Date('2025-10-01'),
        role: 'ML Engineer',
        status: 'planned'
      }
    ]);
    console.log(`✓ Created ${allocations.length} allocations`);

    // Create onboarding tasks for new employee
    console.log('Creating onboarding tasks...');
    const newEmployee = teamMembers[3]; // Junior Frontend Developer
    const onboardingTasks = await OnboardingTask.create([
      {
        employeeId: newEmployee._id,
        phase: 'day1',
        title: 'Account setup',
        description: 'Create email, Slack, GitHub accounts. Set up 2FA.',
        duration: '1h',
        status: 'completed',
        completedAt: new Date('2025-10-01'),
        order: 0
      },
      {
        employeeId: newEmployee._id,
        phase: 'day1',
        title: 'Team introductions',
        description: 'Meet team members and understand org structure',
        duration: '2h',
        status: 'completed',
        completedAt: new Date('2025-10-01'),
        order: 1
      },
      {
        employeeId: newEmployee._id,
        phase: 'week1',
        title: 'Development environment setup',
        description: 'Install IDE, Node.js, clone repos, run dev server',
        duration: '4h',
        status: 'in_progress',
        order: 2
      },
      {
        employeeId: newEmployee._id,
        phase: 'week1',
        title: 'Code review and standards',
        description: 'Review coding standards, PR process, testing practices',
        duration: '3h',
        status: 'pending',
        dueDate: new Date('2025-10-07'),
        order: 3
      },
      {
        employeeId: newEmployee._id,
        phase: 'month1',
        title: 'Complete first feature',
        description: 'Pick up starter ticket, implement, test, and deploy',
        duration: '1w',
        status: 'pending',
        dueDate: new Date('2025-10-15'),
        order: 4,
        generatedByAI: false
      }
    ]);
    console.log(`✓ Created ${onboardingTasks.length} onboarding tasks`);

    // Create performance reviews
    console.log('Creating performance reviews...');
    const reviews = await PerformanceReview.create([
      {
        employeeId: teamMembers[0]._id,
        reviewerId: manager._id,
        reviewPeriod: {
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-06-30')
        },
        scores: {
          technical: 5,
          communication: 4,
          teamwork: 5,
          leadership: 4,
          initiative: 5
        },
        strengths: 'Excellent technical skills, mentors junior developers effectively',
        areasForImprovement: 'Could improve cross-team communication',
        goals: 'Lead architecture design for next major project',
        status: 'finalized'
      },
      {
        employeeId: teamMembers[1]._id,
        reviewerId: manager._id,
        reviewPeriod: {
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-06-30')
        },
        scores: {
          technical: 4,
          communication: 5,
          teamwork: 5,
          leadership: 3,
          initiative: 4
        },
        strengths: 'Strong UI/UX skills, excellent team player',
        areasForImprovement: 'Take more initiative in technical decisions',
        goals: 'Lead frontend architecture decisions',
        status: 'finalized'
      },
      {
        employeeId: teamMembers[2]._id,
        reviewerId: manager._id,
        reviewPeriod: {
          startDate: new Date('2025-07-01'),
          endDate: new Date('2025-09-30')
        },
        scores: {
          technical: 4,
          communication: 4,
          teamwork: 4,
          leadership: 3,
          initiative: 4
        },
        strengths: 'Versatile across stack, reliable delivery',
        areasForImprovement: 'Deep dive into specific technical area',
        goals: 'Become subject matter expert in one area',
        status: 'draft',
        talkingPoints: [
          'Delivered 3 major features on time',
          'Helped onboard 2 new team members',
          'Consider specializing in backend or frontend'
        ]
      }
    ]);
    console.log(`✓ Created ${reviews.length} performance reviews`);

    console.log('\n✓✓✓ Seed completed successfully! ✓✓✓\n');
    console.log('Demo credentials:');
    console.log('  Admin:   admin@hrms.demo / demo123');
    console.log('  HR:      hr@hrms.demo / demo123');
    console.log('  Manager: manager@hrms.demo / demo123');
    console.log('  Employee: john@hrms.demo / demo123\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
