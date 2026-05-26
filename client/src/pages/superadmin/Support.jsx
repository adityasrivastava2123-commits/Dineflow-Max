import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supportAPI } from '../../services/api';
import { MessageSquare, Send, ChefHat, BarChart3, Store, HeadphonesIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function SALayout({ children, title }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-stone-950 overflow-hidden">
      <aside className="w-56 flex flex-col border-r border-stone-800 flex-shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-stone-800">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><ChefHat className="w-5 h-5 text-white" /></div>
          <div><div className="font-display font-bold text-white text-sm">DineFlow</div><div className="text-stone-500 text-[10px]">Super Admin</div></div>
        </div>
        <nav className="flex-1 py-4">
          {[{path:'/superadmin',icon:BarChart3,label:'Dashboard'},{path:'/superadmin/restaurants',icon:Store,label:'Restaurants'},{path:'/superadmin/support',icon:HeadphonesIcon,label:'Support'}].map(item => (
            <Link key={item.path} to={item.path} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-all mb-0.5">
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl text-sm">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center px-6">
          <h1 className="font-display font-bold text-white text-lg">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-stone-950">{children}</main>
      </div>
    </div>
  );
}

export default function SuperAdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    supportAPI.getTickets().then(r => setTickets(r.data)).finally(() => setLoading(false));
  }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    const res = await supportAPI.replyToTicket(selected._id, reply);
    setTickets(p => p.map(t => t._id === selected._id ? res.data : t));
    setSelected(res.data);
    setReply('');
  };

  const statusColors = { open: 'text-red-400', inprogress: 'text-amber-400', resolved: 'text-emerald-400' };

  return (
    <SALayout title="Support Tickets">
      <div className="grid lg:grid-cols-2 gap-4 h-[calc(100vh-160px)]">
        <div className="overflow-y-auto space-y-2">
          {loading ? [1,2,3].map(i => <div key={i} className="h-16 bg-stone-900 rounded-2xl animate-pulse" />) :
            tickets.map(t => (
              <div key={t._id} onClick={() => setSelected(t)}
                className={`bg-stone-900 rounded-2xl border p-4 cursor-pointer transition-all ${selected?._id === t._id ? 'border-brand-500' : 'border-stone-800 hover:border-stone-700'}`}>
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-white text-sm">{t.subject}</div>
                  <span className={`text-xs font-bold ${statusColors[t.status]}`}>{t.status}</span>
                </div>
                <div className="text-stone-500 text-xs mt-1">{t.customerName} · {t.restaurantId?.name || 'Restaurant'}</div>
              </div>
            ))
          }
          {!loading && tickets.length === 0 && (
            <div className="text-center py-16 text-stone-600">
              <MessageSquare className="w-10 h-10 mx-auto mb-3" />
              <div>No support tickets</div>
            </div>
          )}
        </div>

        {selected ? (
          <div className="flex flex-col bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-800">
              <div className="font-bold text-white">{selected.subject}</div>
              <div className="text-stone-500 text-xs">{selected.customerName} · {selected.customerPhone}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages?.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderRole === 'customer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderRole === 'customer' ? 'bg-stone-800 text-stone-200' : 'bg-brand-500 text-white'}`}>
                    <div className="font-semibold text-xs mb-1 opacity-70">{msg.sender}</div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            {selected.status !== 'resolved' && (
              <div className="p-4 border-t border-stone-800 flex gap-2">
                <input className="flex-1 px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none"
                  placeholder="Type reply..." value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReply()} />
                <button onClick={handleReply} className="bg-brand-500 hover:bg-brand-600 text-white px-4 rounded-xl">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-stone-900 rounded-2xl border border-stone-800">
            <div className="text-stone-600 text-sm text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              Select a ticket
            </div>
          </div>
        )}
      </div>
    </SALayout>
  );
}
