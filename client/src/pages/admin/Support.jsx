import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supportAPI } from '../../services/api';
import { MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supportAPI.getTickets().then(r => setTickets(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await supportAPI.replyToTicket(selected._id, reply);
      setTickets(p => p.map(t => t._id === selected._id ? res.data : t));
      setSelected(res.data);
      setReply('');
    } catch { toast.error('Failed to send reply'); } finally { setSending(false); }
  };

  const resolveTicket = async (id) => {
    const res = await supportAPI.updateTicket(id, { status: 'resolved' });
    setTickets(p => p.map(t => t._id === id ? res.data : t));
    if (selected?._id === id) setSelected(res.data);
    toast.success('Ticket resolved');
  };

  const statusColor = { open: 'badge-red', inprogress: 'badge-orange', resolved: 'badge-green' };

  return (
    <AdminLayout title="Support Tickets">
      <div className="grid lg:grid-cols-2 gap-4 h-[calc(100vh-160px)]">
        <div className="overflow-y-auto space-y-2">
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />) :
            tickets.map(t => (
              <div key={t._id} onClick={() => setSelected(t)}
                className={`card cursor-pointer transition-all hover:shadow-md ${selected?._id === t._id ? 'border-brand-300 bg-brand-50/30' : ''}`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-stone-900 text-sm">{t.subject}</div>
                  <span className={statusColor[t.status] || 'badge-stone'}>{t.status}</span>
                </div>
                <div className="text-xs text-stone-500">{t.customerName} · {t.customerPhone}</div>
                <div className="text-xs text-stone-400 mt-1">{new Date(t.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
            ))
          }
          {!loading && tickets.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-stone-300" />
              <div className="font-semibold">No support tickets</div>
            </div>
          )}
        </div>

        {selected ? (
          <div className="flex flex-col bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <div className="font-display font-bold text-stone-900">{selected.subject}</div>
              <div className="text-sm text-stone-500">{selected.customerName} · {selected.customerPhone}</div>
              <div className="flex gap-2 mt-2">
                <span className={statusColor[selected.status]}>{selected.status}</span>
                {selected.status !== 'resolved' && (
                  <button onClick={() => resolveTicket(selected._id)} className="text-xs text-emerald-600 font-semibold hover:underline">Mark resolved</button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages?.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderRole === 'customer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderRole === 'customer' ? 'bg-stone-100 text-stone-800' : 'bg-brand-500 text-white'}`}>
                    <div className="font-semibold text-xs mb-1 opacity-70">{msg.sender}</div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            {selected.status !== 'resolved' && (
              <div className="p-4 border-t border-stone-100 flex gap-2">
                <input className="input flex-1" placeholder="Type reply..." value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()} />
                <button onClick={handleReply} disabled={sending} className="btn-primary px-4">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-stone-50 rounded-2xl border border-stone-100">
            <div className="text-center text-stone-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <div className="text-sm">Select a ticket to view</div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
