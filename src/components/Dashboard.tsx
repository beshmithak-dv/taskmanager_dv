import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TasksTable } from './TasksTable';
import { LogOut } from 'lucide-react';

interface SummaryCard {
  label: string;
  count: number;
  color: string;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([
    { label: 'Tasks To Do', count: 0, color: 'bg-blue-50' },
    { label: 'Tasks Completed', count: 0, color: 'bg-green-50' },
    { label: 'Tasks In-Progress', count: 0, color: 'bg-orange-50' },
  ]);

  useEffect(() => {
    const fetchTaskStats = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('status');

        if (error) throw error;

        const tasks = data || [];
        const stats = {
          pending: tasks.filter((t) => t.status === 'pending').length,
          completed: tasks.filter((t) => t.status === 'completed').length,
          inProgress: tasks.filter((t) => t.status === 'in-progress').length,
        };

        setSummaryCards([
          { label: 'Tasks To Do', count: stats.pending, color: 'bg-blue-50' },
          { label: 'Tasks Completed', count: stats.completed, color: 'bg-green-50' },
          { label: 'Tasks In-Progress', count: stats.inProgress, color: 'bg-orange-50' },
        ]);
      } catch (err) {
        console.error('Error fetching task stats:', err);
      }
    };

    if (activeTab === 'home') {
      fetchTaskStats();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCategorySelect = (categoryId: string, clientName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedClientName(clientName);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onCategorySelect={handleCategorySelect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-blue-100">
          <div />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'home' && (
              <div className="space-y-8">
                <Header summaryCards={summaryCards} />
                <div className="px-8 pb-8">
                  <TasksTable selectedCategoryId={selectedCategoryId} selectedClientName={selectedClientName} />
                </div>
              </div>
            )}

            {activeTab === 'inbox' && (
              <div className="p-8">
                <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
                <p className="mt-4 text-slate-600">Coming soon...</p>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="p-8">
                <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
                <p className="mt-4 text-slate-600">Coming soon...</p>
              </div>
            )}

            {activeTab === 'chats' && (
              <div className="p-8">
                <h1 className="text-3xl font-bold text-slate-900">Chats</h1>
                <p className="mt-4 text-slate-600">Coming soon...</p>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="p-8">
                <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
                <p className="mt-4 text-slate-600">Coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
