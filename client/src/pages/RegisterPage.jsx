import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, AlertCircle, Check } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    restaurantName: '', restaurantSlug: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRestaurantName = (val) => {
    setForm(f => ({
      ...f,
      restaurantName: val,
      restaurantSlug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { token, user } = res.data;
      localStorage.setItem('dineflow_token', token);
      localStorage.setItem('dineflow_user', JSON.stringify(user));
      toast.success('Restaurant created! Welcome to DineFlow 🎉');
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-warm">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-stone-950">DineFlow</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-stone-900">Create your restaurant</h1>
          <p className="text-stone-500 text-sm mt-1">Start your 30-day free trial · No credit card required</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="pb-3 mb-3 border-b border-stone-100">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Restaurant Details</div>
              <div className="space-y-3">
                <div>
                  <label className="label">Restaurant name</label>
                  <input className="input" placeholder="Sharma's Dhaba" value={form.restaurantName}
                    onChange={e => handleRestaurantName(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Restaurant URL</label>
                  <div className="relative">
                    <input className="input pl-[120px]" placeholder="sharma-dhaba" value={form.restaurantSlug}
                      onChange={e => setForm(f => ({ ...f, restaurantSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      required />
                    <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 text-stone-400 text-sm pointer-events-none">
                      dineflow.app/r/
                    </div>
                  </div>
                  {form.restaurantSlug && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                      <Check className="w-3 h-3" />
                      dineflow.app/r/{form.restaurantSlug}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Your Account</div>
              <div className="space-y-3">
                <div>
                  <label className="label">Your name</label>
                  <input className="input" placeholder="Ramesh Sharma" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" placeholder="you@email.com" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input type="tel" className="input" placeholder="+91 98765 43210" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input" placeholder="Min. 8 characters" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Create restaurant — It\'s free!'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-stone-500">
            Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="mt-4 flex justify-center gap-6 text-xs text-stone-400">
          {['30-day free trial', 'No credit card', 'Cancel anytime'].map(f => (
            <div key={f} className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
