import { useState } from 'react';
import { Users, Briefcase } from 'lucide-react';
import Recruitment from './Recruitment';
import Onboarding from './Onboarding';

export default function Talent() {
  const [activeTab, setActiveTab] = useState<'recruitment' | 'onboarding'>('recruitment');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Talent Management</h1>
        <p className="text-slate-600 mt-2">Manage recruitment and onboarding processes</p>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('recruitment')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'recruitment'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={20} />
            Recruitment
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'onboarding'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={20} />
            Onboarding
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'recruitment' ? <Recruitment /> : <Onboarding />}
      </div>
    </div>
  );
}
