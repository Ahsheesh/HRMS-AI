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
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

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
  // Note: Login and registration still go through Supabase, which then provides
  // the JWT token we use for our backend API calls.
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Login failed');
    return {
      token: data.session?.access_token || '',
      user: data.user,
    };
  },
  register: async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: { data: userData },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');
    return {
      token: data.session?.access_token || '',
      user: data.user,
    };
  },
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
  perfInsight: (employeeId: string) => fetchFromAPI(`/ai/perf-insight?employeeId=${employeeId}`),
  health: () => fetchFromAPI('/ai/health'),
};