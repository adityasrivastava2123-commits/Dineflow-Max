import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { reviewsAPI } from '../../services/api';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`} />)}
    </div>
  );
}

export default function AdminReviews() {
  const [data, setData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsAPI.getAdminReviews().then(r => setData(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const ratingDist = [5,4,3,2,1].map(r => ({
    rating: r,
    count: data.reviews.filter(rv => rv.rating === r).length,
    pct: data.totalReviews ? Math.round(data.reviews.filter(rv => rv.rating === r).length / data.totalReviews * 100) : 0
  }));

  return (
    <AdminLayout title="Ratings & Reviews">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card text-center lg:col-span-1">
          <div className="font-display text-5xl font-black text-stone-900 mb-1">{data.averageRating.toFixed(1)}</div>
          <div className="flex justify-center mb-1"><StarRow rating={Math.round(data.averageRating)} /></div>
          <div className="text-xs text-stone-500">{data.totalReviews} reviews</div>
        </div>
        <div className="card lg:col-span-2">
          <div className="space-y-2">
            {ratingDist.map(r => (
              <div key={r.rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8 flex-shrink-0">
                  <span className="text-sm font-semibold text-stone-700">{r.rating}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-xs text-stone-500 w-8 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {data.reviews.map(r => (
            <div key={r._id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700">
                    {r.customerName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900 text-sm">{r.customerName}</div>
                    <div className="text-xs text-stone-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                <StarRow rating={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-stone-600 leading-relaxed pl-12">{r.comment}</p>}
            </div>
          ))}
          {data.reviews.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <Star className="w-10 h-10 mx-auto mb-3 text-stone-200" />
              <div className="font-semibold">No reviews yet</div>
              <div className="text-sm mt-1">Reviews appear after customers rate their orders</div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
