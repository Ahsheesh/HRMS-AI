import { createClient } from '@supabase/supabase-js';

// --- Supabase Client (for Authentication) ---
// We'll keep the Supabase client for handling user authentication,
// as your Login.tsx component is already set up for it.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Backend API Configuration ---
const API_URL = 'http://localhost:4000/api'; // Your backend server URL

/**
 * A helper function to make authenticated requests to your backend API.
 * It automatically includes the JWT token from Supabase auth.
 */
async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  // Retrieve the session which contains the JWT access token
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
}

// --- API Service Objects (Updated to use fetchFromAPI) ---

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }
    return response.json();
  },
  register: (userData: any) => fetchFromAPI('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
};

export const employeesAPI = {
  getAll: () => fetchFromAPI('/employees'),
  getOne: (id: string) => fetchFromAPI(`/employees/${id}`),
  create: (employeeData: any) => fetchFromAPI('/employees', { method: 'POST', body: JSON.stringify(employeeData) }),
  update: (id: string, employeeData: any) => fetchFromAPI(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(employeeData) }),
  delete: (id: string) => fetchFromAPI(`/employees/${id}`, { method: 'DELETE' }),
};

export const onboardingAPI = {
  getTasks: (employeeId: string) => fetchFromAPI(`/onboarding/employee/${employeeId}`),
  createTask: (taskData: any) => fetchFromAPI('/onboarding', { method: 'POST', body: JSON.stringify(taskData) }),
  bulkCreate: (employeeId: string, tasks: any[]) => fetchFromAPI('/onboarding/bulk', { method: 'POST', body: JSON.stringify({ employeeId, tasks }) }),
  updateTask: (id: string, taskData: any) => fetchFromAPI(`/onboarding/${id}`, { method: 'PATCH', body: JSON.stringify(taskData) }),
  deleteTask: (id: string) => fetchFromAPI(`/onboarding/${id}`, { method: 'DELETE' }),
};

export const performanceAPI = {
  getAll: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return fetchFromAPI(`/performance?${query}`);
  },
  getOne: (id: string) => fetchFromAPI(`/performance/${id}`),
  create: (reviewData: any) => fetchFromAPI('/performance', { method: 'POST', body: JSON.stringify(reviewData) }),
  update: (id: string, reviewData: any) => fetchFromAPI(`/performance/${id}`, { method: 'PATCH', body: JSON.stringify(reviewData) }),
  delete: (id: string) => fetchFromAPI(`/performance/${id}`, { method: 'DELETE' }),
};

export const projectsAPI = {
  getAll: () => fetchFromAPI('/projects'),
  getOne: (id: string) => fetchFromAPI(`/projects/${id}`),
  create: (projectData: any) => fetchFromAPI('/projects', { method: 'POST', body: JSON.stringify(projectData) }),
  update: (id: string, projectData: any) => fetchFromAPI(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(projectData) }),
  delete: (id: string) => fetchFromAPI(`/projects/${id}`, { method: 'DELETE' }),
};

export const allocationsAPI = {
  getAll: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return fetchFromAPI(`/allocations?${query}`);
  },
  create: (allocationData: any) => fetchFromAPI('/allocations', { method: 'POST', body: JSON.stringify(allocationData) }),
  update: (id: string, allocationData: any) => fetchFromAPI(`/allocations/${id}`, { method: 'PATCH', body: JSON.stringify(allocationData) }),
  delete: (id: string) => fetchFromAPI(`/allocations/${id}`, { method: 'DELETE' }),
};

export const aiAPI = {
  generateOnboarding: (data: any) => fetchFromAPI('/ai/generate-onboarding', { method: 'POST', body: JSON.stringify(data) }),
  skillsMatch: (projectId: string, topK: number = 5) => fetchFromAPI(`/ai/skills-match?projectId=${projectId}&topK=${topK}`),
  perfInsight: (employeeId: string) => fetchFromAPI(`/perf-insight?employeeId=${employeeId}`),
  health: () => fetchFromAPI('/ai/health'),
};

export const recruitmentAPI = {
  getJobs: () => fetchFromAPI('/recruitment/jobs'),
  getJob: (id: string) => fetchFromAPI(`/recruitment/jobs/${id}`),
  generateProfile: (jobDescription: string) => fetchFromAPI('/recruitment/generate-profile', { method: 'POST', body: JSON.stringify({ jobDescription }) }),
  findMatches: (jobId: string, idealProfile: any) => fetchFromAPI('/recruitment/find-matches', { method: 'POST', body: JSON.stringify({ jobId, idealProfile }) }),
  generateQuestions: (jobTitle: string, requiredSkills: string[]) => fetchFromAPI('/recruitment/generate-questions', { method: 'POST', body: JSON.stringify({ jobTitle, requiredSkills }) }),
  hire: (mockResumeId: string, jobId?: string) => fetchFromAPI('/recruitment/hire', { method: 'POST', body: JSON.stringify({ mockResumeId, jobId }) }),
};