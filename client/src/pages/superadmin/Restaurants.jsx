import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { superadminAPI } from '../../services/api';
import { Plus, Search, Store, MoreHorizontal, X, QrCode, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChefHat, BarChart3, HeadphonesIcon, LogOut } from 'lucide-react';
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

const PLAN_OPTS = ['trial','basic','standard','premium'];
const planColors = { trial: 'badge-stone', basic: 'badge-blue', standard: 'badge-orange', premium: 'badge-purple' };

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showSubModal, setShowSubModal] = useState(null);
  const [showQR, setShowQR] = useState(null);
  const [subForm, setSubForm] = useState({ plan: 'standard', days: 30, status: 'active' });
  const [qrCodes, setQrCodes] = useState([]);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });

  const load = async () => {
    try {
      const res = await superadminAPI.getRestaurants({ search, limit: 50 });
      setRestaurants(res.data.restaurants);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email) return;
    try {
      await superadminAPI.createRestaurant({ ...createForm, slug: createForm.slug || createForm.name.toLowerCase().replace(/\s+/g, '-') });
      toast.success('Restaurant created');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSubUpdate = async () => {
    try {
      await superadminAPI.updateSubscription(showSubModal._id, subForm);
      toast.success('Subscription updated');
      setShowSubModal(null);
      load();
    } catch { toast.error('Failed to update'); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this restaurant?')) return;
    await superadminAPI.deleteRestaurant(id);
    toast.success('Restaurant deactivated');
    load();
  };

  const viewQRCodes = async (restaurant) => {
    try {
      const res = await superadminAPI.getQRCodes(restaurant._id);
      setQrCodes(res.data);
      setShowQR(restaurant);
    } catch { toast.error('Failed to load QR codes'); }
  };

  return (
    <SALayout title="Restaurants">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            placeholder="Search restaurants..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary whitespace-nowrap"><Plus className="w-4 h-4" />Add Restaurant</button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-stone-900 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {restaurants.map(r => {
            const daysLeft = r.subscription?.expiresAt ? Math.ceil((new Date(r.subscription.expiresAt) - new Date()) / 86400000) : 0;
            return (
              <div key={r._id} className="bg-stone-900 rounded-2xl border border-stone-800 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">{r.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{r.name}</span>
                    <span className="text-stone-500 text-xs">/{r.slug}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={planColors[r.subscription?.plan] || 'badge-stone'}>{r.subscription?.plan}</span>
                    <span className={`text-xs font-semibold ${daysLeft <= 7 ? 'text-amber-400' : daysLeft <= 0 ? 'text-red-400' : 'text-stone-500'}`}>
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                    </span>
                    <span className="text-stone-600 text-xs">{r.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => viewQRCodes(r)} className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl" title="QR Codes">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setShowSubModal(r); setSubForm({ plan: r.subscription?.plan || 'standard', days: 30, status: r.subscription?.status || 'active' }); }}
                    className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl" title="Manage Subscription">
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeactivate(r._id)} className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-xl" title="Deactivate">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create restaurant modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="relative bg-stone-900 rounded-3xl w-full max-w-md border border-stone-700 animate-fade-up">
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <h2 className="font-display font-bold text-white text-xl">New Restaurant</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Restaurant Info</div>
              <input className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" placeholder="Restaurant Name *" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') }))} />
              <input className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" placeholder="Slug (auto-filled)" value={createForm.slug} onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))} />
              <input className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none" placeholder="Contact Email *" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
              <input className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none" placeholder="Phone" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider pt-2">Admin Account (optional)</div>
              <input className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none" placeholder="Admin Name" value={createForm.adminName} onChange={e => setCreateForm(f => ({ ...f, adminName: e.target.value }))} />
              <input className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none" placeholder="Admin Email" value={createForm.adminEmail} onChange={e => setCreateForm(f => ({ ...f, adminEmail: e.target.value }))} />
              <input type="password" className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder:text-stone-500 focus:outline-none" placeholder="Admin Password" value={createForm.adminPassword} onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))} />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-stone-800">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-semibold text-sm hover:bg-stone-700">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600">Create Restaurant</button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSubModal(null)} />
          <div className="relative bg-stone-900 rounded-3xl w-full max-w-sm border border-stone-700 p-6 animate-fade-up">
            <h2 className="font-display font-bold text-white text-xl mb-4">Update Subscription</h2>
            <div className="font-semibold text-white mb-4">{showSubModal.name}</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Plan</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm" value={subForm.plan} onChange={e => setSubForm(f => ({ ...f, plan: e.target.value }))}>
                  {PLAN_OPTS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Extend by (days)</label>
                <input type="number" className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm" value={subForm.days} onChange={e => setSubForm(f => ({ ...f, days: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Status</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm" value={subForm.status} onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSubModal(null)} className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-semibold text-sm">Cancel</button>
              <button onClick={handleSubUpdate} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* QR codes modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowQR(null)} />
          <div className="relative bg-stone-900 rounded-3xl w-full max-w-2xl border border-stone-700 max-h-[90vh] overflow-y-auto animate-fade-up">
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between sticky top-0 bg-stone-900">
              <h2 className="font-display font-bold text-white">QR Codes – {showQR.name}</h2>
              <button onClick={() => setShowQR(null)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {qrCodes.map(qr => (
                <div key={qr.tableNumber} className="bg-stone-800 rounded-2xl p-4 text-center">
                  <div className="text-white font-bold mb-2">Table {qr.tableNumber}</div>
                  <img src={qr.qrCode} alt={`Table ${qr.tableNumber}`} className="w-full rounded-xl bg-white p-1 mb-2" />
                  <a href={qr.qrCode} download={`table-${qr.tableNumber}.png`} className="text-xs text-brand-400 hover:underline">Download</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SALayout>
  );
}
