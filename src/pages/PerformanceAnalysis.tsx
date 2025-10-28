import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Clock, Award, Calendar, Target } from 'lucide-react';

const API_URL = 'http://localhost:4000/api';
const AI_URL = '/ai-api'; // Corrected proxy path if using Vite proxy

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  jobTitle: string;
  department: string;
  status: string;
}

interface PerformanceData {
  employee: {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    jobTitle: string;
    department: string;
    hireDate: string;
    status: string;
  };
  performanceHistory: Array<{
    period: string;
    date: string;
    score: number;
    technical: number;
    communication: number;
    teamwork: number;
    leadership: number;
    initiative: number;
  }>;
  attendanceStats: {
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalDays: number;
    presentPercentage: string;
    monthlyBreakdown: Array<{
      month: string;
      Present: number;
      Late: number;
      Absent: number;
    }>;
  };
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    onTimeCompletionRate: number;
    avgCompletionTimeHours: number;
  };
  coreCompetencies: {
    technical: number;
    communication: number;
    teamwork: number;
    initiative: number;
    leadership: number;
    punctuality: number;
  };
  latestReview: {
    period: string;
    averageScore: number;
    strengths: string;
    areasForImprovement: string;
    goals: string;
  } | null;
}

export default function PerformanceAnalysis() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [radarImage, setRadarImage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/performance-analysis/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(`Failed to load employees: ${err.message}`);
    }
  };

  const fetchPerformanceData = async (employeeId: string) => {
    setLoading(true);
    setError('');
    setPerformanceData(null); // Clear previous data
    setRadarImage('');       // Clear previous radar image
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/performance-analysis/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch performance data');
      const data = await response.json();
      setPerformanceData(data);

      // Only fetch radar if core competencies exist
      if (data.coreCompetencies) {
        try {
          // Use the proxy path for AI service
          const radarResponse = await fetch(`${AI_URL}/ai/generate-performance-radar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Include auth token if your AI service requires it
              // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data.coreCompetencies)
          });
          if (!radarResponse.ok) throw new Error('Failed to generate radar chart');
          const radarData = await radarResponse.json();
          setRadarImage(radarData.image);
        } catch (radarErr: any) {
           console.error('Error generating radar chart:', radarErr);
           // Optionally set an error state specific to the radar chart
        }
      }

    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(`Failed to load performance data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      fetchPerformanceData(employeeId);
    } else {
      setPerformanceData(null); // Clear data if no employee is selected
      setRadarImage('');
      setError('');
    }
  };

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444']; // For Pie Chart

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance Analysis</h1>
          <p className="text-slate-600 mt-1">Comprehensive performance metrics and visualizations</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <label htmlFor="employeeSelect" className="block text-sm font-medium text-slate-700 mb-2">
          Select Employee
        </label>
        <select
          id="employeeSelect"
          value={selectedEmployee}
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose an employee...</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.employeeId} - {emp.name} ({emp.jobTitle})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-slate-600">Loading performance data...</p>
        </div>
      )}

      {performanceData && !loading && (
        <div className="space-y-6">
          {/* Employee Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{performanceData.employee.name}</h2>
                <p className="text-slate-600 mt-1">{performanceData.employee.jobTitle} • {performanceData.employee.department}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Employee ID: {performanceData.employee.employeeId} • Hired: {new Date(performanceData.employee.hireDate).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                performanceData.employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {performanceData.employee.status}
              </span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Attendance Rate */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{performanceData.attendanceStats.presentPercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            {/* On-Time Completion */}
             <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">On-Time Completion</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{performanceData.taskStats.onTimeCompletionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            {/* Avg Completion Time */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Task Time</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{performanceData.taskStats.avgCompletionTimeHours}h</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
             {/* Latest Score */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Latest Score</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {performanceData.latestReview ? performanceData.latestReview.averageScore.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Award className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart & Performance Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-indigo-600" />
                Performance Radar Chart
              </h3>
              {radarImage ? (
                <div className="flex items-center justify-center">
                  <img src={radarImage} alt="Performance Radar Chart" className="max-w-full h-auto" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  { performanceData.coreCompetencies ? 'Loading radar chart...' : 'No competency data for radar chart.' }
                </div>
              )}
            </div>
             {/* Performance Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Performance Trend
              </h3>
              {performanceData.performanceHistory && performanceData.performanceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Average Score" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500">
                  No performance history available
                </div>
              )}
            </div>
          </div>

          {/* Attendance & Task Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Monthly Attendance */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-green-600" />
                Monthly Attendance (Last 6 Months)
              </h3>
              {performanceData.attendanceStats.monthlyBreakdown && performanceData.attendanceStats.monthlyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData.attendanceStats.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }}/>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                    <Bar dataKey="Present" fill="#10b981" name="Present" stackId="a" />
                    <Bar dataKey="Late" fill="#f59e0b" name="Late" stackId="a" />
                    <Bar dataKey="Absent" fill="#ef4444" name="Absent" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500">
                  No attendance data available
                </div>
              )}
            </div>
            {/* Task Status Pie Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                Task Completion Status
              </h3>
              {performanceData.taskStats && performanceData.taskStats.totalTasks > 0 ? (
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie
                       data={[
                         // Ensure values are numbers and handle potential division by zero or NaN
                         { name: 'On Time', value: Math.round((performanceData.taskStats.onTimeCompletionRate / 100) * performanceData.taskStats.completedTasks) || 0 },
                         { name: 'Delayed', value: Math.round(((100 - performanceData.taskStats.onTimeCompletionRate) / 100) * performanceData.taskStats.completedTasks) || 0 },
                         { name: 'Pending/In Progress', value: (performanceData.taskStats.pendingTasks + performanceData.taskStats.inProgressTasks) || 0 }
                       ]}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={(entry: any) => `${entry.name}: ${Math.round((Number(entry.percent) || 0) * 100)}%`}
                       outerRadius={100}
                       innerRadius={60} // Make it a doughnut chart
                       fill="#8884d8"
                       dataKey="value"
                       paddingAngle={5}
                     >
                       {[
                           { name: 'On Time', value: 1 }, // Dummy value for color mapping
                           { name: 'Delayed', value: 1 },
                           { name: 'Pending/In Progress', value: 1 }
                       ].map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                     <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                   </PieChart>
                 </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500">
                  No task data available
                </div>
              )}
            </div>
          </div>

          {/* Task Time & Competency Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Task Completion Time Bar Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-orange-600" />
                Avg Task Completion Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Employee', hours: performanceData.taskStats.avgCompletionTimeHours },
                    { name: 'Team Avg', hours: 24 } // Example Team Avg
                  ]}
                  layout="vertical" // Changed to vertical for better label display
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis type="number" domain={[0, 'dataMax + 10']} label={{ value: 'Hours', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} tick={{ fontSize: 11, fill: '#64748b' }}/>
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: '#64748b' }}/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                  <Bar dataKey="hours" fill="#f97316" name="Avg Hours" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Competency Scores Bar Chart - *** FIX APPLIED HERE *** */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-indigo-600" />
                Competency Scores (Latest Review)
              </h3>
              {/* Corrected Condition: Check coreCompetencies directly */}
              {performanceData.coreCompetencies ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { skill: 'Technical', score: performanceData.coreCompetencies.technical },
                      { skill: 'Communication', score: performanceData.coreCompetencies.communication },
                      { skill: 'Teamwork', score: performanceData.coreCompetencies.teamwork },
                      { skill: 'Initiative', score: performanceData.coreCompetencies.initiative },
                      { skill: 'Leadership', score: performanceData.coreCompetencies.leadership }
                    ]}
                    layout="vertical" // Changed to vertical
                     margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748b' }}/>
                    <YAxis type="category" dataKey="skill" width={100} tick={{ fontSize: 11, fill: '#64748b' }}/>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                    <Bar dataKey="score" fill="#4f46e5" name="Score" barSize={30}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500">
                  No competency data available
                </div>
              )}
            </div>
          </div>

          {/* Latest Review Summary */}
          {performanceData.latestReview && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest Performance Review Summary ({performanceData.latestReview.period})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Strengths</p>
                  <p className="text-slate-900 text-sm">{performanceData.latestReview.strengths || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Areas for Improvement</p>
                  <p className="text-slate-900 text-sm">{performanceData.latestReview.areasForImprovement || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Goals</p>
                  <p className="text-slate-900 text-sm">{performanceData.latestReview.goals || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}