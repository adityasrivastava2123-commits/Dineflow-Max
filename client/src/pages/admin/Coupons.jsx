import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { couponsAPI } from '../../services/api';
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const empty = { code: '', type: 'percent', value: '', minOrderAmount: 0, maxDiscount: '', usageLimit: '', validFrom: '', validTo: '', description: '', isActive: true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    couponsAPI.getAll().then(r => setCoupons(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.code || !form.value) { toast.error('Code and value are required'); return; }
    setSaving(true);
    try {
      const res = await couponsAPI.create({ ...form, value: Number(form.value), minOrderAmount: Number(form.minOrderAmount), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined });
      setCoupons(p => [res.data, ...p]);
      setShowForm(false); setForm(empty);
      toast.success('Coupon created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await couponsAPI.delete(id);
    setCoupons(p => p.filter(c => c._id !== id));
    toast.success('Deleted');
  };

  const toggleActive = async (c) => {
    const res = await couponsAPI.update(c._id, { isActive: !c.isActive });
    setCoupons(p => p.map(x => x._id === c._id ? res.data : x));
  };

  return (
    <AdminLayout title="Coupons & Offers">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" />New Coupon</button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <div key={c._id} className={`card flex items-center gap-4 ${!c.isActive ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stone-900">{c.code}</span>
                  {!c.isActive && <span className="badge-stone text-[10px]">Inactive</span>}
                </div>
                <div className="text-xs text-stone-500">
                  {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}
                  {c.minOrderAmount > 0 && ` · Min ₹${c.minOrderAmount}`}
                  {c.usageLimit && ` · ${c.usedCount || 0}/${c.usageLimit} used`}
                </div>
              </div>
              <div className="text-xs text-stone-400 flex-shrink-0">
                {c.validTo && `Expires ${new Date(c.validTo).toLocaleDateString('en-IN')}`}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(c)} className="p-2 hover:bg-stone-100 rounded-xl">
                  {c.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-stone-400" />}
                </button>
                <button onClick={() => handleDelete(c._id)} className="p-2 hover:bg-red-50 rounded-xl">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <Tag className="w-10 h-10 mx-auto mb-3 text-stone-300" />
              <div className="font-semibold">No coupons yet</div>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" />Create first coupon</button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-up">
            <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">New Coupon</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Coupon Code *</label>
                <input className="input font-mono uppercase" placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Discount Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value *</label>
                  <input type="number" className="input" placeholder={form.type === 'percent' ? '20' : '50'} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Min Order (₹)</label>
                  <input type="number" className="input" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
                </div>
                {form.type === 'percent' && (
                  <div>
                    <label className="label">Max Discount (₹)</label>
                    <input type="number" className="input" placeholder="No limit" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
                  </div>
                )}
              </div>
              <div>
                <label className="label">Usage Limit</label>
                <input type="number" className="input" placeholder="Unlimited" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Valid From</label>
                  <input type="date" className="input" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valid To</label>
                  <input type="date" className="input" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="e.g. 20% off for first order" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-stone-100">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
