import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { inventoryAPI } from '../../services/api';
import { Plus, Package, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showWastage, setShowWastage] = useState(null);
  const [form, setForm] = useState({ name: '', unit: '', currentStock: 0, minStock: 5, costPerUnit: '' });
  const [wastageForm, setWastageForm] = useState({ quantity: '', reason: '' });

  useEffect(() => {
    inventoryAPI.getAll().then(r => setItems(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.name) return;
    try {
      const res = await inventoryAPI.create(form);
      setItems(p => [...p, res.data]);
      setShowAdd(false);
      setForm({ name: '', unit: '', currentStock: 0, minStock: 5, costPerUnit: '' });
      toast.success('Item added');
    } catch { toast.error('Failed to add'); }
  };

  const handleUpdate = async (id, stock) => {
    try {
      const res = await inventoryAPI.update(id, { currentStock: Number(stock) });
      setItems(p => p.map(i => i._id === id ? res.data : i));
    } catch { toast.error('Failed to update'); }
  };

  const handleWastage = async () => {
    if (!wastageForm.quantity) return;
    try {
      const res = await inventoryAPI.logWastage(showWastage._id, wastageForm);
      setItems(p => p.map(i => i._id === showWastage._id ? res.data : i));
      setShowWastage(null);
      setWastageForm({ quantity: '', reason: '' });
      toast.success('Wastage logged');
    } catch { toast.error('Failed to log'); }
  };

  const lowStock = items.filter(i => i.currentStock <= i.minStock);

  return (
    <AdminLayout title="Inventory">
      {lowStock.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-amber-800 text-sm font-semibold">{lowStock.length} item{lowStock.length > 1 ? 's' : ''} running low: {lowStock.map(i => i.name).join(', ')}</div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Item</button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const isLow = item.currentStock <= item.minStock;
            return (
              <div key={item._id} className={`card flex items-center gap-4 ${isLow ? 'border-amber-200 bg-amber-50/50' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLow ? 'bg-amber-100' : 'bg-stone-100'}`}>
                  <Package className={`w-5 h-5 ${isLow ? 'text-amber-600' : 'text-stone-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-900 text-sm">{item.name}</div>
                  <div className="text-xs text-stone-500">Min: {item.minStock} {item.unit} {item.costPerUnit ? `· ₹${item.costPerUnit}/${item.unit}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-right ${isLow ? 'text-amber-600' : 'text-stone-900'}`}>
                    <input type="number" value={item.currentStock} min={0}
                      onChange={e => handleUpdate(item._id, e.target.value)}
                      className="w-20 text-right font-bold text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                    <div className="text-xs text-stone-400">{item.unit || 'units'}</div>
                  </div>
                  <button onClick={() => setShowWastage(item)} className="text-xs text-stone-400 hover:text-red-500 px-2 py-1 bg-stone-100 rounded-lg transition-colors">
                    Log wastage
                  </button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <Package className="w-10 h-10 mx-auto mb-3 text-stone-300" />
              <div className="font-semibold">No inventory items</div>
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" />Add first item</button>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-up space-y-4">
            <h2 className="font-display font-bold text-xl">Add Inventory Item</h2>
            <div><label className="label">Item Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Unit</label><input className="input" placeholder="kg, litre, pcs" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
              <div><label className="label">Cost/Unit (₹)</label><input type="number" className="input" value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Current Stock</label><input type="number" className="input" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} /></div>
              <div><label className="label">Min Stock</label><input type="number" className="input" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAdd} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}

      {showWastage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowWastage(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-up space-y-4">
            <h2 className="font-display font-bold text-xl">Log Wastage: {showWastage.name}</h2>
            <div><label className="label">Quantity ({showWastage.unit})</label><input type="number" className="input" value={wastageForm.quantity} onChange={e => setWastageForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div><label className="label">Reason</label><input className="input" placeholder="e.g. Spoiled, Dropped..." value={wastageForm.reason} onChange={e => setWastageForm(f => ({ ...f, reason: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button onClick={() => setShowWastage(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleWastage} className="btn-danger flex-1">Log Wastage</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
