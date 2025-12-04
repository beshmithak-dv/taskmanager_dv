import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MeetingModal } from './MeetingModal';
import { MeetingDetails } from './MeetingDetails';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  created_at: string;
}

const INDIA_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'New Year' },
  { date: '2026-01-15', name: 'Pongal' },
  { date: '2026-01-16', name: 'Thiruvalluvar Day' },
  { date: '2026-03-20', name: 'Ramzan (Eid-ul-Fitr)' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-14', name: 'Tamil New Year' },
  { date: '2026-05-01', name: 'May Day' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-09-16', name: 'Vinayakar Chathurthi' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-10-19', name: 'Ayutha Poojai' },
  { date: '2026-11-08', name: 'Deepavali' },
  { date: '2026-12-25', name: 'Christmas' },
];

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (dateStr: string) => {
    return INDIA_HOLIDAYS_2026.find(h => h.date === dateStr);
  };

  const getMeetingsForDate = (dateStr: string) => {
    return meetings.filter(m => m.date === dateStr);
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-blue-100" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateString(year, month, day);
      const isWeekendDay = isWeekend(date);
      const holiday = isHoliday(dateStr);
      const dayMeetings = getMeetingsForDate(dateStr);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`h-32 border border-blue-100 p-2 relative transition-all hover:shadow-md cursor-pointer ${
            isWeekendDay || holiday ? 'bg-red-50' : 'bg-white'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => {
            setSelectedDate(dateStr);
            setIsAddingMeeting(true);
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-semibold ${
              isWeekendDay || holiday ? 'text-red-700' : 'text-slate-700'
            }`}>
              {day}
            </span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-20">
            {holiday && (
              <div className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md truncate">
                {holiday.name}
              </div>
            )}
            {dayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMeeting(meeting);
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md truncate hover:bg-blue-200 transition-colors"
              >
                {meeting.time && <span className="font-medium">{meeting.time}</span>} {meeting.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMeetingAdded = () => {
    fetchMeetings();
    setIsAddingMeeting(false);
    setSelectedDate(null);
  };

  const handleMeetingUpdated = () => {
    fetchMeetings();
    setSelectedMeeting(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-2 text-slate-600">Manage your meetings and holidays</p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(null);
            setIsAddingMeeting(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Meeting
        </button>
      </div>

      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>

          <h2 className="text-2xl font-bold text-slate-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        </div>

        <div className="mb-4 flex gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
            <span>Holiday / Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Meeting</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0 border border-blue-100 rounded-lg overflow-hidden">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <div
              key={day}
              className="bg-slate-50 border-b border-blue-100 p-3 text-center font-semibold text-sm text-slate-700"
            >
              {day}
            </div>
          ))}
          {loading ? (
            <div className="col-span-7 p-8 text-center text-slate-500">
              Loading calendar...
            </div>
          ) : (
            renderCalendar()
          )}
        </div>
      </div>

      {isAddingMeeting && (
        <MeetingModal
          onClose={() => {
            setIsAddingMeeting(false);
            setSelectedDate(null);
          }}
          onSave={handleMeetingAdded}
          preselectedDate={selectedDate}
        />
      )}

      {selectedMeeting && (
        <MeetingDetails
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={handleMeetingUpdated}
          onDelete={handleMeetingUpdated}
        />
      )}
    </div>
  );
}
