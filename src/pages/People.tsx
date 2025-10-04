import { useState, useEffect } from 'react';
import { User, Mail, Briefcase } from 'lucide-react';
import { employeesAPI } from '../services/api';

export default function People() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeesAPI.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">People</h1>
        <p className="text-slate-600 mt-2">Manage your team members</p>
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
              <div key={emp.id || emp._id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
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
    </div>
  );
}
