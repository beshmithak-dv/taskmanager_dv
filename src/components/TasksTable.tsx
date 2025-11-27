import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, AlertCircle, Plus } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface TasksTableProps {
  selectedCategoryId?: string | null;
  selectedClientName?: string | null;
}

export function TasksTable({ selectedCategoryId, selectedClientName }: TasksTableProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', status: 'pending' });

  useEffect(() => {
    fetchTasks();
  }, [selectedCategoryId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, assignee, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([
        {
          id: '1',
          title: 'Boost Weekly',
          assignee: 'Vikram',
          status: 'in-progress',
        },
        {
          id: '2',
          title: 'SQR',
          assignee: 'Durga',
          status: 'completed',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([newTask]);

      if (error) throw error;

      setNewTask({ title: '', assignee: '', status: 'pending' });
      setIsAddingTask(false);
      await fetchTasks();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        );
      case 'in-progress':
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

  return (
    <div className="bg-white rounded-xl border border-blue-100 shadow-sm">
      <div className="p-6 border-b border-blue-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Tasks</h2>
          {selectedClientName && (
            <p className="text-sm text-slate-500 mt-1">{selectedClientName}</p>
          )}
        </div>
        <button
          onClick={() => setIsAddingTask(!isAddingTask)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {isAddingTask && (
        <div className="px-6 py-4 border-b border-blue-100 bg-slate-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Task Name</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task name"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assignee</label>
              <input
                type="text"
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                placeholder="Name"
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In-Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTask}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
            >
              Save Task
            </button>
            <button
              onClick={() => {
                setIsAddingTask(false);
                setNewTask({ title: '', assignee: '', status: 'pending' });
              }}
              className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  Loading tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  No tasks yet
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {task.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{task.assignee}</td>
                  <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
