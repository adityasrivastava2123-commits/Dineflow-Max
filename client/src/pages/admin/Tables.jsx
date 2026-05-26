// Admin Tables Management
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { restaurantAPI } from '../../services/api';
import { Plus, QrCode, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTables() {
  const [restaurant, setRestaurant] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTable, setNewTable] = useState({ number: '', capacity: 4, section: 'Main' });
  const [showQR, setShowQR] = useState(null);

  useEffect(() => {
    Promise.all([
      restaurantAPI.getAdminDetails(),
      restaurantAPI.getQRCodes()
    ]).then(([r, q]) => {
      setRestaurant(r.data);
      setQrCodes(q.data);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const addTable = async () => {
    if (!newTable.number) return;
    try {
      const res = await restaurantAPI.addTable(newTable);
      setRestaurant(res.data);
      const q = await restaurantAPI.getQRCodes();
      setQrCodes(q.data);
      setNewTable({ number: '', capacity: 4, section: 'Main' });
      toast.success('Table added');
    } catch { toast.error('Failed to add table'); }
  };

  const toggleOccupied = async (number, isOccupied) => {
    try {
      await restaurantAPI.updateTableStatus(number, !isOccupied);
      setRestaurant(prev => ({
        ...prev,
        tables: prev.tables.map(t => t.number === number ? { ...t, isOccupied: !isOccupied } : t)
      }));
    } catch { toast.error('Failed to update'); }
  };

  return (
    <AdminLayout title="Table Management">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card text-center"><div className="font-display text-2xl font-black text-stone-900">{restaurant?.tables?.length || 0}</div><div className="text-xs text-stone-500">Total Tables</div></div>
        <div className="card text-center"><div className="font-display text-2xl font-black text-red-500">{restaurant?.tables?.filter(t => t.isOccupied).length || 0}</div><div className="text-xs text-stone-500">Occupied</div></div>
        <div className="card text-center"><div className="font-display text-2xl font-black text-emerald-600">{restaurant?.tables?.filter(t => !t.isOccupied).length || 0}</div><div className="text-xs text-stone-500">Available</div></div>
      </div>

      <div className="card mb-4">
        <div className="font-display font-bold text-stone-900 mb-3">Add New Table</div>
        <div className="flex gap-3 flex-wrap">
          <input className="input w-28" placeholder="Table #" value={newTable.number} onChange={e => setNewTable(t => ({ ...t, number: e.target.value }))} />
          <input type="number" className="input w-28" placeholder="Capacity" value={newTable.capacity} onChange={e => setNewTable(t => ({ ...t, capacity: e.target.value }))} />
          <input className="input flex-1 min-w-28" placeholder="Section (e.g. Indoor)" value={newTable.section} onChange={e => setNewTable(t => ({ ...t, section: e.target.value }))} />
          <button onClick={addTable} className="btn-primary"><Plus className="w-4 h-4" />Add</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {restaurant?.tables?.map(table => {
          const qr = qrCodes.find(q => q.tableNumber === table.number);
          return (
            <div key={table.number} className={`card text-center cursor-pointer transition-all hover:shadow-md ${table.isOccupied ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}
              onClick={() => toggleOccupied(table.number, table.isOccupied)}>
              <div className={`font-display text-3xl font-black mb-1 ${table.isOccupied ? 'text-red-600' : 'text-emerald-600'}`}>
                {table.number}
              </div>
              <div className="text-xs text-stone-500 mb-2">{table.capacity} seats · {table.section || 'Main'}</div>
              <div className={`text-xs font-bold ${table.isOccupied ? 'text-red-600' : 'text-emerald-600'}`}>
                {table.isOccupied ? '🔴 Occupied' : '🟢 Free'}
              </div>
              {qr && (
                <button onClick={e => { e.stopPropagation(); setShowQR(qr); }}
                  className="mt-2 text-xs text-brand-600 hover:underline flex items-center gap-1 justify-center">
                  <QrCode className="w-3 h-3" />QR Code
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-3xl p-6 max-w-xs w-full text-center animate-fade-up">
            <h3 className="font-display font-bold text-xl mb-1">Table {showQR.tableNumber}</h3>
            <p className="text-xs text-stone-500 mb-4 break-all">{showQR.url}</p>
            <img src={showQR.qrCode} alt="QR" className="w-48 h-48 mx-auto mb-4 border border-stone-200 rounded-xl p-2" />
            <div className="flex gap-2">
              <button onClick={() => setShowQR(null)} className="btn-secondary flex-1">Close</button>
              <a href={showQR.qrCode} download={`table-${showQR.tableNumber}-qr.png`} className="btn-primary flex-1">
                <Download className="w-4 h-4" />Download
              </a>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
