import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-card-lg px-3 py-2.5 text-sm">
      <p className="font-semibold text-stone-700 mb-1">
        {label ? format(typeof label === 'string' ? parseISO(label) : new Date(label), 'MMM d') : ''}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name === 'revenue' ? `₹${Number(entry.value).toLocaleString('en-IN')}` : `${entry.value} orders`}
        </p>
      ))}
    </div>
  );
};

export default function RevenueChart({ data = [], loading = false }) {
  const [chartType, setChartType] = useState('area');

  const formattedData = data.map((d) => ({
    ...d,
    label: d.date ? format(parseISO(d.date), 'MMM d') : d.label,
  }));

  if (loading) {
    return (
      <div className="h-48 flex items-end gap-2 px-2 pb-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-stone-200 animate-pulse rounded-t"
            style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-stone-400 text-sm">
        No data available
      </div>
    );
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        {['area', 'bar'].map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
              chartType === type
                ? 'bg-brand-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {type === 'area' ? 'Line' : 'Bar'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        {chartType === 'area' ? (
          <AreaChart data={formattedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        ) : (
          <BarChart data={formattedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="revenue" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
