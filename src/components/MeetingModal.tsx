import { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MeetingModalProps {
  onClose: () => void;
  onSave: () => void;
  preselectedDate?: string | null;
}

export function MeetingModal({ onClose, onSave, preselectedDate }: MeetingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(preselectedDate || '');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedDate) {
      setDate(preselectedDate);
    }
  }, [preselectedDate]);

  const handleSave = async () => {
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

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('You must be logged in to create a meeting');
        return;
      }

      const { error: insertError } = await supabase
        .from('meetings')
        .insert([{
          user_id: userData.user.id,
          title: title.trim(),
          description: description.trim(),
          date,
          time: time.trim(),
        }]);

      if (insertError) throw insertError;

      onSave();
    } catch (err: any) {
      console.error('Error saving meeting:', err);
      setError(err.message || 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-lg">
        <div className="sticky top-0 bg-white border-b border-blue-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-900">Add Meeting</h2>
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
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Meeting Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date *
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter meeting description (optional)"
              rows={4}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-t border-blue-100 px-6 py-4 flex gap-3 justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
          >
            {saving ? 'Saving...' : 'Save Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}
