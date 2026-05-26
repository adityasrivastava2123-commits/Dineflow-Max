// Settings page
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { restaurantAPI } from '../../services/api';
import toast from 'react-hot-toast';
export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    restaurantAPI.getAdminDetails().then(res => setForm(res.data)).catch(() => toast.error('Failed to load'));
  }, []);
  const set = (path, val) => setForm(f => {
    const parts = path.split('.'); const updated = { ...f };
    let cur = updated;
    for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = { ...cur[parts[i]] }; cur = cur[parts[i]]; }
    cur[parts[parts.length-1]] = val; return updated;
  });
  const save = async () => {
    setSaving(true);
    try { await restaurantAPI.update(form); toast.success('Settings saved'); } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };
  if (!form) return <AdminLayout title="Settings"><div className="skeleton h-96 rounded-2xl" /></AdminLayout>;
  return (
    <AdminLayout title="Restaurant Settings">
      <div className="max-w-2xl space-y-4">
        <div className="card space-y-4">
          <div className="font-display font-bold text-stone-900">Basic Info</div>
          <div><label className="label">Restaurant Name</label><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
          </div>
          <div><label className="label">GSTIN</label><input className="input" value={form.GSTIN || ''} onChange={e => set('GSTIN', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tax Rate (%)</label><input type="number" className="input" value={form.taxRate || 5} onChange={e => set('taxRate', Number(e.target.value))} /></div>
            <div><label className="label">Service Charge (%)</label><input type="number" className="input" value={form.serviceCharge || 0} onChange={e => set('serviceCharge', Number(e.target.value))} /></div>
          </div>
        </div>
        <div className="card space-y-4">
          <div className="font-display font-bold text-stone-900">Address</div>
          <div><label className="label">Street</label><input className="input" value={form.address?.street || ''} onChange={e => set('address.street', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">City</label><input className="input" value={form.address?.city || ''} onChange={e => set('address.city', e.target.value)} /></div>
            <div><label className="label">State</label><input className="input" value={form.address?.state || ''} onChange={e => set('address.state', e.target.value)} /></div>
            <div><label className="label">Pincode</label><input className="input" value={form.address?.pincode || ''} onChange={e => set('address.pincode', e.target.value)} /></div>
          </div>
        </div>
        <div className="card space-y-4">
          <div className="font-display font-bold text-stone-900">WhatsApp Notifications</div>
          <div><label className="label">WhatsApp Number (+91...)</label><input className="input" value={form.whatsappNumber || ''} onChange={e => set('whatsappNumber', e.target.value)} /></div>
          <div><label className="label">CallMeBot API Key</label><input className="input" value={form.callMeBotApiKey || ''} onChange={e => set('callMeBotApiKey', e.target.value)} /></div>
        </div>
        <div className="card space-y-4">
          <div className="font-display font-bold text-stone-900">Order Settings</div>
          <div className="flex items-center justify-between">
            <div><div className="font-medium text-stone-700">Accepting Orders</div><div className="text-xs text-stone-400">Toggle to pause/resume ordering</div></div>
            <input type="checkbox" className="w-5 h-5 accent-brand-500" checked={form.settings?.acceptingOrders ?? true} onChange={e => set('settings.acceptingOrders', e.target.checked)} />
          </div>
          <div><label className="label">Est. Prep Time (minutes)</label><input type="number" className="input" value={form.settings?.estimatedPrepTime || 20} onChange={e => set('settings.estimatedPrepTime', Number(e.target.value))} /></div>
        </div>
        <div className="card space-y-4">
          <div className="font-display font-bold text-stone-900">Happy Hours</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Enable Happy Hours</span>
            <input type="checkbox" className="w-5 h-5 accent-brand-500" checked={form.settings?.happyHours?.enabled ?? false} onChange={e => set('settings.happyHours.enabled', e.target.checked)} />
          </div>
          {form.settings?.happyHours?.enabled && (
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Start</label><input type="time" className="input" value={form.settings?.happyHours?.startTime || ''} onChange={e => set('settings.happyHours.startTime', e.target.value)} /></div>
              <div><label className="label">End</label><input type="time" className="input" value={form.settings?.happyHours?.endTime || ''} onChange={e => set('settings.happyHours.endTime', e.target.value)} /></div>
              <div><label className="label">Discount %</label><input type="number" className="input" value={form.settings?.happyHours?.discountPercent || 10} onChange={e => set('settings.happyHours.discountPercent', Number(e.target.value))} /></div>
            </div>
          )}
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full py-3">
          {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Save Settings'}
        </button>
      </div>
    </AdminLayout>
  );
}
