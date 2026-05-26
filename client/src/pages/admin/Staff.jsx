import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { authAPI } from '../../services/api';
import { Plus, Users2, Shield, ChefHat, User, Trash2, Mail, Phone, Key } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  admin:    { label: 'Admin',   icon: Shield,   color: 'text-red-600 bg-red-50' },
  manager:  { label: 'Manager', icon: Shield,   color: 'text-purple-600 bg-purple-50' },
  kitchen:  { label: 'Kitchen', icon: ChefHat,  color: 'text-orange-600 bg-orange-50' },
  staff:    { label: 'Staff',   icon: User,     color: 'text-blue-600 bg-blue-50' },
};

function StaffCard({ member, onDelete }) {
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.staff;
  const Icon = cfg.icon;
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-stone-900 truncate">{member.name}</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
        </div>
        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
          <Mail className="w-3 h-3" />{member.email}
        </p>
        {member.phone && (
          <p className="text-xs text-stone-400 flex items-center gap-1">
            <Phone className="w-3 h-3" />{member.phone}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full ${member.isActive !== false ? 'bg-emerald-400' : 'bg-stone-300'}`} />
        <button
          onClick={() => onDelete(member._id)}
          className="p-1.5 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', role: 'kitchen' };

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await authAPI.getStaff();
      setStaff(res.data?.staff || res.data || []);
    } catch {
      // Staff list may not always be available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setSaving(true);
    try {
      await authAPI.createStaff(form);
      toast.success('Staff member added');
      setShowAdd(false);
      setForm(EMPTY_FORM);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await authAPI.deleteStaff(id);
      setStaff(s => s.filter(m => m._id !== id));
      toast.success('Staff member removed');
    } catch {
      toast.error('Failed to remove staff');
    }
  };

  const grouped = {
    admin:   staff.filter(s => s.role === 'admin'),
    manager: staff.filter(s => s.role === 'manager'),
    kitchen: staff.filter(s => s.role === 'kitchen'),
    staff:   staff.filter(s => s.role === 'staff'),
  };

  return (
    <AdminLayout title="Staff Management">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-stone-500 text-sm">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" />Add Staff
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
          const Icon = cfg.icon;
          const count = grouped[role]?.length || 0;
          return (
            <div key={role} className="card text-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-display font-black text-stone-900">{count}</p>
              <p className="text-xs text-stone-400">{cfg.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Staff list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="card text-center py-16">
          <Users2 className="w-12 h-12 text-stone-200 mx-auto mb-3" />
          <p className="font-semibold text-stone-500">No staff members yet</p>
          <p className="text-sm text-stone-400 mt-1">Add team members to manage your restaurant together</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto">
            <Plus className="w-4 h-4" />Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(member => (
            <StaffCard key={member._id} member={member} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-md animate-fade-up space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Add Staff Member</h2>
              <button onClick={() => setShowAdd(false)} className="btn-ghost p-2">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input className="input" placeholder="e.g. Rajan Kumar" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="staff@restaurant.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="9876543210" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Role *</label>
                <select className="input" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="staff">Floor Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Password *</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-10"
                    placeholder="Min 8 characters" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  : <><Plus className="w-4 h-4" />Add Staff</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
