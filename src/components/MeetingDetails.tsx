import { useState } from 'react';
import { X, Calendar, Clock, FileText, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  created_at: string;
}

interface MeetingDetailsProps {
  meeting: Meeting;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export function MeetingDetails({ meeting, onClose, onUpdate, onDelete }: MeetingDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [description, setDescription] = useState(meeting.description);
  const [date, setDate] = useState(meeting.date);
  const [time, setTime] = useState(meeting.time);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('meetings')
        .update({
          title: title.trim(),
          description: description.trim(),
          date,
          time: time.trim(),
        })
        .eq('id', meeting.id);

      if (updateError) throw updateError;

      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      console.error('Error updating meeting:', err);
      setError(err.message || 'Failed to update meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meeting.id);

      if (deleteError) throw deleteError;

      onDelete();
    } catch (err: any) {
      console.error('Error deleting meeting:', err);
      setError(err.message || 'Failed to delete meeting');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-blue-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-900">Meeting Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Meeting Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-lg font-semibold text-slate-900">{meeting.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-slate-900">{formatDate(meeting.date)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time
            </label>
            {isEditing ? (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-slate-900">{meeting.time || 'Not specified'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="bg-slate-50 rounded-lg p-4 border border-blue-100">
                <p className="text-slate-700 whitespace-pre-wrap">
                  {meeting.description || 'No description provided'}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(meeting.title);
                    setDescription(meeting.description);
                    setDate(meeting.date);
                    setTime(meeting.time);
                    setError('');
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:bg-red-200 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
