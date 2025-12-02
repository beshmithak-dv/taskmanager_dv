import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, User, Flag, Tag, Clock } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description: string;
  assignee: string;
  status: 'Pending' | 'In-Progress' | 'Completed';
  client_id: string;
  category: string;
  due_date: string | null;
  start_date: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[] | null;
}

interface Comment {
  id: string;
  user_email: string;
  comment_text: string;
  created_at: string;
}

interface TaskDetailsProps {
  taskId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export function TaskDetails({ taskId, onClose, onUpdate }: TaskDetailsProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (error) throw error;
      setTask(data);
      setEditedTask(data || {});
    } catch (err) {
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          user_id: userData.user.id,
          user_email: userData.user.email || 'Unknown',
          comment_text: newComment,
        }]);

      if (error) throw error;

      setNewComment('');
      await fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const updateTask = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(editedTask)
        .eq('id', taskId);

      if (error) throw error;

      setIsEditing(false);
      await fetchTask();
      onUpdate?.();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700';
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Medium':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In-Progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Task not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-blue-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Task Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.name || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
                  className="w-full px-4 py-2 border border-blue-200 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">{task.name}</h3>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Flag className="w-4 h-4 inline mr-1" />
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={editedTask.status || task.status}
                    onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In-Progress">In-Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Flag className="w-4 h-4 inline mr-1" />
                  Priority
                </label>
                {isEditing ? (
                  <select
                    value={editedTask.priority || task.priority}
                    onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask.start_date ? new Date(editedTask.start_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{formatDate(task.start_date)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Due Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask.due_date ? new Date(editedTask.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div>
                    <p className="text-slate-900">{formatDate(task.due_date)}</p>
                    {isOverdue(task.due_date) && task.status !== 'Completed' && (
                      <p className="text-xs text-red-600 mt-1">Task is overdue</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Assignee
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.assignee || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-slate-900">{task.assignee || 'Unassigned'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.tags?.join(', ') || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                  placeholder="Enter tags separated by commas"
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {task.tags && task.tags.length > 0 ? (
                    task.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No tags</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              {isEditing ? (
                <textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description..."
                />
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {task.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={updateTask}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedTask(task);
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Edit Task
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-blue-100 pt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Activity & Comments</h3>

            <div className="space-y-4 mb-4">
              {comments.length === 0 ? (
                <p className="text-slate-500 text-sm">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {comment.user_email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 text-sm">
                          {comment.user_email.split('@')[0]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm">{comment.comment_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
