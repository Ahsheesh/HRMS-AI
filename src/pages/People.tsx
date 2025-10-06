import { useState, useEffect } from 'react';
import { User, Mail, Briefcase, X, TrendingUp, Award, Calendar, Target, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { employeesAPI, performanceAPI, aiAPI } from '../services/api';

const API_URL = 'http://localhost:4000/api';
const AI_URL = '/ai-api';

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

export default function People() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [radarImage, setRadarImage] = useState<string>('');
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [insight, setInsight] = useState<any>(null);

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee && showDetailModal) {
      fetchPerformanceData(selectedEmployee._id);
      loadInsight(selectedEmployee._id);
    }
  }, [selectedEmployee, showDetailModal]);

  const loadEmployees = async () => {
    try {
      const data = await employeesAPI.getAll();
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployee(data[0]);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async (employeeId: string) => {
    setLoadingPerformance(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/performance-analysis/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setPerformanceData(data);

      const radarResponse = await fetch(`${AI_URL}/ai/generate-performance-radar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data.coreCompetencies)
      });
      const radarData = await radarResponse.json();
      setRadarImage(radarData.image);
    } catch (err) {
      console.error('Error fetching performance data:', err);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const loadInsight = async (employeeId: string) => {
    try {
      const data = await aiAPI.perfInsight(employeeId);
      setInsight(data);
    } catch (error) {
      console.error('Failed to load insight:', error);
    }
  };

  const handleEmployeeClick = (emp: any) => {
    setSelectedEmployee(emp);
    setShowDetailModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">People</h1>
        <p className="text-slate-600 mt-2">Manage your team members and view their performance</p>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
          <User className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees yet</h3>
          <p className="text-slate-600 mb-4">Get started by adding your first team member</p>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Add Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => {
            const firstName = emp.first_name || emp.userId?.firstName || 'User';
            const lastName = emp.last_name || emp.userId?.lastName || '';
            const jobTitle = emp.job_title || emp.jobTitle || 'Employee';
            const department = emp.department || 'General';
            const skills = emp.skills || [];
            const status = emp.status || 'active';
            const allocation = emp.current_allocation_percent || emp.currentAllocationPercent || 0;

            return (
              <div
                key={emp.id || emp._id}
                className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleEmployeeClick(emp)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl">
                    {firstName[0]}{lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-lg">
                      {firstName} {lastName}
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">{jobTitle}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <Briefcase size={12} />
                      {department}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          +{skills.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No skills listed</p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      status === 'onboarding' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {status}
                    </span>
                    <span className="text-slate-500">
                      Allocation: {allocation}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedEmployee.userId?.firstName} {selectedEmployee.userId?.lastName}
                </h2>
                <p className="text-slate-600 mt-1">{selectedEmployee.jobTitle}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingPerformance ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : performanceData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Attendance Rate</p>
                          <p className="text-3xl font-bold text-green-900 mt-1">{performanceData.attendanceStats.presentPercentage}%</p>
                        </div>
                        <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                          <Calendar className="text-green-700" size={24} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg shadow-sm border border-blue-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">On-Time Completion</p>
                          <p className="text-3xl font-bold text-blue-900 mt-1">{performanceData.taskStats.onTimeCompletionRate}%</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                          <Target className="text-blue-700" size={24} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-sm border border-orange-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-700">Avg Completion Time</p>
                          <p className="text-3xl font-bold text-orange-900 mt-1">{performanceData.taskStats.avgCompletionTimeHours}h</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                          <Clock className="text-orange-700" size={24} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Latest Score</p>
                          <p className="text-3xl font-bold text-blue-900 mt-1">
                            {performanceData.latestReview ? performanceData.latestReview.averageScore.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                          <Award className="text-blue-700" size={24} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Award size={20} className="text-blue-600" />
                        Performance Radar Chart
                      </h3>
                      {radarImage ? (
                        <div className="flex items-center justify-center">
                          <img src={radarImage} alt="Performance Radar Chart" className="max-w-full h-auto" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                          Loading radar chart...
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        Performance Trend
                      </h3>
                      {performanceData.performanceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={performanceData.performanceHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Average Score" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                          No performance history available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600" />
                        Monthly Attendance
                      </h3>
                      {performanceData.attendanceStats.monthlyBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={performanceData.attendanceStats.monthlyBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Present" fill="#10b981" name="Present" />
                            <Bar dataKey="Late" fill="#f59e0b" name="Late" />
                            <Bar dataKey="Absent" fill="#ef4444" name="Absent" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                          No attendance data available
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Award size={20} className="text-blue-600" />
                        Competency Scores
                      </h3>
                      {performanceData.performanceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { skill: 'Technical', score: performanceData.coreCompetencies.technical },
                              { skill: 'Communication', score: performanceData.coreCompetencies.communication },
                              { skill: 'Teamwork', score: performanceData.coreCompetencies.teamwork },
                              { skill: 'Initiative', score: performanceData.coreCompetencies.initiative },
                              { skill: 'Leadership', score: performanceData.coreCompetencies.leadership }
                            ]}
                            layout="horizontal"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 5]} />
                            <YAxis type="category" dataKey="skill" width={100} />
                            <Tooltip />
                            <Bar dataKey="score" fill="#3b82f6" name="Score" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                          No competency data available
                        </div>
                      )}
                    </div>
                  </div>

                  {insight && (
                    <div className={`rounded-xl shadow-sm p-6 border ${
                      insight.fallback ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-blue-600" size={20} />
                        <h3 className="text-lg font-semibold text-slate-900">AI Performance Insight</h3>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-slate-600 mb-2">Attrition Risk</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                insight.attritionRisk > 0.5 ? 'bg-red-500' :
                                insight.attritionRisk > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${insight.attritionRisk * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-900">{Math.round(insight.attritionRisk * 100)}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-2">Top Factors:</p>
                        <ul className="space-y-1">
                          {insight.topFactors?.map((factor: any, idx: number) => (
                            <li key={idx} className="text-sm text-slate-700">
                              • {factor.feature}: {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-200">{insight.explain}</p>

                      {insight.fallback && (
                        <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                          <p className="text-xs text-amber-800">⚠️ Using fallback heuristics. {insight.todo}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {performanceData.latestReview && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest Performance Review</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-2">Strengths</p>
                          <p className="text-slate-900">{performanceData.latestReview.strengths}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-2">Areas for Improvement</p>
                          <p className="text-slate-900">{performanceData.latestReview.areasForImprovement}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-2">Goals</p>
                          <p className="text-slate-900">{performanceData.latestReview.goals}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No performance data available for this employee
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
