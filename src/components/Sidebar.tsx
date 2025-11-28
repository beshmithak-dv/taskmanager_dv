import { Home, Inbox, CheckSquare, MessageSquare, Calendar, Settings, HelpCircle, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TaskCategory {
  id: string;
  name: string;
  taskCount: number;
}

interface Client {
  id: string;
  name: string;
  categories: TaskCategory[];
  isExpanded: boolean;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCategorySelect?: (clientId: string, category: string, clientName: string) => void;
}

export function Sidebar({ activeTab, onTabChange, onCategorySelect }: SidebarProps) {
  const [currentDay, setCurrentDay] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);

  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    setCurrentDay(days[today.getDay()]);
    fetchClientsAndCategories();
  }, []);

  const fetchClientsAndCategories = async () => {
    try {
      setLoading(true);
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        return;
      }

      const clientsWithCategories: Client[] = [];

      for (const client of clientsData) {
        const { data: tasksCount, error: tasksError } = await supabase
          .from('tasks')
          .select('category', { count: 'exact', head: false })
          .eq('client_id', client.id);

        if (tasksError) throw tasksError;

        const counts = {
          tasks: tasksCount?.filter(t => t.category === 'tasks').length || 0,
          gtm: tasksCount?.filter(t => t.category === 'gtm').length || 0,
          recurring: tasksCount?.filter(t => t.category === 'recurring').length || 0,
        };

        const categories = [
          { id: 'tasks', name: 'Tasks', taskCount: counts.tasks },
          { id: 'gtm', name: 'GTM Tasks', taskCount: counts.gtm },
          { id: 'recurring', name: 'Recurring Tasks', taskCount: counts.recurring },
        ];

        clientsWithCategories.push({
          id: client.id,
          name: client.name,
          categories,
          isExpanded: false,
        });
      }

      setClients(clientsWithCategories);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setClients(
      clients.map((client) =>
        client.id === clientId ? { ...client, isExpanded: !client.isExpanded } : client
      )
    );
  };

  const addClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from('clients')
        .insert([{ name: newClientName, user_id: userData.user.id }]);

      if (error) throw error;

      setNewClientName('');
      setIsAddingClient(false);
      await fetchClientsAndCategories();
    } catch (err) {
      console.error('Error adding client:', err);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-white border-r border-blue-100 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 border-b border-blue-100 sticky top-0 bg-white">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          {currentDay}
        </h2>
      </div>

      <nav className="space-y-2 px-4 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 px-4 border-t border-blue-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Clients</h3>
          <button
            onClick={() => setIsAddingClient(!isAddingClient)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            title="Add client"
          >
            <Plus className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {isAddingClient && (
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Client name"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addClient()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={addClient}
                className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingClient(false);
                  setNewClientName('');
                }}
                className="flex-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {loading ? (
            <p className="text-center text-xs text-slate-500 py-2">Loading...</p>
          ) : clients.length === 0 ? (
            <p className="text-xs text-slate-500">No clients yet</p>
          ) : (
            clients.map((client) => (
              <div key={client.id}>
                <button
                  onClick={() => toggleClient(client.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                >
                  {client.isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <span className="font-medium text-slate-900 truncate">{client.name}</span>
                </button>

                {client.isExpanded && (
                  <div className="ml-5 space-y-0.5 mt-1">
                    {client.categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => onCategorySelect?.(client.id, category.id, client.name)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">{category.name}</span>
                        {category.taskCount > 0 && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {category.taskCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto space-y-2 px-4 pb-6 border-t border-blue-100 pt-4">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-all"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
