import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Circle, Clock, Loader2 } from 'lucide-react';
import { employeesAPI, onboardingAPI, aiAPI } from '../services/api';

export default function Onboarding() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadTasks(selectedEmployee._id);
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await employeesAPI.getAll();
      setEmployees(data);
      if (data.length > 0) {
        const onboarding = data.find((e: any) => e.status === 'onboarding');
        setSelectedEmployee(onboarding || data[0]);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (employeeId: string) => {
    try {
      const data = await onboardingAPI.getTasks(employeeId);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleGenerateOnboarding = async () => {
    if (!selectedEmployee) return;

    setGenerating(true);
    setAiResponse(null);

    try {
      const response = await aiAPI.generateOnboarding({
        jobTitle: selectedEmployee.jobTitle,
        jobDescription: `${selectedEmployee.jobTitle} role in ${selectedEmployee.department} department. Skills: ${selectedEmployee.skills.join(', ')}`,
        companyContext: 'HRMS Demo Company',
        constraints: { maxTasks: 8, lang: 'en', format: 'short' },
      });

      setAiResponse(response);

      // Auto-import tasks
      if (response.generatedChecklist && response.generatedChecklist.length > 0) {
        await onboardingAPI.bulkCreate(
          selectedEmployee._id,
          response.generatedChecklist.map((task: any) => ({
            ...task,
            generatedByAI: true,
            status: 'pending',
          }))
        );

        await loadTasks(selectedEmployee._id);
      }
    } catch (error) {
      console.error('Failed to generate onboarding:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updates: any = { status: newStatus };

    if (newStatus === 'completed') {
      updates.completedAt = new Date();
    } else {
      updates.completedAt = null;
    }

    try {
      await onboardingAPI.updateTask(task._id, updates);
      await loadTasks(selectedEmployee._id);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const phaseLabels: Record<string, string> = {
    day1: 'Day 1',
    week1: 'Week 1',
    month1: 'Month 1',
    month3: 'Month 3',
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.phase]) acc[task.phase] = [];
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading onboarding...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Onboarding</h1>
          <p className="text-slate-600 mt-2">Manage employee onboarding tasks and progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Employees</h2>
          <div className="space-y-2">
            {employees.map((emp) => (
              <button
                key={emp._id}
                onClick={() => setSelectedEmployee(emp)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedEmployee?._id === emp._id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <p className="font-semibold text-slate-900">{emp.userId?.firstName} {emp.userId?.lastName}</p>
                <p className="text-sm text-slate-600">{emp.jobTitle}</p>
                <p className={`text-xs mt-1 font-medium ${
                  emp.status === 'onboarding' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {emp.status === 'onboarding' ? 'Onboarding' : 'Active'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEmployee && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedEmployee.userId?.firstName} {selectedEmployee.userId?.lastName}
                    </h2>
                    <p className="text-slate-600">{selectedEmployee.jobTitle}</p>
                  </div>
                  <button
                    onClick={handleGenerateOnboarding}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate from JD
                      </>
                    )}
                  </button>
                </div>

                {aiResponse && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    aiResponse.fallback ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'
                  }`}>
                    <p className="text-sm font-semibold mb-2">
                      {aiResponse.fallback ? '⚠️ Fallback Mode' : '✓ AI Generated'}
                    </p>
                    <p className="text-sm text-slate-700">{aiResponse.rationale}</p>
                    {aiResponse.fallback && aiResponse.todo && (
                      <p className="text-xs text-amber-700 mt-2">{aiResponse.todo}</p>
                    )}
                  </div>
                )}
              </div>

              {Object.keys(phaseLabels).map((phase) => {
                const phaseTasks = groupedTasks[phase] || [];
                if (phaseTasks.length === 0) return null;

                return (
                  <div key={phase} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">{phaseLabels[phase]}</h3>
                    <div className="space-y-3">
                      {phaseTasks.map((task: any) => (
                        <div
                          key={task._id}
                          className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="mt-1 flex-shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 size={20} className="text-emerald-600" />
                            ) : task.status === 'in_progress' ? (
                              <Clock size={20} className="text-blue-600" />
                            ) : (
                              <Circle size={20} className="text-slate-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={`font-semibold ${
                              task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}>
                              {task.title}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                            {task.duration && (
                              <p className="text-xs text-slate-500 mt-2">Duration: {task.duration}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
