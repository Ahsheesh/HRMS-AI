import { useState, useEffect } from 'react';
import { Users, ClipboardCheck, BarChart3, FolderKanban, TrendingUp, AlertCircle } from 'lucide-react';
import { employeesAPI, onboardingAPI, performanceAPI, allocationsAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onboardingCount: 0,
    activeProjects: 0,
    avgPerformance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [employees, allocations, reviews] = await Promise.all([
        employeesAPI.getAll(),
        allocationsAPI.getAll({ status: 'active' }),
        performanceAPI.getAll(),
      ]);

      const onboarding = employees.filter((e: any) => e.status === 'onboarding');
      const avgScore =
        reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + (r.average_score || r.averageScore || 0), 0) / reviews.length
          : 0;

      setStats({
        totalEmployees: employees.length,
        onboardingCount: onboarding.length,
        activeProjects: new Set(allocations.map((a: any) => a.project_id || a.projectId)).size,
        avgPerformance: avgScore,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Onboarding',
      value: stats.onboardingCount,
      icon: ClipboardCheck,
      color: 'amber',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderKanban,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Avg Performance',
      value: stats.avgPerformance.toFixed(1),
      icon: TrendingUp,
      color: 'violet',
      bgColor: 'bg-violet-100',
      textColor: 'text-violet-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to your HRMS overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={card.textColor} size={24} />
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-sm font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <p className="font-semibold text-blue-900">Add New Employee</p>
              <p className="text-sm text-blue-700 mt-1">Create employee profile and start onboarding</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
              <p className="font-semibold text-emerald-900">Create Project</p>
              <p className="text-sm text-emerald-700 mt-1">Set up new project and allocate resources</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors">
              <p className="font-semibold text-violet-900">Schedule Review</p>
              <p className="text-sm text-violet-700 mt-1">Start performance evaluation cycle</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
              <div>
                <p className="font-semibold text-slate-900">API Service</p>
                <p className="text-sm text-slate-600">Connected and operational</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
              <div>
                <p className="font-semibold text-slate-900">AI Service</p>
                <p className="text-sm text-slate-600">Running in fallback mode</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
              <div>
                <p className="font-semibold text-slate-900">Database</p>
                <p className="text-sm text-slate-600">Supabase connected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
