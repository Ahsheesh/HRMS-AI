import { useState, useEffect } from 'react';
import { User, Mail, Briefcase, X, TrendingUp, Award, Calendar, Target, Clock, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { employeesAPI, performanceAPI, aiAPI } from '../services/api'; // Assuming aiAPI is correctly imported

// Use API_URL from env or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// Use AI_URL proxy path defined in vite.config.ts
const AI_URL = '/ai-api';

// Interface definitions (ensure they match your actual API response)
interface EmployeeSummary {
  _id: string;
  employeeId: string;
  userId?: { firstName: string; lastName: string; email: string };
  jobTitle: string;
  department: string;
  skills: string[];
  status: 'active' | 'onboarding' | 'inactive';
  currentAllocationPercent: number;
  // Add other fields if needed, e.g., hireDate from the API response
  hireDate?: string;
  attendance?: any[]; // Simplified for summary card, detail fetched separately
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
    date: string; // Should be Date object or string that can be parsed
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

// AI Insight interface (adjust based on your actual API response)
interface AIInsight {
  employeeId: string;
  attritionRisk: number;
  topFactors: Array<{ feature: string; impact: number }>;
  explain: string;
  fallback: boolean;
  todo?: string;
}


export default function People() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [radarImage, setRadarImage] = useState<string>('');
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [error, setError] = useState<string>('');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // For Pie/Doughnut charts


  useEffect(() => {
    loadEmployees();
  }, []);

  // Fetch detailed data only when the modal opens for the selected employee
  useEffect(() => {
    if (selectedEmployee && showDetailModal) {
      fetchPerformanceData(selectedEmployee._id);
      loadInsight(selectedEmployee._id); // Fetch AI insight when modal opens
    } else {
      // Clear data when modal closes or employee changes
      setPerformanceData(null);
      setRadarImage('');
      setInsight(null);
      setError('');
    }
  }, [selectedEmployee, showDetailModal]);

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await employeesAPI.getAll();
      // Ensure the fetched data matches the EmployeeSummary interface structure
      setEmployees(data.map((emp: any) => ({
        _id: emp._id,
        employeeId: emp.employeeId,
        userId: emp.userId ? { firstName: emp.userId.firstName, lastName: emp.userId.lastName, email: emp.userId.email } : undefined,
        jobTitle: emp.jobTitle,
        department: emp.department,
        skills: emp.skills || [],
        status: emp.status || 'active',
        currentAllocationPercent: emp.currentAllocationPercent || 0,
        hireDate: emp.hireDate
      })));
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      setError(`Failed to load employees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async (employeeId: string) => {
    setLoadingPerformance(true);
    setError(''); // Clear previous errors specific to performance data
    try {
      const token = localStorage.getItem('token');
      // Use the environment variable or default API URL
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
           setError(`Failed to generate radar chart: ${radarErr.message}`)
        }
      }

    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(`Failed to load performance data: ${err.message}`);
      setPerformanceData(null); // Ensure data is cleared on error
      setRadarImage('');
    } finally {
      setLoadingPerformance(false);
    }
  };

 const loadInsight = async (employeeId: string) => {
    setInsight(null); // Clear previous insight
    try {
      // Use aiAPI service which should handle the proxy path '/ai-api'
      const data = await aiAPI.perfInsight(employeeId);
      setInsight(data);
    } catch (error: any) {
      console.error('Failed to load insight:', error);
      // Set error state specific to insight loading if needed
      // setError(`Failed to load AI insight: ${error.message}`);
    }
  };


  const handleEmployeeClick = (emp: EmployeeSummary) => {
    setSelectedEmployee(emp);
    setShowDetailModal(true);
  };

   const closeModal = () => {
    setShowDetailModal(false);
    setSelectedEmployee(null); // Clear selected employee when modal closes
  };

  if (loading && employees.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><p className="ml-3 text-slate-600">Loading employees...</p></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">People Directory</h1>
        <p className="text-slate-600 mt-2">Manage your team members and view their performance</p>
      </div>

       {error && !showDetailModal && ( // Only show general error if modal is closed
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}


      {employees.length === 0 && !loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
          <User className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees found</h3>
          <p className="text-slate-600 mb-4">Add employees to see them listed here.</p>
          {/* Consider adding an "Add Employee" button if applicable */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => {
            const firstName = emp.userId?.firstName || 'Unknown';
            const lastName = emp.userId?.lastName || 'User';

            return (
              <div
                key={emp._id}
                className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 ease-in-out"
                onClick={() => handleEmployeeClick(emp)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl flex-shrink-0">
                    {firstName[0]}{lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-lg truncate" title={`${firstName} ${lastName}`}>
                      {firstName} {lastName}
                    </h3>
                    <p className="text-slate-600 text-sm mt-1 truncate" title={emp.jobTitle}>{emp.jobTitle}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 truncate" title={emp.department}>
                      <Briefcase size={12} />
                      {emp.department}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  {emp.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                      {emp.skills.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          +{emp.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No skills listed</p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium capitalize ${
                      emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      emp.status === 'onboarding' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {emp.status}
                    </span>
                    <span className="text-slate-500">
                      Allocation: {emp.currentAllocationPercent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Modal Content */}
          <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
             {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between z-10 flex-shrink-0 rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedEmployee.userId?.firstName} {selectedEmployee.userId?.lastName}
                </h2>
                <p className="text-slate-600 text-sm mt-1">{selectedEmployee.jobTitle}</p>
                 <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Mail size={12} /><span>{selectedEmployee.userId?.email || 'No email'}</span>
                    <span className="mx-1">|</span>
                    <Briefcase size={12} /><span>{selectedEmployee.department}</span>
                     <span className="mx-1">|</span>
                    <Calendar size={12} /><span>Hired: {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : 'N/A'}</span>
                 </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
               {error && ( // Show error specific to performance data loading inside modal
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {loadingPerformance ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                   <p className="text-slate-600">Loading detailed performance data...</p>
                </div>
              ) : performanceData ? (
                <div className="space-y-6">
                   {/* Stat Cards */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {/* Attendance Rate */}
                     <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Attendance</p>
                           <p className="text-2xl font-bold text-green-900 mt-1">{performanceData.attendanceStats.presentPercentage}%</p>
                         </div>
                         <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Calendar className="text-green-600" size={20} />
                         </div>
                       </div>
                     </div>
                     {/* On-Time Completion */}
                     <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg shadow-sm border border-blue-200 p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">On-Time Tasks</p>
                           <p className="text-2xl font-bold text-blue-900 mt-1">{performanceData.taskStats.onTimeCompletionRate}%</p>
                         </div>
                         <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Target className="text-blue-600" size={20} />
                         </div>
                       </div>
                     </div>
                      {/* Avg Task Time */}
                     <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-sm border border-orange-200 p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-xs font-medium text-orange-700 uppercase tracking-wider">Avg Task Time</p>
                           <p className="text-2xl font-bold text-orange-900 mt-1">{performanceData.taskStats.avgCompletionTimeHours}h</p>
                         </div>
                         <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Clock className="text-orange-600" size={20} />
                         </div>
                       </div>
                     </div>
                      {/* Latest Score */}
                     <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Latest Score</p>
                           <p className="text-2xl font-bold text-indigo-900 mt-1">
                             {performanceData.latestReview ? performanceData.latestReview.averageScore.toFixed(1) : 'N/A'}
                           </p>
                         </div>
                         <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Award className="text-indigo-600" size={20} />
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Award size={20} className="text-indigo-600" />
                        Performance Radar
                      </h3>
                      {radarImage ? (
                        <div className="flex items-center justify-center min-h-[300px]">
                          <img src={radarImage} alt="Performance Radar Chart" className="max-w-full h-auto" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
                           { performanceData.coreCompetencies ? 'Generating radar chart...' : 'No competency data for radar chart.' }
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
                          <LineChart data={performanceData.performanceHistory} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                            <XAxis dataKey="period" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11, fill: '#64748b' }} interval={0}/>
                            <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748b' }}/>
                            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Avg Score" dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-slate-500">
                          No performance history
                        </div>
                      )}
                    </div>
                    {/* Monthly Attendance */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                       <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                         <Calendar size={20} className="text-green-600" />
                         Attendance (Last 6 Months)
                       </h3>
                      {performanceData.attendanceStats.monthlyBreakdown && performanceData.attendanceStats.monthlyBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={performanceData.attendanceStats.monthlyBreakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                          No attendance data
                        </div>
                      )}
                    </div>

                    {/* Competency Scores Bar Chart - *** FIX APPLIED HERE *** */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Award size={20} className="text-indigo-600" />
                        Competencies (Latest)
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
                              // Punctuality might be better shown separately or as a KPI card
                            ]}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                            <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748b' }}/>
                            <YAxis type="category" dataKey="skill" width={100} tick={{ fontSize: 11, fill: '#64748b' }}/>
                            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                            <Bar dataKey="score" fill="#4f46e5" name="Score" barSize={25} radius={[0, 4, 4, 0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-slate-500">
                          No competency data
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Insight Section */}
                  {insight ? (
                    <div className={`rounded-xl shadow-sm p-6 border ${
                      insight.fallback ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        {insight.attritionRisk > 0.5 ? (
                          <AlertTriangle className="text-red-600" size={20} />
                        ) : (
                          <TrendingUp className="text-emerald-600" size={20} />
                        )}
                        <h3 className="text-lg font-semibold text-slate-900">AI Performance Insight</h3>
                         {insight.fallback && <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-medium">Fallback</span>}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-slate-600 mb-1 font-medium">Predicted Attrition Risk</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ease-out ${
                                insight.attritionRisk > 0.66 ? 'bg-red-500' :
                                insight.attritionRisk > 0.33 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${insight.attritionRisk * 100}%` }}
                            />
                          </div>
                          <span className={`font-semibold text-lg ${
                                insight.attritionRisk > 0.66 ? 'text-red-600' :
                                insight.attritionRisk > 0.33 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {Math.round(insight.attritionRisk * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-2">Top Factors Influencing Risk:</p>
                          {insight.topFactors && insight.topFactors.length > 0 ? (
                            <ul className="space-y-1">
                              {insight.topFactors.map((factor: any, idx: number) => (
                                <li key={idx} className="text-sm text-slate-700 flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${factor.impact > 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                                  <span>{factor.feature}: {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-slate-500 italic">No specific factors identified.</p> }
                        </div>
                        <div>
                           <p className="text-sm font-semibold text-slate-900 mb-2">Explanation:</p>
                           <p className="text-sm text-slate-700 bg-slate-100 p-3 rounded-md">{insight.explain}</p>
                        </div>
                      </div>


                      {insight.fallback && insight.todo && (
                        <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                          <p className="text-xs text-amber-800 font-medium">⚠️ Note: Using fallback heuristics. {insight.todo}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                     <div className="rounded-xl shadow-sm p-6 border bg-blue-50 border-blue-200 text-center text-sm text-blue-700">
                        Loading AI insight...
                     </div>
                  )}


                  {/* Latest Review Summary */}
                  {performanceData.latestReview ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest Review Summary ({performanceData.latestReview.period})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="font-medium text-slate-600 mb-1 uppercase text-xs tracking-wider">Strengths</p>
                          <p className="text-slate-800">{performanceData.latestReview.strengths || <span className="italic text-slate-500">None noted</span>}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-600 mb-1 uppercase text-xs tracking-wider">Areas for Improvement</p>
                          <p className="text-slate-800">{performanceData.latestReview.areasForImprovement || <span className="italic text-slate-500">None noted</span>}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-600 mb-1 uppercase text-xs tracking-wider">Goals</p>
                          <p className="text-slate-800">{performanceData.latestReview.goals || <span className="italic text-slate-500">None noted</span>}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                     <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center text-slate-500">
                        No performance review data available.
                     </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  {error ? `Error: ${error}` : 'No performance data available for this employee.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}