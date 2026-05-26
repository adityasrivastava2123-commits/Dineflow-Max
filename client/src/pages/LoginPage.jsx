import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_REDIRECTS = {
  superadmin: '/superadmin',
  admin: '/admin',
  manager: '/admin',
  kitchen: '/kitchen',
  customer: '/dashboard',
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const from = location.state?.from || ROLE_REDIRECTS[user.role] || '/';
      toast.success(`Welcome back, ${user.name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-warm">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-stone-950">DineFlow</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-stone-900">Welcome back</h1>
          <p className="text-stone-500 text-sm mt-1">Sign in to your restaurant dashboard</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@restaurant.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required autoFocus />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-stone-100 space-y-3 text-sm text-center text-stone-500">
            <p>Don't have an account? <Link to="/register" className="text-brand-600 font-semibold hover:underline">Register your restaurant</Link></p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <div className="font-semibold mb-2">Demo credentials:</div>
          <div>Admin: admin@demo.com / demo123</div>
          <div>Kitchen: kitchen@demo.com / demo123</div>
          <div>SuperAdmin: super@dineflow.app / admin123</div>
        </div>
      </div>
    </div>
  );
}
