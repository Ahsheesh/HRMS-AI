import { useState, useEffect } from 'react';
import { Users, ClipboardCheck, FolderKanban, TrendingUp, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { employeesAPI, onboardingAPI, performanceAPI, allocationsAPI } from '../services/api';

// A simple calendar component
const Calendar = () => {
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const onChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedDate) {
      setNotes({ ...notes, [selectedDate.toDateString()]: e.target.value });
    }
  };

  const renderHeader = () => {
    const dateFormat = "MMMM yyyy";
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() - 1)))}>&lt;</button>
        <span>{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() + 1)))}>&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEE";
    const days = [];
    let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-semibold text-sm" key={i}>
          {new Date(startDate.setDate(startDate.getDate())).toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
      );
      startDate.setDate(startDate.getDate() + 1)
    }
    return <div className="grid grid-cols-7">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(monthEnd);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }


    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = day.toDateString();
        const cloneDay = new Date(day);
        days.push(
          <div
            className={`text-center p-2 cursor-pointer rounded-full ${
              day.getMonth() !== date.getMonth()
                ? "text-gray-400"
                : selectedDate?.toDateString() === formattedDate
                ? "bg-blue-500 text-white"
                : "text-gray-700"
            } ${notes[formattedDate] ? 'bg-yellow-200' : ''}`}
            key={day.toString()}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span>{day.getDate()}</span>
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };


  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Calendar & Notes</h2>
        {renderHeader()}
        {renderDays()}
        {renderCells()}
        {selectedDate && (
            <div className="mt-4">
                <h3 className="text-lg font-semibold">Notes for {selectedDate.toLocaleDateString()}</h3>
                <textarea
                    className="w-full h-24 p-2 border rounded"
                    value={notes[selectedDate.toDateString()] || ""}
                    onChange={handleNoteChange}
                />
            </div>
        )}
    </div>
  );
};


const EmailModal = ({ onClose, employees }: { onClose: () => void, employees: any[] }) => {
    const [subject, setSubject] = useState("Important Announcement");
    const [body, setBody] = useState("Hello Team,\n\nPlease review the attached document.\n\nThanks,\nManagement");

    const handleSend = () => {
        const recipients = employees.map(e => e.userId.email).join(',');
        window.location.href = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 w-1/2">
                <h2 className="text-2xl font-bold mb-4">Send Email to All Employees</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Body</label>
                    <textarea value={body} onChange={e => setBody(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 h-48"></textarea>
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onboardingCount: 0,
    activeProjects: 0,
    avgPerformance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ name: string; value: number }[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [employees, setEmployees] = useState([]);


  useEffect(() => {
    loadStats();
    loadTasks();
  }, []);

  const loadTasks = async () => {
      try {
          // just getting all tasks for now
          const allEmployees = await employeesAPI.getAll();
          setEmployees(allEmployees);
          const allTasks = await Promise.all(allEmployees.map((e:any) => onboardingAPI.getTasks(e._id)));
          setTasks(allTasks.flat());
      } catch(e) {
        console.error(e);
      }
  }

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

      const totalPresent = employees.reduce((acc: number, e: any) => acc + e.attendance.filter((a:any) => a.status === 'Present').length, 0);
      const totalLate = employees.reduce((acc: number, e: any) => acc + e.attendance.filter((a:any) => a.status === 'Late').length, 0);
      const totalAbsent = employees.reduce((acc: number, e: any) => acc + e.attendance.filter((a:any) => a.status === 'Absent').length, 0);

      setAttendanceData([
          { name: 'Present', value: totalPresent },
          { name: 'Late', value: totalLate },
          { name: 'Absent', value: totalAbsent },
      ]);


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
        {showEmailModal && <EmailModal onClose={() => setShowEmailModal(false)} employees={employees} />}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Total Attendance</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Upcoming and Current Tasks</h2>
                <div className="space-y-3">
                    {tasks.slice(0, 5).map((task: any) => (
                        <div key={task._id} className="p-4 bg-slate-50 rounded-lg">
                           <p className="font-semibold text-slate-900">{task.title}</p>
                           <p className="text-sm text-slate-600">{task.description}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
        <div className="lg:col-span-1 space-y-6">
            <Calendar />
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <button onClick={() => setShowEmailModal(true)} className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                        <Mail className="text-blue-600" />
                        <p className="font-semibold text-blue-900">Email All Employees</p>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">Send a mass email to all employees.</p>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}