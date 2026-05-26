import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChefHat, Zap, BarChart3, QrCode, Shield, Globe, 
  Star, Check, ArrowRight, Menu, X, ChevronDown,
  Smartphone, Printer, Bell, CreditCard, Clock, Users
} from 'lucide-react';

const PLANS = [
  { name: 'Trial', price: 0, period: '30 days', color: 'stone', features: ['Up to 5 tables', 'Basic menu', 'Order management', 'QR codes'] },
  { name: 'Basic', price: 999, period: '/month', color: 'blue', popular: false, features: ['Up to 20 tables', 'Menu management', 'Analytics', 'WhatsApp alerts', 'Coupon codes'] },
  { name: 'Standard', price: 1999, period: '/month', color: 'orange', popular: true, features: ['Unlimited tables', 'Kitchen Display', 'Loyalty points', 'Inventory tracking', 'PDF invoices', 'Multi-menu (breakfast/lunch/dinner)', 'Priority support'] },
  { name: 'Premium', price: 3999, period: '/month', color: 'purple', features: ['Everything in Standard', 'Multiple branches', 'GST reports', 'White label', 'Staff management', 'API access', 'Dedicated support'] },
];

const FEATURES = [
  { icon: QrCode, title: 'QR Table Ordering', desc: 'Customers scan, browse, and order — no app download needed. Pure web magic.', color: 'orange' },
  { icon: ChefHat, title: 'Kitchen Display System', desc: 'Live order queue with sound alerts, timers, and one-tap status updates.', color: 'red' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Revenue trends, peak hours heatmap, bestsellers — know your restaurant inside out.', color: 'blue' },
  { icon: Smartphone, title: 'PWA Mobile Apps', desc: 'Install on any device. Works offline. No app store required.', color: 'green' },
  { icon: CreditCard, title: 'Razorpay Payments', desc: 'UPI, cards, net banking — every payment method Indians love.', color: 'purple' },
  { icon: Bell, title: 'WhatsApp Notifications', desc: 'Auto alerts for new orders, order ready, subscription expiry.', color: 'emerald' },
  { icon: Shield, title: 'Multi-tenant Architecture', desc: 'Each restaurant fully isolated. Your data is yours, always.', color: 'stone' },
  { icon: Globe, title: 'Multi-language', desc: 'Hindi + English toggle. Auto-detects browser language.', color: 'cyan' },
];

const TESTIMONIALS = [
  { name: 'Rajesh Sharma', role: 'Owner, Sharma Dhaba, Delhi', rating: 5, text: 'Orders ki management bahut easy ho gayi. Kitchen staff ko new order ka sound alert milta hai turant. Revenue 40% badh gaya!', avatar: 'RS' },
  { name: 'Priya Nair', role: 'Manager, Spice Garden, Kochi', rating: 5, text: 'The QR ordering system is brilliant. Customers love it, and we\'ve reduced order errors by 90%. Best investment for our restaurant.', avatar: 'PN' },
  { name: 'Mohammed Raza', role: 'Owner, Raza Biryani House, Hyderabad', rating: 5, text: 'GST invoice generation alone saved us 2 hours daily. The analytics dashboard shows exactly which dishes make the most money.', avatar: 'MR' },
];

const colorMap = {
  orange: 'bg-orange-50 text-orange-600', red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600', emerald: 'bg-emerald-50 text-emerald-600',
  stone: 'bg-stone-100 text-stone-600', cyan: 'bg-cyan-50 text-cyan-600',
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const FAQS = [
    { q: 'Do I need to download an app?', a: 'No. DineFlow is a Progressive Web App. Your customers just scan a QR code and start ordering instantly in their browser. You can install the admin and kitchen apps on your home screen like a native app.' },
    { q: 'Does it work without internet?', a: 'The menu browsing works offline after first load. Orders require an internet connection to be sent to the kitchen.' },
    { q: 'How does the QR code ordering work?', a: 'Each table gets a unique QR code. Customers scan it, see your menu, add items to cart, and pay — all in one flow. You get instant WhatsApp alerts and the kitchen display updates live.' },
    { q: 'Can I manage multiple restaurant branches?', a: 'Yes! The Premium plan supports multiple branches, each with their own menus, staff, and analytics — all managed from one superadmin panel.' },
    { q: 'Is Razorpay mandatory?', a: 'No. Customers can choose to pay by cash at checkout. Razorpay is optional and only needed if you want online payments (UPI, cards, net banking).' },
  ];

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-stone-900">DineFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'How it works', 'Testimonials'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-stone-700 hover:text-stone-900 px-4 py-2 rounded-xl hover:bg-stone-100 transition-all">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Start free trial
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-3 animate-fade-in">
            {['Features', 'Pricing', 'How it works', 'Testimonials'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-stone-600 font-medium">
                {item}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/login" className="btn-secondary w-full">Sign in</Link>
              <Link to="/register" className="btn-primary w-full">Start free trial</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-orange-50/30" />
        <div className="absolute top-32 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-16 left-0 w-72 h-72 bg-amber-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-orange-100/40 rounded-full blur-2xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative max-w-6xl mx-auto px-4 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-semibold text-orange-700 mb-6">
              <Zap className="w-3 h-3" />
              Restaurant OS for Modern India
            </div>

            <h1 className="font-display text-5xl lg:text-6xl font-black text-stone-950 leading-[1.05] mb-6">
              Run your restaurant
              <span className="block text-brand-500">like a tech startup</span>
            </h1>

            <p className="text-lg text-stone-500 leading-relaxed mb-8 max-w-lg">
              QR ordering, kitchen display, live analytics, Razorpay payments, loyalty points, GST invoices — everything your restaurant needs in one beautiful platform.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/register" className="btn-primary px-6 py-3 text-base shadow-warm">
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="btn-secondary px-6 py-3 text-base">
                See how it works
              </a>
            </div>

            <div className="flex items-center gap-6 text-sm text-stone-500">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />30-day free trial</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />No credit card needed</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />Setup in 5 mins</div>
            </div>
          </div>

          {/* Hero visual - mock dashboard */}
          <div className="relative animate-fade-up lg:ml-8" style={{ animationDelay: '0.15s' }}>
            <div className="relative bg-white rounded-3xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.2)] border border-stone-100 overflow-hidden">
              {/* Mock top bar */}
              <div className="bg-stone-950 px-5 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-stone-800 rounded-md px-3 py-1 text-xs text-stone-400">dineflow.app/restaurant/spice-garden</div>
              </div>

              {/* Mock menu */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-stone-900">Spice Garden</div>
                    <div className="text-xs text-stone-500 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />4.8 · Table 5</div>
                  </div>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {['Starters', 'Mains', 'Biryani', 'Desserts', 'Drinks'].map((cat, i) => (
                    <div key={cat} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${i === 0 ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600'}`}>{cat}</div>
                  ))}
                </div>

                {/* Menu items */}
                {[
                  { name: 'Paneer Tikka', price: 280, veg: true, rating: 4.7 },
                  { name: 'Chicken 65', price: 320, veg: false, rating: 4.9 },
                  { name: 'Dal Makhani', price: 220, veg: true, rating: 4.5 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-stone-50 last:border-0">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className={`w-2.5 h-2.5 rounded-sm border ${item.veg ? 'border-emerald-500' : 'border-red-500'} flex items-center justify-center`}>
                          <div className={`w-1 h-1 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </div>
                        <span className="text-sm font-semibold text-stone-900 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">₹{item.price}</span>
                        <span className="text-xs text-stone-400">· ⭐ {item.rating}</span>
                      </div>
                    </div>
                    <button className="w-7 h-7 bg-brand-500 rounded-lg text-white text-lg font-bold flex items-center justify-center flex-shrink-0">+</button>
                  </div>
                ))}
              </div>

              {/* Cart bar */}
              <div className="mx-4 mb-4 bg-stone-950 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="text-white">
                  <div className="text-xs text-stone-400">3 items</div>
                  <div className="font-display font-bold text-sm">₹820</div>
                </div>
                <button className="bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1">
                  View cart <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Floating alerts */}
            <div className="absolute -left-6 top-24 bg-white rounded-2xl shadow-card-lg border border-stone-100 px-4 py-3 flex items-center gap-3 animate-pulse-soft">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center"><Bell className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <div className="text-xs font-bold text-stone-900">New Order!</div>
                <div className="text-[11px] text-stone-500">Table 7 · ₹640</div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-28 bg-white rounded-2xl shadow-card-lg border border-stone-100 px-4 py-3">
              <div className="text-xs text-stone-500 mb-1">Today's Revenue</div>
              <div className="font-display font-black text-xl text-stone-900">₹18,240</div>
              <div className="text-xs text-emerald-600 font-semibold">↑ 23% vs yesterday</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-stone-950 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Restaurants' },
            { value: '2M+', label: 'Orders processed' },
            { value: '₹50Cr+', label: 'Revenue managed' },
            { value: '4.9★', label: 'Average rating' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="font-display text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-stone-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-xs font-semibold text-orange-600 mb-4">
              Everything you need
            </div>
            <h2 className="font-display text-4xl font-black text-stone-950 mb-4">Built for Indian restaurants</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              Every feature designed with real restaurant owners in mind. No bloat, no complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-hover group">
                <div className={`w-10 h-10 ${colorMap[f.color]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-black text-stone-950 mb-4">Up and running in minutes</h2>
            <p className="text-stone-500 text-lg">Three steps. That's it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign up & setup', desc: 'Register your restaurant, add your menu, configure tables. Takes 5 minutes.' },
              { step: '02', title: 'Print QR codes', desc: 'Download QR codes for each table. Customers scan to open your menu instantly.' },
              { step: '03', title: 'Take orders 24/7', desc: 'Orders flow to kitchen display automatically. Get WhatsApp alerts. Track everything.' },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                {i < 2 && <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-stone-200 -translate-x-1/2 z-0" />}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 bg-stone-950 text-white font-display font-black text-xl rounded-2xl mb-4">
                  {step.step}
                </div>
                <h3 className="font-display font-bold text-xl text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-black text-stone-950 mb-4">Simple, honest pricing</h2>
            <p className="text-stone-500 text-lg">Start free. Upgrade when you grow.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {PLANS.map((plan, i) => (
              <div key={i} className={`relative rounded-2xl border p-6 flex flex-col ${plan.popular ? 'border-brand-500 shadow-warm bg-orange-50/30 scale-105' : 'border-stone-200 bg-white'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <div className="font-display font-bold text-lg text-stone-900">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display font-black text-3xl text-stone-950">
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && <span className="text-stone-500 text-sm">{plan.period}</span>}
                  </div>
                  {plan.price === 0 && <div className="text-stone-500 text-sm">{plan.period}</div>}
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/register" className={`w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.popular ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-warm' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}>
                  {plan.price === 0 ? 'Start free' : 'Get started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-stone-950">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-black text-white mb-4">Loved by restaurant owners</h2>
            <p className="text-stone-400 text-lg">Across India, from dhabas to fine dining</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-stone-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-stone-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-black text-stone-950 mb-4">Questions? We've got answers.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-stone-200 rounded-xl overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition-colors">
                  <span className="font-semibold text-stone-900">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-stone-500 flex-shrink-0 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-4 text-sm text-stone-600 leading-relaxed animate-fade-in border-t border-stone-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative text-center max-w-2xl mx-auto px-4">
          <h2 className="font-display text-5xl font-black text-white mb-4">
            Ready to transform<br />your restaurant?
          </h2>
          <p className="text-stone-400 text-lg mb-8">Start your 30-day free trial today. No credit card required.</p>
          <Link to="/register" className="btn-primary px-8 py-4 text-base shadow-warm inline-flex">
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-stone-800 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">DineFlow</span>
          </div>
          <div className="text-stone-500 text-sm">© 2024 DineFlow. Made with ❤️ for Indian restaurants.</div>
          <div className="flex gap-4 text-sm text-stone-500">
            <a href="#" className="hover:text-stone-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
