// RestaurantProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, Clock, QrCode } from 'lucide-react';
import { restaurantAPI } from '../../services/api';

export default function RestaurantProfile() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restaurantAPI.getPublic(slug).then(r => setRestaurant(r.data)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!restaurant) return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="h-48 bg-gradient-to-br from-stone-800 to-stone-950 relative overflow-hidden">
        {restaurant.coverImage && <img src={restaurant.coverImage} alt="" className="w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0 flex items-end p-6">
          <div className="flex items-center gap-4">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="w-16 h-16 rounded-2xl border-2 border-white object-cover" />
            ) : (
              <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl border-2 border-white">{restaurant.name[0]}</div>
            )}
            <div>
              <h1 className="font-display font-black text-2xl text-white">{restaurant.name}</h1>
              {restaurant.rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-white font-semibold">{restaurant.rating.toFixed(1)}</span>
                  <span className="text-white/60 text-sm">({restaurant.totalReviews} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {restaurant.description && (
          <div className="card">
            <p className="text-stone-600 text-sm leading-relaxed">{restaurant.description}</p>
          </div>
        )}

        <div className="card space-y-3">
          <div className="font-display font-bold text-stone-900">Info</div>
          {restaurant.address?.city && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <MapPin className="w-4 h-4 text-stone-400" />
              {[restaurant.address.street, restaurant.address.city, restaurant.address.state].filter(Boolean).join(', ')}
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Phone className="w-4 h-4 text-stone-400" />{restaurant.phone}
            </div>
          )}
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6 text-brand-500" />
          </div>
          <div className="font-display font-bold text-stone-900 mb-1">Order from your table</div>
          <div className="text-stone-500 text-sm mb-4">Scan the QR code at your table or click below to browse the menu</div>
          <Link to={`/restaurant/${slug}`} className="btn-primary w-full justify-center py-3">
            View Menu & Order
          </Link>
        </div>
      </div>
    </div>
  );
}
