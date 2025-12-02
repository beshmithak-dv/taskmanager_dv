import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, AlertCircle, Calendar } from 'lucide-react';
import { TaskDetails } from './TaskDetails';

interface Task {
  id: string;
  name: string;
  assignee: string;
  status: 'Pending' | 'In-Progress' | 'Completed';
  due_date: string | null;
}

interface InboxPageProps {
  onTasksUpdated?: () => void;
}

export function InboxPage({ onTasksUpdated }: InboxPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, assignee, status, due_date')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        );
      case 'In-Progress':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
            <Circle className="w-4 h-4" />
            In-Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-slate-50 text-slate-700">
            <AlertCircle className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === -1) return 'Due yesterday';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 1) return 'Due tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseDetails = () => {
    setSelectedTaskId(null);
  };

  const handleTaskUpdate = () => {
    fetchAllTasks();
    onTasksUpdated?.();
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
        <p className="mt-2 text-slate-600">All tasks from all clients</p>
      </div>

      <div className="bg-white rounded-xl border border-blue-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Task Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Assignee
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No tasks yet
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {task.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {task.assignee || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : 'text-slate-700'}>
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                      {isOverdue(task.due_date, task.status) && (
                        <p className="text-xs text-red-600 mt-1">
                          Task is overdue. Due Date was {formatDate(task.due_date)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetails
          taskId={selectedTaskId}
          onClose={handleCloseDetails}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}
