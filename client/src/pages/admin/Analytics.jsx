import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import AdminLayout from '../../components/layout/AdminLayout';
import { analyticsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const HEATMAP_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminAnalytics() {
  const [dashboard, setDashboard] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [trend, setTrend] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getDashboard(),
      analyticsAPI.getTopItems(period),
      analyticsAPI.getRevenueTrend(period),
      analyticsAPI.getPeakHours(),
    ]).then(([dash, items, tr, peak]) => {
      setDashboard(dash.data);
      setTopItems(items.data);
      setTrend(tr.data);
      setPeakHours(peak.data);
    }).catch(() => toast.error('Failed to load analytics'))
    .finally(() => setLoading(false));
  }, [period]);

  const maxHeat = peakHours.length ? Math.max(...peakHours.flat()) : 1;

  if (loading) return (
    <AdminLayout title="Analytics">
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Analytics">
      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {[7, 14, 30, 90].map(d => (
          <button key={d} onClick={() => setPeriod(d)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === d ? 'bg-brand-500 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}>
            {d} days
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Today Revenue', value: `₹${dashboard?.today?.revenue?.toFixed(0) || 0}`, sub: `${dashboard?.revenueChange > 0 ? '+' : ''}${dashboard?.revenueChange || 0}% vs yesterday`, color: 'text-emerald-600' },
          { label: 'Today Orders', value: dashboard?.today?.orders || 0, sub: `Week: ${dashboard?.week?.orders || 0}`, color: 'text-blue-600' },
          { label: 'Avg Order Value', value: `₹${dashboard?.today?.avgOrderValue?.toFixed(0) || 0}`, sub: 'Per order today', color: 'text-purple-600' },
          { label: 'Week Revenue', value: `₹${dashboard?.week?.revenue?.toFixed(0) || 0}`, sub: 'Last 7 days', color: 'text-brand-600' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="text-xs text-stone-500 font-semibold mb-1">{s.label}</div>
            <div className="font-display text-2xl font-black text-stone-900">{s.value}</div>
            <div className={`text-xs font-medium mt-1 ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="card mb-4">
        <div className="font-display font-bold text-stone-900 mb-4">Revenue Trend ({period} days)</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend}>
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip formatter={(v) => [`₹${v.toFixed(0)}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Top dishes */}
        <div className="card">
          <div className="font-display font-bold text-stone-900 mb-4">Top Dishes</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topItems.slice(0, 7)} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: 12 }} />
              <Bar dataKey="quantity" fill="#f97316" radius={[0, 6, 6, 0]}>
                {topItems.slice(0, 7).map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#f97316' : `rgba(249,115,22,${1 - i * 0.12})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status pie */}
        <div className="card">
          <div className="font-display font-bold text-stone-900 mb-4">Today's Order Status</div>
          {dashboard?.statusBreakdown ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={[
                    { name: 'Delivered', value: dashboard.statusBreakdown.delivered, fill: '#10b981' },
                    { name: 'Preparing', value: dashboard.statusBreakdown.preparing, fill: '#f97316' },
                    { name: 'Pending', value: dashboard.statusBreakdown.pending, fill: '#f59e0b' },
                    { name: 'Cancelled', value: dashboard.statusBreakdown.cancelled, fill: '#ef4444' },
                  ].filter(d => d.value > 0)} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {[
                  { label: 'Delivered', key: 'delivered', color: 'bg-emerald-500' },
                  { label: 'Preparing', key: 'preparing', color: 'bg-brand-500' },
                  { label: 'Pending', key: 'pending', color: 'bg-amber-500' },
                  { label: 'Cancelled', key: 'cancelled', color: 'bg-red-500' },
                ].map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-sm">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-stone-600">{s.label}</span>
                    <span className="font-bold text-stone-900 ml-auto">{dashboard.statusBreakdown[s.key] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-stone-400 text-sm">No data</div>}
        </div>
      </div>

      {/* Peak hours heatmap */}
      <div className="card">
        <div className="font-display font-bold text-stone-900 mb-4">Peak Hours Heatmap (30 days)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <td className="pr-2 text-stone-400 text-right w-10" />
                {Array.from({ length: 24 }, (_, h) => (
                  <td key={h} className="text-center text-stone-400 pb-1" style={{ minWidth: 24 }}>
                    {h % 4 === 0 ? `${h}h` : ''}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEATMAP_DAYS.map((day, di) => (
                <tr key={day}>
                  <td className="pr-2 text-stone-500 font-medium text-right">{day}</td>
                  {Array.from({ length: 24 }, (_, h) => {
                    const val = peakHours[di]?.[h] || 0;
                    const intensity = val / maxHeat;
                    return (
                      <td key={h} className="p-0.5" title={`${day} ${h}:00 - ${val} orders`}>
                        <div className="w-5 h-5 rounded-sm"
                          style={{ backgroundColor: val === 0 ? '#f5f5f4' : `rgba(249,115,22,${0.1 + intensity * 0.9})` }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-3 text-xs text-stone-400">
            <span>Less</span>
            {[0.1,0.3,0.5,0.7,0.9].map(o => (
              <div key={o} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(249,115,22,${o})` }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
