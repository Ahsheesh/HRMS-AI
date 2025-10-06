import { useState, useEffect } from 'react';
import { Users, ClipboardCheck, FolderKanban, TrendingUp, Plus, X, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { employeesAPI, onboardingAPI, performanceAPI, allocationsAPI } from '../services/api';

interface CalendarProps {
  onNavigate: (view: string) => void;
}

const Calendar = ({ onNavigate }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [noteText, setNoteText] = useState('');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setNoteText(notes[clickedDate.toDateString()] || '');
  };

  const handleSaveNote = () => {
    if (selectedDate && noteText.trim()) {
      setNotes({ ...notes, [selectedDate.toDateString()]: noteText });
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      const hasNote = !!notes[dateStr];
      const isSelected = selectedDate?.toDateString() === dateStr;

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-10 flex items-center justify-center rounded-lg transition-colors relative ${
            isSelected
              ? 'bg-blue-600 text-white font-semibold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {day}
          {hasNote && !isSelected && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Calendar & Notes</h2>

      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-slate-900">{monthName}</span>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {renderCalendarDays()}
      </div>

      {selectedDate && (
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            Notes for {selectedDate.toLocaleDateString()}
          </h3>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleSaveNote}
            className="w-full h-24 p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add your notes here..."
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


export default function Dashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onboardingCount: 0,
    activeProjects: 0,
    avgPerformance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [focusItems, setFocusItems] = useState<string[]>([]);
  const [newFocus, setNewFocus] = useState('');
  const [todoItems, setTodoItems] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([
    { id: '1', name: 'Arjun Sharma', type: 'Vacation', days: 3 },
    { id: '2', name: 'Priya Patel', type: 'Sick Leave', days: 1 },
  ]);
  const [attendanceData, setAttendanceData] = useState<{ name: string; value: number }[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);


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

      setEmployees(employees);

      const onboarding = employees.filter((e: any) => e.status === 'onboarding');
      const avgScore =
        reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + (r.average_score || r.averageScore || 0), 0) / reviews.length
          : 0;

      const today = new Date().toDateString();
      const todaysAttendance = employees.map((e: any) => {
          const attendanceRecord = e.attendance.find((a: any) => new Date(a.date).toDateString() === today);
          return attendanceRecord ? attendanceRecord.status : 'Absent';
      });

      const totalPresent = todaysAttendance.filter((status: string) => status === 'Present').length;
      const totalLate = todaysAttendance.filter((status: string) => status === 'Late').length;
      const totalAbsent = todaysAttendance.filter((status: string) => status === 'Absent').length;


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

  const handleAddFocus = () => {
    if (newFocus.trim()) {
      setFocusItems([...focusItems, newFocus.trim()]);
      setNewFocus('');
    }
  };

  const handleRemoveFocus = (index: number) => {
    setFocusItems(focusItems.filter((_, i) => i !== index));
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      setTodoItems([...todoItems, { id: Date.now().toString(), text: newTodo.trim(), completed: false }]);
      setNewTodo('');
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodoItems(todoItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleRemoveTodo = (id: string) => {
    setTodoItems(todoItems.filter(item => item.id !== id));
  };

  const handleApproveLeave = (id: string) => {
    setLeaveRequests(leaveRequests.filter(req => req.id !== id));
  };

  const handleDenyLeave = (id: string) => {
    setLeaveRequests(leaveRequests.filter(req => req.id !== id));
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
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
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

      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Today's Focus</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newFocus}
            onChange={(e) => setNewFocus(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddFocus()}
            placeholder="What is your main focus today?"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddFocus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {focusItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-900">{item}</span>
              <button
                onClick={() => handleRemoveFocus(index)}
                className="text-slate-400 hover:text-red-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate && onNavigate('performance-analysis')}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Today's Attendance</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Calendar onNavigate={onNavigate || (() => {})} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <button onClick={() => setShowEmailModal(true)} className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <Mail className="text-blue-600" />
                <p className="font-semibold text-blue-900">Email All Employees</p>
              </div>
              <p className="text-sm text-blue-700 mt-1">Send a mass email to all employees.</p>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-900">To-Do List</h2>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add a new task..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTodo}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todoItems.map((task) => (
                <div key={task.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTodo(task.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                    />
                    <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.text}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveTodo(task.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Leave Requests</h2>
            <div className="space-y-2">
              {leaveRequests.length > 0 ? (
                leaveRequests.map((request) => (
                  <div key={request.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-900">{request.name}</p>
                    <p className="text-sm text-slate-600">{request.type}: {request.days} {request.days === 1 ? 'day' : 'days'}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleApproveLeave(request.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDenyLeave(request.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No pending leave requests</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate && onNavigate('people')}
      >
        <h2 className="text-xl font-bold text-slate-900 mb-4">Team Directory</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {employees.slice(0, 5).map((e: any) => (
            <div key={e._id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                {e.userId?.firstName?.[0]}{e.userId?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{e.userId?.firstName} {e.userId?.lastName}</p>
                <p className="text-sm text-slate-500">{e.jobTitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}