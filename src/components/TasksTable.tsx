import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, AlertCircle, Plus, Calendar } from 'lucide-react';
import { TaskDetails } from './TaskDetails';

interface Task {
  id: string;
  name: string;
  description: string;
  assignee: string;
  status: 'Pending' | 'In-Progress' | 'Completed';
  client_id: string;
  category: string;
  due_date: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface TasksTableProps {
  selectedClientId?: string | null;
  selectedCategory?: string | null;
  selectedClientName?: string | null;
  onTasksUpdated?: () => void;
}

export function TasksTable({ selectedClientId, selectedCategory, selectedClientName, onTasksUpdated }: TasksTableProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    assignee: '',
    status: 'Pending' as 'Pending' | 'In-Progress' | 'Completed',
    client_id: '',
    category: 'tasks' as 'tasks' | 'gtm' | 'recurring',
  });

  useEffect(() => {
    fetchTasks();
    fetchClients();
  }, [selectedClientId, selectedCategory]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('id, name, description, assignee, status, client_id, category, due_date')
        .order('created_at', { ascending: false });

      if (selectedClientId && selectedCategory) {
        query = query
          .eq('client_id', selectedClientId)
          .eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.name.trim()) return;
    if (!newTask.client_id) {
      alert('Please select a client');
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from('tasks')
        .insert([{
          user_id: userData.user.id,
          client_id: newTask.client_id,
          category: newTask.category,
          name: newTask.name,
          description: newTask.description,
          assignee: newTask.assignee,
          status: newTask.status,
        }]);

      if (error) throw error;

      setNewTask({
        name: '',
        description: '',
        assignee: '',
        status: 'Pending',
        client_id: '',
        category: 'tasks',
      });
      setIsAddingTask(false);
      await fetchTasks();
      onTasksUpdated?.();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseDetails = () => {
    setSelectedTaskId(null);
  };

  const handleTaskUpdate = () => {
    fetchTasks();
    onTasksUpdated?.();
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
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              placeholder="Enter task name"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Enter task description"
              rows={2}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
              <select
                value={newTask.client_id}
                onChange={(e) => setNewTask({ ...newTask, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value as 'tasks' | 'gtm' | 'recurring' })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tasks">Tasks</option>
                <option value="gtm">GTM</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
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
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value as 'Pending' | 'In-Progress' | 'Completed' })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Completed">Completed</option>
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
                setNewTask({
                  name: '',
                  description: '',
                  assignee: '',
                  status: 'Pending',
                  client_id: '',
                  category: 'tasks',
                });
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
                  <td className="px-6 py-4 text-sm text-slate-700">{task.assignee || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{formatDate(task.due_date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
