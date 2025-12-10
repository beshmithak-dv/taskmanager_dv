import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, AlertCircle, Plus, Calendar, MoreVertical, Paperclip, Flag, User } from 'lucide-react';
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
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  created_at: string;
  attachment_count?: number;
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
        .select('id, name, description, assignee, status, client_id, category, due_date, priority, created_at')
        .order('created_at', { ascending: false });

      if (selectedClientId && selectedCategory) {
        query = query
          .eq('client_id', selectedClientId)
          .eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      const tasksWithAttachments = await Promise.all(
        (data || []).map(async (task) => {
          const { count } = await supabase
            .from('task_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id);

          return {
            ...task,
            attachment_count: count || 0,
          };
        })
      );

      setTasks(tasksWithAttachments);
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

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In-Progress':
        return 'bg-blue-500';
      default:
        return 'bg-red-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In-Progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No tasks yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusDotColor(task.status)} flex-shrink-0 mt-1.5`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-semibold text-slate-900 leading-tight">
                        {task.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      {truncateDescription(task.description)}
                    </p>

                    {task.attachment_count && task.attachment_count > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs text-slate-600 font-medium">
                            {task.attachment_count} {task.attachment_count === 1 ? 'file' : 'files'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(task.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {task.priority}
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(task.status)}`}>
                        {task.status === 'Completed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : task.status === 'In-Progress' ? (
                          <Circle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {task.status}
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.due_date)}
                      </span>

                      {task.assignee && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                          <User className="w-3 h-3" />
                          {task.assignee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
