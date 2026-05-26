import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Upload, Search, Filter, X } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { menuAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ALLERGENS = ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish', 'fish'];
const PORTIONS = ['Small', 'Medium', 'Large', 'Regular', 'Half', 'Full'];

const emptyItem = {
  name: '', nameHindi: '', description: '', price: '', category: '', image: '',
  isVeg: true, isVegan: false, isJain: false, isGlutenFree: false,
  isBestseller: false, isSpicy: false, isCombo: false, comboDiscount: 0,
  allergens: [], calories: '', preparationTime: 15, sortOrder: 0,
  addons: [], portions: [], recipe: '', menuType: 'all', available: true,
};

function ItemForm({ item, categories, onSave, onClose }) {
  const [form, setForm] = useState(item || emptyItem);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAddon, setNewAddon] = useState({ name: '', price: '' });
  const [newPortion, setNewPortion] = useState({ size: '', price: '' });
  const fileRef = useRef();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await uploadAPI.uploadImage(fd);
      set('image', res.data.url);
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const addAddon = () => {
    if (!newAddon.name || !newAddon.price) return;
    set('addons', [...form.addons, { name: newAddon.name, price: Number(newAddon.price) }]);
    setNewAddon({ name: '', price: '' });
  };

  const addPortion = () => {
    if (!newPortion.size || !newPortion.price) return;
    set('portions', [...form.portions, { size: newPortion.size, price: Number(newPortion.price) }]);
    setNewPortion({ size: '', price: '' });
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price, and category are required');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price) });
      onClose();
      toast.success(`Item ${item?._id ? 'updated' : 'created'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-display font-bold text-xl text-stone-900">{item?._id ? 'Edit Item' : 'Add Menu Item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Image */}
          <div className="flex gap-4 items-start">
            <div onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all flex-shrink-0 overflow-hidden">
              {uploading ? <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> :
                form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> :
                  <><Upload className="w-5 h-5 text-stone-400" /><span className="text-xs text-stone-400 mt-1">Upload</span></>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            <div className="flex-1 space-y-3">
              <div>
                <label className="label">Item Name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Paneer Tikka" />
              </div>
              <div>
                <label className="label">Hindi Name (optional)</label>
                <input className="input" value={form.nameHindi} onChange={e => set('nameHindi', e.target.value)} placeholder="e.g. पनीर टिक्का" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Describe the dish..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₹) *</label>
              <input type="number" className="input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" min={0} />
            </div>
            <div>
              <label className="label">Category *</label>
              <input className="input" value={form.category}
                onChange={e => set('category', e.target.value)} placeholder="e.g. Starters"
                list="categories-list" />
              <datalist id="categories-list">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Calories</label>
              <input type="number" className="input" value={form.calories} onChange={e => set('calories', e.target.value)} placeholder="kcal" />
            </div>
            <div>
              <label className="label">Prep Time (min)</label>
              <input type="number" className="input" value={form.preparationTime} onChange={e => set('preparationTime', e.target.value)} />
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input type="number" className="input" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'isVeg', label: '🟢 Veg' },
              { key: 'isVegan', label: '🌿 Vegan' },
              { key: 'isJain', label: '⭕ Jain' },
              { key: 'isGlutenFree', label: '🌾 GF' },
              { key: 'isBestseller', label: '⭐ Bestseller' },
              { key: 'isSpicy', label: '🌶️ Spicy' },
            ].map(t => (
              <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[t.key]} onChange={e => set(t.key, e.target.checked)}
                  className="w-4 h-4 accent-brand-500" />
                <span className="text-sm text-stone-700">{t.label}</span>
              </label>
            ))}
          </div>

          {/* Allergens */}
          <div>
            <label className="label">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map(a => (
                <button key={a} type="button"
                  onClick={() => set('allergens', form.allergens.includes(a) ? form.allergens.filter(x => x !== a) : [...form.allergens, a])}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${form.allergens.includes(a) ? 'bg-red-100 text-red-700 border-red-300' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="label">Add-ons / Extras</label>
            <div className="space-y-2 mb-2">
              {form.addons.map((addon, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-stone-700">{addon.name}</span>
                  <span className="text-stone-900 font-semibold">+₹{addon.price}</span>
                  <button onClick={() => set('addons', form.addons.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Add-on name" value={newAddon.name} onChange={e => setNewAddon(a => ({ ...a, name: e.target.value }))} />
              <input className="input w-24" type="number" placeholder="₹" value={newAddon.price} onChange={e => setNewAddon(a => ({ ...a, price: e.target.value }))} />
              <button onClick={addAddon} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Portions */}
          <div>
            <label className="label">Portion Sizes</label>
            <div className="space-y-2 mb-2">
              {form.portions.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-stone-700">{p.size}</span>
                  <span className="text-stone-900 font-semibold">₹{p.price}</span>
                  <button onClick={() => set('portions', form.portions.filter((_, j) => j !== i))} className="text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="input flex-1" value={newPortion.size} onChange={e => setNewPortion(p => ({ ...p, size: e.target.value }))}>
                <option value="">Size...</option>
                {PORTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="input w-24" type="number" placeholder="₹" value={newPortion.price} onChange={e => setNewPortion(p => ({ ...p, price: e.target.value }))} />
              <button onClick={addPortion} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Recipe */}
          <div>
            <label className="label">Recipe / Kitchen Notes</label>
            <textarea className="input resize-none" rows={2} value={form.recipe}
              onChange={e => set('recipe', e.target.value)} placeholder="Instructions for kitchen staff..." />
          </div>

          {/* Menu type */}
          <div>
            <label className="label">Available In</label>
            <select className="input" value={form.menuType} onChange={e => set('menuType', e.target.value)}>
              <option value="all">All Day</option>
              <option value="breakfast">Breakfast Only</option>
              <option value="lunch">Lunch Only</option>
              <option value="dinner">Dinner Only</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-stone-100 bg-white">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : (item?._id ? 'Save Changes' : 'Add Item')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadItems = async () => {
    try {
      const res = await menuAPI.getAdminMenu();
      setItems(res.data);
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, []);

  const categories = [...new Set(items.map(i => i.category))];

  const filtered = items.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async (data) => {
    if (data._id) {
      await menuAPI.updateItem(data._id, data);
      setItems(prev => prev.map(i => i._id === data._id ? { ...i, ...data } : i));
    } else {
      const res = await menuAPI.createItem(data);
      setItems(prev => [...prev, res.data]);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await menuAPI.deleteItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await menuAPI.toggleAvailability(id);
      setItems(prev => prev.map(i => i._id === id ? { ...i, available: res.data.available } : i));
    } catch { toast.error('Failed to toggle'); }
  };

  return (
    <AdminLayout title="Menu Management">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input className="input pl-9" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-48" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary whitespace-nowrap">
          <Plus className="w-4 h-4" />Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center">
          <div className="font-display text-2xl font-black text-stone-900">{items.length}</div>
          <div className="text-xs text-stone-500 font-medium">Total Items</div>
        </div>
        <div className="card text-center">
          <div className="font-display text-2xl font-black text-emerald-600">{items.filter(i => i.available).length}</div>
          <div className="text-xs text-stone-500 font-medium">Available</div>
        </div>
        <div className="card text-center">
          <div className="font-display text-2xl font-black text-stone-400">{items.filter(i => !i.available).length}</div>
          <div className="text-xs text-stone-500 font-medium">Out of Stock</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item._id} className={`card flex items-center gap-4 transition-all ${!item.available ? 'opacity-50' : ''}`}>
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-3 h-3 rounded-full border-2 ${item.isVeg ? 'border-emerald-500 bg-emerald-400' : 'border-red-500 bg-red-400'}`} />
                  <span className="font-semibold text-stone-900 truncate">{item.name}</span>
                  {item.isBestseller && <span className="badge bg-amber-50 text-amber-700 text-[10px]">⭐ Best</span>}
                  {!item.available && <span className="badge-red text-[10px]">Out of stock</span>}
                </div>
                <div className="text-xs text-stone-500">{item.category}</div>
                <div className="font-bold text-stone-900 text-sm">₹{item.price}</div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleToggle(item._id)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors" title="Toggle availability">
                  {item.available ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-stone-400" />}
                </button>
                <button onClick={() => { setEditItem(item); setShowForm(true); }} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                  <Pencil className="w-4 h-4 text-stone-600" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <div className="text-4xl mb-3">🍽️</div>
              <div className="font-semibold">No items found</div>
              <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary mt-4">
                <Plus className="w-4 h-4" />Add your first item
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <ItemForm
          item={editItem}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}
    </AdminLayout>
  );
}
