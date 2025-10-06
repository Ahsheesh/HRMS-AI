import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import OnboardingTask from '../models/OnboardingTask.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Allocation from '../models/Allocation.js';
import JobOpening from '../models/JobOpening.js';
import MockResume from '../models/MockResume.js';

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

function generateMockResumes(count: number) {
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Rohan', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Aadhya', 'Ananya', 'Diya', 'Aarohi', 'Pari', 'Saanvi', 'Navya', 'Avni', 'Kiara', 'Sara', 'Raj', 'Vikram', 'Karan', 'Ravi', 'Amit', 'Priya', 'Pooja', 'Neha', 'Sneha', 'Anjali', 'Rahul', 'Nikhil', 'Aakash', 'Siddharth', 'Varun', 'Shreya', 'Kavya', 'Ishita', 'Tanvi', 'Riya'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Agarwal', 'Joshi', 'Desai', 'Nair', 'Rao', 'Iyer', 'Menon', 'Chopra', 'Kapoor', 'Malhotra', 'Bhatia', 'Kulkarni', 'Jain', 'Shah', 'Pandey', 'Mishra', 'Sinha', 'Pillai', 'Banerjee', 'Das', 'Ghosh', 'Mukherjee', 'Saxena', 'Choudhary', 'Thakur', 'Dubey', 'Bhatt', 'Chawla', 'Dhawan', 'Goyal', 'Kaur', 'Naik'];

  const skillSets = [
    { role: 'Full Stack Engineer', skills: ['react', 'nodejs', 'typescript', 'mongodb', 'express', 'docker', 'git', 'rest-api'], education: 'Bachelor of Science in Computer Science', yearsRange: [3, 8] },
    { role: 'Frontend Developer', skills: ['react', 'javascript', 'typescript', 'css', 'html', 'redux', 'webpack', 'tailwindcss'], education: 'Bachelor of Science in Computer Science', yearsRange: [2, 6] },
    { role: 'Backend Engineer', skills: ['nodejs', 'python', 'postgresql', 'mongodb', 'redis', 'microservices', 'graphql', 'docker'], education: 'Bachelor of Computer Engineering', yearsRange: [3, 9] },
    { role: 'DevOps Engineer', skills: ['kubernetes', 'docker', 'terraform', 'aws', 'azure', 'ci-cd', 'jenkins', 'monitoring', 'bash'], education: 'Bachelor of Information Technology', yearsRange: [4, 10] },
    { role: 'Data Scientist', skills: ['python', 'machine-learning', 'tensorflow', 'data-analysis', 'sql', 'statistics', 'jupyter', 'pandas'], education: 'Master of Science in Data Science', yearsRange: [2, 7] },
    { role: 'Machine Learning Engineer', skills: ['python', 'pytorch', 'tensorflow', 'mlops', 'computer-vision', 'nlp', 'aws', 'kubernetes'], education: 'Master of Science in Artificial Intelligence', yearsRange: [3, 8] },
    { role: 'Mobile Developer', skills: ['react-native', 'swift', 'kotlin', 'ios', 'android', 'mobile-ui', 'firebase', 'app-store'], education: 'Bachelor of Computer Science', yearsRange: [2, 6] },
    { role: 'Cloud Engineer', skills: ['aws', 'azure', 'gcp', 'terraform', 'serverless', 'lambda', 'cloud-architecture', 'networking'], education: 'Bachelor of Information Systems', yearsRange: [4, 9] },
    { role: 'Security Engineer', skills: ['security', 'penetration-testing', 'cryptography', 'compliance', 'incident-response', 'firewall', 'siem'], education: 'Bachelor of Cybersecurity', yearsRange: [3, 8] },
    { role: 'UI/UX Designer', skills: ['figma', 'sketch', 'user-research', 'prototyping', 'design-systems', 'wireframing', 'usability-testing'], education: 'Bachelor of Design', yearsRange: [2, 7] },
    { role: 'Product Manager', skills: ['product-strategy', 'agile', 'jira', 'analytics', 'stakeholder-management', 'roadmapping', 'user-stories'], education: 'MBA in Product Management', yearsRange: [4, 10] },
    { role: 'QA Engineer', skills: ['selenium', 'cypress', 'test-automation', 'api-testing', 'performance-testing', 'jest', 'mocha'], education: 'Bachelor of Software Engineering', yearsRange: [2, 6] },
    { role: 'Data Engineer', skills: ['python', 'spark', 'airflow', 'sql', 'data-pipelines', 'etl', 'kafka', 'hadoop'], education: 'Bachelor of Computer Science', yearsRange: [3, 8] },
    { role: 'Solutions Architect', skills: ['architecture', 'cloud', 'scalability', 'system-design', 'microservices', 'aws', 'kubernetes'], education: 'Master of Computer Science', yearsRange: [6, 12] },
    { role: 'Site Reliability Engineer', skills: ['kubernetes', 'monitoring', 'prometheus', 'grafana', 'incident-management', 'linux', 'python'], education: 'Bachelor of Computer Engineering', yearsRange: [3, 8] }
  ];

  const resumes = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const skillSet = skillSets[Math.floor(Math.random() * skillSets.length)];
    const yearsExp = Math.floor(Math.random() * (skillSet.yearsRange[1] - skillSet.yearsRange[0] + 1)) + skillSet.yearsRange[0];

    const additionalSkills = ['git', 'agile', 'scrum', 'rest-api', 'graphql', 'linux', 'problem-solving', 'team-collaboration'];
    const finalSkills = [...skillSet.skills];
    for (let j = 0; j < 3; j++) {
      const randomSkill = additionalSkills[Math.floor(Math.random() * additionalSkills.length)];
      if (!finalSkills.includes(randomSkill)) {
        finalSkills.push(randomSkill);
      }
    }

    const companies = ['TechCorp', 'InnovateLabs', 'CloudSystems Inc', 'DataFlow Solutions', 'NexGen Technologies', 'Quantum Dynamics', 'Velocity Software', 'Apex Digital', 'Horizon Tech', 'Pinnacle Systems'];
    const prevCompany1 = companies[Math.floor(Math.random() * companies.length)];
    const prevCompany2 = companies[Math.floor(Math.random() * companies.length)];

    const resumeText = `
${firstName} ${lastName}
Email: ${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com | Phone: +1-555-${String(Math.floor(Math.random() * 9000) + 1000)}

PROFESSIONAL SUMMARY
${skillSet.role} with ${yearsExp} years of experience building scalable, high-performance applications. Proven track record of delivering complex projects on time and collaborating effectively with cross-functional teams. Strong expertise in ${finalSkills.slice(0, 4).join(', ')}, and modern software development practices. Passionate about writing clean, maintainable code and continuously learning new technologies.

PROFESSIONAL EXPERIENCE

${skillSet.role} | ${prevCompany1} | ${2023 - Math.floor(yearsExp / 2)} - Present
• Led development of critical features serving over 100,000+ daily active users
• Architected and implemented microservices architecture reducing system latency by 40%
• Collaborated with product and design teams to deliver user-centric solutions
• Mentored junior developers and conducted code reviews to maintain high code quality standards
• Implemented CI/CD pipelines and automated testing, improving deployment frequency by 60%
• Optimized database queries and caching strategies, improving application performance by 35%

${skillSet.role.replace('Senior ', '').replace('Lead ', '')} | ${prevCompany2} | ${2023 - yearsExp} - ${2023 - Math.floor(yearsExp / 2)}
• Developed and maintained full-stack web applications using modern frameworks and tools
• Worked closely with stakeholders to gather requirements and translate them into technical solutions
• Participated in agile development processes including sprint planning, daily standups, and retrospectives
• Implemented responsive UI components and ensured cross-browser compatibility
• Collaborated with DevOps team to deploy applications to cloud infrastructure
• Wrote comprehensive unit and integration tests achieving 85%+ code coverage

EDUCATION
${skillSet.education} | State University | ${2023 - yearsExp - 4}

TECHNICAL SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Vue.js, HTML5, CSS3, Tailwind CSS, Redux
Backend: Node.js, Express, FastAPI, Django, REST APIs, GraphQL
Databases: MongoDB, PostgreSQL, MySQL, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, Terraform, CI/CD, Jenkins
Tools: Git, Jira, Confluence, VS Code, Postman

CERTIFICATIONS
• AWS Certified Solutions Architect
• Certified Kubernetes Administrator (CKA)

PROJECTS
• Built real-time analytics dashboard processing 1M+ events per day
• Developed recommendation engine using machine learning algorithms
• Created mobile app with 50K+ downloads and 4.5-star rating
    `.trim();

    resumes.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      resumeText,
      skills: finalSkills,
      experienceYears: yearsExp,
      education: skillSet.education
    });
  }

  return resumes;
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
      Allocation.deleteMany({}),
      JobOpening.deleteMany({}),
      MockResume.deleteMany({})
    ]);
    console.log('✓ Cleared existing data');

    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const adminUsers = await User.create([
      { email: 'admin@hrms.demo', password: hashedPassword, firstName: 'HR', lastName: 'Admin', role: 'admin' },
      { email: 'hr@hrms.demo', password: hashedPassword, firstName: 'Priya', lastName: 'Sharma', role: 'hr' },
      { email: 'manager@hrms.demo', password: hashedPassword, firstName: 'Rahul', lastName: 'Kumar', role: 'manager' }
    ]);

    const employeeUsersData = [
      { firstName: 'Arjun', lastName: 'Sharma', jobTitle: 'Senior Node.js Engineer', department: 'Engineering', skills: ['nodejs', 'express', 'mongodb', 'docker', 'typescript'], hireMonthsAgo: 24 },
      { firstName: 'Priya', lastName: 'Patel', jobTitle: 'React Developer', department: 'Engineering', skills: ['react', 'typescript', 'tailwindcss', 'redux', 'jest'], hireMonthsAgo: 18 },
      { firstName: 'Vikram', lastName: 'Reddy', jobTitle: 'Full Stack Engineer', department: 'Engineering', skills: ['nodejs', 'react', 'python', 'postgresql', 'aws'], hireMonthsAgo: 12 },
      { firstName: 'Ananya', lastName: 'Gupta', jobTitle: 'Junior Frontend Developer', department: 'Engineering', skills: ['html', 'css', 'javascript', 'react'], hireMonthsAgo: 2 },
      { firstName: 'Rohan', lastName: 'Verma', jobTitle: 'Senior Python Engineer', department: 'Engineering', skills: ['python', 'fastapi', 'machine-learning', 'docker', 'postgresql'], hireMonthsAgo: 30 },
      { firstName: 'Kavya', lastName: 'Iyer', jobTitle: 'DevOps Engineer', department: 'Engineering', skills: ['kubernetes', 'docker', 'terraform', 'aws', 'ci-cd'], hireMonthsAgo: 15 },
      { firstName: 'Aditya', lastName: 'Mehta', jobTitle: 'Backend Engineer', department: 'Engineering', skills: ['nodejs', 'graphql', 'redis', 'postgresql', 'microservices'], hireMonthsAgo: 20 },
      { firstName: 'Neha', lastName: 'Nair', jobTitle: 'UX Designer', department: 'Design', skills: ['figma', 'sketch', 'user-research', 'prototyping', 'design-systems'], hireMonthsAgo: 22 },
      { firstName: 'Karan', lastName: 'Singh', jobTitle: 'Product Manager', department: 'Product', skills: ['agile', 'jira', 'product-strategy', 'analytics', 'stakeholder-management'], hireMonthsAgo: 18 },
      { firstName: 'Sneha', lastName: 'Joshi', jobTitle: 'QA Engineer', department: 'Engineering', skills: ['selenium', 'cypress', 'test-automation', 'api-testing', 'performance-testing'], hireMonthsAgo: 14 },
      { firstName: 'Rahul', lastName: 'Desai', jobTitle: 'Data Engineer', department: 'Data', skills: ['python', 'spark', 'airflow', 'sql', 'data-pipelines'], hireMonthsAgo: 16 },
      { firstName: 'Ishita', lastName: 'Rao', jobTitle: 'Senior Frontend Engineer', department: 'Engineering', skills: ['react', 'vue', 'webpack', 'performance-optimization', 'a11y'], hireMonthsAgo: 28 },
      { firstName: 'Siddharth', lastName: 'Chopra', jobTitle: 'Mobile Developer', department: 'Engineering', skills: ['react-native', 'swift', 'kotlin', 'mobile-ui', 'app-store'], hireMonthsAgo: 11 },
      { firstName: 'Diya', lastName: 'Kulkarni', jobTitle: 'Data Scientist', department: 'Data', skills: ['python', 'machine-learning', 'tensorflow', 'statistics', 'data-visualization'], hireMonthsAgo: 19 },
      { firstName: 'Aarav', lastName: 'Jain', jobTitle: 'Security Engineer', department: 'Engineering', skills: ['security', 'penetration-testing', 'cryptography', 'compliance', 'incident-response'], hireMonthsAgo: 25 },
      { firstName: 'Tanvi', lastName: 'Banerjee', jobTitle: 'Technical Writer', department: 'Engineering', skills: ['documentation', 'technical-writing', 'markdown', 'api-docs', 'tutorials'], hireMonthsAgo: 10 },
      { firstName: 'Vivaan', lastName: 'Shah', jobTitle: 'Solutions Architect', department: 'Engineering', skills: ['architecture', 'cloud', 'scalability', 'system-design', 'microservices'], hireMonthsAgo: 32 },
      { firstName: 'Riya', lastName: 'Pandey', jobTitle: 'Scrum Master', department: 'Product', skills: ['agile', 'scrum', 'facilitation', 'jira', 'team-coaching'], hireMonthsAgo: 13 },
      { firstName: 'Ayaan', lastName: 'Mishra', jobTitle: 'Business Analyst', department: 'Product', skills: ['requirements-gathering', 'sql', 'data-analysis', 'stakeholder-management', 'documentation'], hireMonthsAgo: 17 },
      { firstName: 'Sara', lastName: 'Menon', jobTitle: 'UI Designer', department: 'Design', skills: ['figma', 'ui-design', 'color-theory', 'typography', 'responsive-design'], hireMonthsAgo: 9 },
      { firstName: 'Varun', lastName: 'Kapoor', jobTitle: 'Cloud Engineer', department: 'Engineering', skills: ['aws', 'azure', 'terraform', 'serverless', 'cloud-architecture'], hireMonthsAgo: 21 },
      { firstName: 'Avni', lastName: 'Bhatia', jobTitle: 'Frontend Engineer', department: 'Engineering', skills: ['javascript', 'react', 'css', 'html', 'git'], hireMonthsAgo: 8 },
      { firstName: 'Shaurya', lastName: 'Saxena', jobTitle: 'Machine Learning Engineer', department: 'Data', skills: ['python', 'pytorch', 'mlops', 'computer-vision', 'nlp'], hireMonthsAgo: 14 },
      { firstName: 'Navya', lastName: 'Pillai', jobTitle: 'Customer Success Manager', department: 'Customer Success', skills: ['customer-relations', 'crm', 'communication', 'problem-solving', 'training'], hireMonthsAgo: 12 }
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

    console.log('Creating job openings...');
    const jobOpenings = await JobOpening.create([
      {
        title: 'Senior Full Stack Engineer',
        department: 'Engineering',
        description: 'We are looking for an experienced Full Stack Engineer to join our growing team. The ideal candidate will have strong experience with React, Node.js, TypeScript, and modern web technologies. You will be responsible for designing and implementing scalable web applications, collaborating with cross-functional teams, and mentoring junior developers. Key responsibilities include architecting backend APIs, building responsive frontends, optimizing performance, and ensuring code quality through testing and code reviews.',
        requiredSkills: ['react', 'nodejs', 'typescript', 'mongodb', 'docker', 'aws', 'microservices'],
        status: 'Open',
        postedDate: new Date()
      },
      {
        title: 'DevOps Engineer',
        department: 'Engineering',
        description: 'Join our DevOps team to build and maintain our cloud infrastructure. We need someone with expertise in Kubernetes, Docker, CI/CD pipelines, and AWS. You will automate deployment processes, manage infrastructure as code using Terraform, monitor system performance, and ensure high availability of our services. Experience with Jenkins, GitLab CI, monitoring tools like Prometheus and Grafana, and scripting languages is highly valued.',
        requiredSkills: ['kubernetes', 'docker', 'terraform', 'aws', 'ci-cd', 'jenkins', 'monitoring'],
        status: 'Open',
        postedDate: new Date()
      },
      {
        title: 'Machine Learning Engineer',
        department: 'Data',
        description: 'We are seeking a talented Machine Learning Engineer to develop and deploy ML models at scale. The role involves working with large datasets, building recommendation systems, implementing NLP solutions, and deploying models to production. You should have strong Python skills, experience with TensorFlow or PyTorch, and knowledge of MLOps practices. Familiarity with data pipelines, feature engineering, model monitoring, and A/B testing is essential.',
        requiredSkills: ['python', 'machine-learning', 'tensorflow', 'pytorch', 'mlops', 'nlp', 'data-pipelines'],
        status: 'Open',
        postedDate: new Date()
      },
      {
        title: 'Senior Frontend Developer',
        department: 'Engineering',
        description: 'Looking for a passionate Senior Frontend Developer with deep expertise in React and modern web technologies. You will lead the development of our user-facing applications, implement complex UI components, optimize performance, and ensure accessibility standards. The ideal candidate has experience with state management (Redux, Context API), CSS-in-JS, responsive design, and progressive web apps. You will collaborate closely with designers and backend engineers to deliver exceptional user experiences.',
        requiredSkills: ['react', 'typescript', 'redux', 'css', 'webpack', 'performance-optimization', 'a11y'],
        status: 'Open',
        postedDate: new Date()
      },
      {
        title: 'Product Manager',
        department: 'Product',
        description: 'We need an experienced Product Manager to drive product strategy and execution. You will work closely with engineering, design, and business stakeholders to define product roadmaps, prioritize features, and deliver value to customers. Strong analytical skills, experience with agile methodologies, and excellent communication abilities are required. You should be comfortable with data-driven decision making, user research, competitive analysis, and stakeholder management.',
        requiredSkills: ['product-strategy', 'agile', 'analytics', 'stakeholder-management', 'jira', 'user-research'],
        status: 'Open',
        postedDate: new Date()
      }
    ]);
    console.log(`✓ Created ${jobOpenings.length} job openings`);

    console.log('Creating mock resumes (talent pool)...');
    const mockResumesData = generateMockResumes(120);
    await MockResume.create(mockResumesData);
    console.log(`✓ Created ${mockResumesData.length} mock resumes`);

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