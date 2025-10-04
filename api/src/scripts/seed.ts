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

function generateAttendance(startDate: Date, months: number) {
  const attendance = [];
  const start = new Date(startDate);
  const end = new Date();

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const random = Math.random();
      let status: 'Present' | 'Late' | 'Absent';
      if (random < 0.85) status = 'Present';
      else if (random < 0.95) status = 'Late';
      else status = 'Absent';

      attendance.push({
        date: new Date(d),
        status
      });
    }
  }

  return attendance;
}

function getRandomScore() {
  return Math.floor(Math.random() * 2) + 3;
}

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

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

    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const adminUsers = await User.create([
      { email: 'admin@hrms.demo', password: hashedPassword, firstName: 'Alice', lastName: 'Admin', role: 'admin' },
      { email: 'hr@hrms.demo', password: hashedPassword, firstName: 'Bob', lastName: 'HR', role: 'hr' },
      { email: 'manager@hrms.demo', password: hashedPassword, firstName: 'Carol', lastName: 'Manager', role: 'manager' }
    ]);

    const employeeUsersData = [
      { firstName: 'John', lastName: 'Smith', jobTitle: 'Senior Node.js Engineer', department: 'Engineering', skills: ['nodejs', 'express', 'mongodb', 'docker', 'typescript'], hireMonthsAgo: 24 },
      { firstName: 'Sarah', lastName: 'Johnson', jobTitle: 'React Developer', department: 'Engineering', skills: ['react', 'typescript', 'tailwindcss', 'redux', 'jest'], hireMonthsAgo: 18 },
      { firstName: 'Mike', lastName: 'Williams', jobTitle: 'Full Stack Engineer', department: 'Engineering', skills: ['nodejs', 'react', 'python', 'postgresql', 'aws'], hireMonthsAgo: 12 },
      { firstName: 'Emily', lastName: 'Brown', jobTitle: 'Junior Frontend Developer', department: 'Engineering', skills: ['html', 'css', 'javascript', 'react'], hireMonthsAgo: 2 },
      { firstName: 'David', lastName: 'Lee', jobTitle: 'Senior Python Engineer', department: 'Engineering', skills: ['python', 'fastapi', 'machine-learning', 'docker', 'postgresql'], hireMonthsAgo: 30 },
      { firstName: 'Jessica', lastName: 'Garcia', jobTitle: 'DevOps Engineer', department: 'Engineering', skills: ['kubernetes', 'docker', 'terraform', 'aws', 'ci-cd'], hireMonthsAgo: 15 },
      { firstName: 'Robert', lastName: 'Martinez', jobTitle: 'Backend Engineer', department: 'Engineering', skills: ['nodejs', 'graphql', 'redis', 'postgresql', 'microservices'], hireMonthsAgo: 20 },
      { firstName: 'Linda', lastName: 'Anderson', jobTitle: 'UX Designer', department: 'Design', skills: ['figma', 'sketch', 'user-research', 'prototyping', 'design-systems'], hireMonthsAgo: 22 },
      { firstName: 'James', lastName: 'Taylor', jobTitle: 'Product Manager', department: 'Product', skills: ['agile', 'jira', 'product-strategy', 'analytics', 'stakeholder-management'], hireMonthsAgo: 18 },
      { firstName: 'Patricia', lastName: 'Thomas', jobTitle: 'QA Engineer', department: 'Engineering', skills: ['selenium', 'cypress', 'test-automation', 'api-testing', 'performance-testing'], hireMonthsAgo: 14 },
      { firstName: 'Michael', lastName: 'Jackson', jobTitle: 'Data Engineer', department: 'Data', skills: ['python', 'spark', 'airflow', 'sql', 'data-pipelines'], hireMonthsAgo: 16 },
      { firstName: 'Jennifer', lastName: 'White', jobTitle: 'Senior Frontend Engineer', department: 'Engineering', skills: ['react', 'vue', 'webpack', 'performance-optimization', 'a11y'], hireMonthsAgo: 28 },
      { firstName: 'Christopher', lastName: 'Harris', jobTitle: 'Mobile Developer', department: 'Engineering', skills: ['react-native', 'swift', 'kotlin', 'mobile-ui', 'app-store'], hireMonthsAgo: 11 },
      { firstName: 'Michelle', lastName: 'Clark', jobTitle: 'Data Scientist', department: 'Data', skills: ['python', 'machine-learning', 'tensorflow', 'statistics', 'data-visualization'], hireMonthsAgo: 19 },
      { firstName: 'Daniel', lastName: 'Rodriguez', jobTitle: 'Security Engineer', department: 'Engineering', skills: ['security', 'penetration-testing', 'cryptography', 'compliance', 'incident-response'], hireMonthsAgo: 25 },
      { firstName: 'Nancy', lastName: 'Lewis', jobTitle: 'Technical Writer', department: 'Engineering', skills: ['documentation', 'technical-writing', 'markdown', 'api-docs', 'tutorials'], hireMonthsAgo: 10 },
      { firstName: 'Matthew', lastName: 'Walker', jobTitle: 'Solutions Architect', department: 'Engineering', skills: ['architecture', 'cloud', 'scalability', 'system-design', 'microservices'], hireMonthsAgo: 32 },
      { firstName: 'Betty', lastName: 'Hall', jobTitle: 'Scrum Master', department: 'Product', skills: ['agile', 'scrum', 'facilitation', 'jira', 'team-coaching'], hireMonthsAgo: 13 },
      { firstName: 'George', lastName: 'Allen', jobTitle: 'Business Analyst', department: 'Product', skills: ['requirements-gathering', 'sql', 'data-analysis', 'stakeholder-management', 'documentation'], hireMonthsAgo: 17 },
      { firstName: 'Sandra', lastName: 'Young', jobTitle: 'UI Designer', department: 'Design', skills: ['figma', 'ui-design', 'color-theory', 'typography', 'responsive-design'], hireMonthsAgo: 9 },
      { firstName: 'Kevin', lastName: 'King', jobTitle: 'Cloud Engineer', department: 'Engineering', skills: ['aws', 'azure', 'terraform', 'serverless', 'cloud-architecture'], hireMonthsAgo: 21 },
      { firstName: 'Karen', lastName: 'Wright', jobTitle: 'Frontend Engineer', department: 'Engineering', skills: ['javascript', 'react', 'css', 'html', 'git'], hireMonthsAgo: 8 },
      { firstName: 'Brian', lastName: 'Lopez', jobTitle: 'Machine Learning Engineer', department: 'Data', skills: ['python', 'pytorch', 'mlops', 'computer-vision', 'nlp'], hireMonthsAgo: 14 },
      { firstName: 'Lisa', lastName: 'Hill', jobTitle: 'Customer Success Manager', department: 'Customer Success', skills: ['customer-relations', 'crm', 'communication', 'problem-solving', 'training'], hireMonthsAgo: 12 }
    ];

    const employeeUsers = await User.create(
      employeeUsersData.map(u => ({
        email: `${u.firstName.toLowerCase()}.${u.lastName.toLowerCase()}@hrms.demo`,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: 'employee'
      }))
    );
    console.log(`✓ Created ${adminUsers.length + employeeUsers.length} users`);

    console.log('Creating employees...');
    const [adminUser, hrUser, managerUser] = adminUsers;

    const manager = await Employee.create({
      userId: managerUser._id,
      employeeId: 'EMP001',
      jobTitle: 'Engineering Manager',
      department: 'Engineering',
      skills: ['leadership', 'nodejs', 'react', 'mongodb', 'architecture'],
      status: 'active',
      currentAllocationPercent: 30,
      hireDate: new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000),
      attendance: generateAttendance(new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000), 36)
    });

    const employees = await Employee.create(
      employeeUsersData.map((empData, index) => {
        const hireDate = new Date(Date.now() - empData.hireMonthsAgo * 30 * 24 * 60 * 60 * 1000);
        return {
          userId: employeeUsers[index]._id,
          employeeId: `EMP${String(index + 2).padStart(3, '0')}`,
          jobTitle: empData.jobTitle,
          department: empData.department,
          skills: empData.skills,
          status: empData.hireMonthsAgo < 3 ? 'onboarding' : 'active',
          currentAllocationPercent: Math.floor(Math.random() * 50) + 40,
          manager: manager._id,
          hireDate: hireDate,
          attendance: generateAttendance(hireDate, empData.hireMonthsAgo)
        };
      })
    );

    console.log(`✓ Created ${employees.length + 1} employees`);

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

    console.log('Creating allocations...');
    const allocations = await Allocation.create([
      {
        employeeId: employees[0]._id,
        projectId: projects[0]._id,
        allocationPercent: 80,
        startDate: new Date('2025-09-01'),
        role: 'Backend Lead',
        status: 'active'
      },
      {
        employeeId: employees[1]._id,
        projectId: projects[0]._id,
        allocationPercent: 60,
        startDate: new Date('2025-09-01'),
        role: 'Frontend Developer',
        status: 'active'
      },
      {
        employeeId: employees[2]._id,
        projectId: projects[0]._id,
        allocationPercent: 45,
        startDate: new Date('2025-09-15'),
        role: 'Full Stack Developer',
        status: 'active'
      },
      {
        employeeId: employees[4]._id,
        projectId: projects[1]._id,
        allocationPercent: 70,
        startDate: new Date('2025-10-01'),
        role: 'ML Engineer',
        status: 'planned'
      }
    ]);
    console.log(`✓ Created ${allocations.length} allocations`);

    console.log('Creating onboarding tasks...');
    const newEmployees = employees.filter((_, idx) => employeeUsersData[idx].hireMonthsAgo < 3);

    const onboardingTasksData = [];
    for (const emp of newEmployees) {
      const empIndex = employees.indexOf(emp);
      const hireDate = new Date(Date.now() - employeeUsersData[empIndex].hireMonthsAgo * 30 * 24 * 60 * 60 * 1000);

      onboardingTasksData.push(
        {
          employeeId: emp._id,
          phase: 'day1',
          title: 'Account setup',
          description: 'Create email, Slack, GitHub accounts. Set up 2FA.',
          duration: '1h',
          status: 'completed',
          startDate: new Date(hireDate),
          completedAt: new Date(hireDate.getTime() + 2 * 60 * 60 * 1000),
          order: 0
        },
        {
          employeeId: emp._id,
          phase: 'day1',
          title: 'Team introductions',
          description: 'Meet team members and understand org structure',
          duration: '2h',
          status: 'completed',
          startDate: new Date(hireDate.getTime() + 2 * 60 * 60 * 1000),
          completedAt: new Date(hireDate.getTime() + 4 * 60 * 60 * 1000),
          order: 1
        },
        {
          employeeId: emp._id,
          phase: 'week1',
          title: 'Development environment setup',
          description: 'Install IDE, Node.js, clone repos, run dev server',
          duration: '4h',
          status: employeeUsersData[empIndex].hireMonthsAgo > 0.5 ? 'completed' : 'in_progress',
          startDate: new Date(hireDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          completedAt: employeeUsersData[empIndex].hireMonthsAgo > 0.5 ? new Date(hireDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000) : undefined,
          order: 2
        },
        {
          employeeId: emp._id,
          phase: 'week1',
          title: 'Code review and standards',
          description: 'Review coding standards, PR process, testing practices',
          duration: '3h',
          status: employeeUsersData[empIndex].hireMonthsAgo > 1 ? 'completed' : 'pending',
          dueDate: new Date(hireDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          startDate: employeeUsersData[empIndex].hireMonthsAgo > 1 ? new Date(hireDate.getTime() + 5 * 24 * 60 * 60 * 1000) : undefined,
          completedAt: employeeUsersData[empIndex].hireMonthsAgo > 1 ? new Date(hireDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000) : undefined,
          order: 3
        },
        {
          employeeId: emp._id,
          phase: 'month1',
          title: 'Complete first feature',
          description: 'Pick up starter ticket, implement, test, and deploy',
          duration: '1w',
          status: employeeUsersData[empIndex].hireMonthsAgo > 1.5 ? 'completed' : 'pending',
          dueDate: new Date(hireDate.getTime() + 15 * 24 * 60 * 60 * 1000),
          startDate: employeeUsersData[empIndex].hireMonthsAgo > 1.5 ? new Date(hireDate.getTime() + 10 * 24 * 60 * 60 * 1000) : undefined,
          completedAt: employeeUsersData[empIndex].hireMonthsAgo > 1.5 ? new Date(hireDate.getTime() + 14 * 24 * 60 * 60 * 1000) : undefined,
          order: 4,
          generatedByAI: false
        }
      );
    }

    await OnboardingTask.create(onboardingTasksData);
    console.log(`✓ Created ${onboardingTasksData.length} onboarding tasks`);

    console.log('Creating performance reviews...');
    const reviewsData = [];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const monthsEmployed = employeeUsersData[i].hireMonthsAgo;

      if (monthsEmployed >= 6) {
        const reviewPeriods = Math.floor(monthsEmployed / 6);

        for (let j = 0; j < reviewPeriods && j < 3; j++) {
          const periodEnd = new Date(Date.now() - (j * 6) * 30 * 24 * 60 * 60 * 1000);
          const periodStart = new Date(periodEnd.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

          const baseScore = 3 + Math.random() * 1.5;
          const trend = j === 0 ? 0.2 : 0;

          reviewsData.push({
            employeeId: emp._id,
            reviewerId: manager._id,
            reviewPeriod: {
              startDate: periodStart,
              endDate: periodEnd
            },
            scores: {
              technical: Math.min(5, Math.max(1, Math.round((baseScore + trend + (Math.random() - 0.5) * 0.5) * 10) / 10)),
              communication: Math.min(5, Math.max(1, Math.round((baseScore + (Math.random() - 0.5) * 0.8) * 10) / 10)),
              teamwork: Math.min(5, Math.max(1, Math.round((baseScore + (Math.random() - 0.5) * 0.6) * 10) / 10)),
              leadership: Math.min(5, Math.max(1, Math.round((baseScore - 0.5 + (Math.random() - 0.5) * 0.7) * 10) / 10)),
              initiative: Math.min(5, Math.max(1, Math.round((baseScore + (Math.random() - 0.5) * 0.6) * 10) / 10))
            },
            strengths: j === 0 ? 'Strong technical skills and reliable delivery' : 'Good team collaboration',
            areasForImprovement: j === 0 ? 'Could take more initiative in cross-team projects' : 'Focus on technical depth',
            goals: j === 0 ? 'Lead a major feature or project component' : 'Improve technical expertise',
            status: j === 0 ? 'finalized' : 'finalized'
          });
        }
      }
    }

    await PerformanceReview.create(reviewsData);
    console.log(`✓ Created ${reviewsData.length} performance reviews`);

    console.log('\n✓✓✓ Seed completed successfully! ✓✓✓\n');
    console.log('Demo credentials:');
    console.log('  Admin:   admin@hrms.demo / demo123');
    console.log('  HR:      hr@hrms.demo / demo123');
    console.log('  Manager: manager@hrms.demo / demo123');
    console.log('  Employee: john.smith@hrms.demo / demo123\n');
    console.log(`Created ${employees.length + 1} employees with rich performance history`);
    console.log(`Created ${reviewsData.length} performance reviews across multiple periods`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
