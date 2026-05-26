import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, X, Plus, Minus, ChevronDown, ChevronUp,
  Star, Flame, Leaf, Info, Clock, Filter, Sun, Moon, MapPin,
  AlertCircle, CheckCircle2, Package
} from 'lucide-react';
import { menuAPI, loyaltyAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const DIET_FILTERS = [
  { key: 'veg', label: '🟢 Veg', field: 'isVeg' },
  { key: 'vegan', label: '🌿 Vegan', field: 'isVegan' },
  { key: 'jain', label: '⭕ Jain', field: 'isJain' },
  { key: 'glutenFree', label: '🌾 GF', field: 'isGlutenFree' },
];

function VegDot({ isVeg }) {
  return (
    <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
    </div>
  );
}

function StarRating({ rating, count }) {
  if (!rating || !count) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
      <span className="text-xs font-semibold text-stone-600">{rating.toFixed(1)}</span>
      <span className="text-xs text-stone-400">({count})</span>
    </div>
  );
}

function ItemModal({ item, onClose, onAdd, lang }) {
  const [selectedPortion, setSelectedPortion] = useState(item.portions?.[0] || null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState('');

  const price = selectedPortion?.price || item.price;
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const total = (price + addonsTotal) * qty;

  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const handleAdd = () => {
    onAdd({
      menuItemId: item._id,
      name: lang === 'hi' && item.nameHindi ? item.nameHindi : item.name,
      price: selectedPortion?.price || item.price,
      addons: selectedAddons,
      portion: selectedPortion,
      specialInstructions: instructions,
      isVeg: item.isVeg,
    });
    onClose();
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-up">
        {/* Image */}
        {item.image && (
          <div className="h-48 bg-stone-100 flex-shrink-0 overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-start gap-2 mb-1">
            <VegDot isVeg={item.isVeg} />
            <div>
              <h2 className="font-display font-bold text-xl text-stone-900">{lang === 'hi' && item.nameHindi ? item.nameHindi : item.name}</h2>
              {item.nameHindi && lang === 'en' && <div className="text-xs text-stone-400">{item.nameHindi}</div>}
            </div>
          </div>
          {item.description && <p className="text-stone-500 text-sm mb-3 leading-relaxed">{item.description}</p>}

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={item.ratings?.average} count={item.ratings?.count} />
            {item.calories && <span className="text-xs text-stone-400">{item.calories} kcal</span>}
            {item.preparationTime && (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Clock className="w-3 h-3" />{item.preparationTime} min
              </span>
            )}
          </div>

          {/* Allergens */}
          {item.allergens?.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-amber-700">Contains allergens</div>
                <div className="text-xs text-amber-600 capitalize">{item.allergens.join(', ')}</div>
              </div>
            </div>
          )}

          {/* Portions */}
          {item.portions?.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-stone-700 mb-2">Size</div>
              <div className="flex gap-2 flex-wrap">
                {item.portions.map(p => (
                  <button key={p.size} onClick={() => setSelectedPortion(p)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedPortion?.size === p.size ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-200 text-stone-700 hover:border-brand-300'}`}>
                    {p.size} · ₹{p.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons?.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-stone-700 mb-2">Add-ons</div>
              <div className="space-y-2">
                {item.addons.map(addon => (
                  <label key={addon.name} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedAddons.some(a => a.name === addon.name)}
                      onChange={() => toggleAddon(addon)}
                      className="w-4 h-4 rounded accent-brand-500" />
                    <span className="flex-1 text-sm text-stone-700">{addon.name}</span>
                    <span className="text-sm font-semibold text-stone-900">+₹{addon.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-stone-700 mb-2">Special instructions</div>
            <textarea className="input resize-none text-sm" rows={2}
              placeholder="e.g. No onion, extra spicy..."
              value={instructions} onChange={e => setInstructions(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-stone-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-stone-700">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-stone-900">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center text-stone-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button onClick={handleAdd} className="btn-primary flex-1 py-3">
              Add to cart · ₹{total.toFixed(0)}
            </button>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CartDrawer({ items, restaurant, tableNumber, onClose, subtotal }) {
  const navigate = useNavigate();
  const { updateQty, removeItem } = useCart();

  const handleCheckout = () => {
    if (!restaurant) return;
    navigate('/checkout', { state: { restaurant, tableNumber, items, subtotal } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl max-h-[80vh] flex flex-col animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="font-display font-bold text-xl text-stone-900">Your order</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.map(item => {
            const price = (item.portion?.price || item.price) + (item.addons || []).reduce((s, a) => s + a.price, 0);
            return (
              <div key={item.key} className="flex items-start gap-3">
                <div className="flex items-center gap-1 bg-stone-100 rounded-xl px-1 flex-shrink-0">
                  <button onClick={() => updateQty(item.key, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center">
                    <Minus className="w-3.5 h-3.5 text-stone-600" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.key, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-stone-600" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-900">{item.name}</div>
                  {item.portion && <div className="text-xs text-stone-400">{item.portion.size}</div>}
                  {item.addons?.length > 0 && <div className="text-xs text-stone-400">+{item.addons.map(a => a.name).join(', ')}</div>}
                </div>
                <div className="font-bold text-stone-900 text-sm flex-shrink-0">₹{(price * item.quantity).toFixed(0)}</div>
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-stone-600">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</div>
            <div className="font-display font-black text-xl text-stone-900">₹{subtotal.toFixed(0)}</div>
          </div>
          <button onClick={handleCheckout} className="btn-primary w-full py-3 text-base">
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');

  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [dietFilter, setDietFilter] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const categoryRefs = useRef({});
  const { items: cartItems, subtotal, itemCount, addItem, setRestaurant } = useCart();

  useEffect(() => {
    menuAPI.getMenu(slug).then(res => {
      setMenuData(res.data);
      setActiveCategory(res.data.categories[0] || '');
      setRestaurant(res.data.restaurant.id);
      setLoading(false);
      // Auto-detect language
      const browserLang = navigator.language.startsWith('hi') ? 'hi' : 'en';
      setLang(browserLang);
    }).catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return () => document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const filteredItems = useCallback(() => {
    if (!menuData) return {};
    const result = {};
    for (const cat of menuData.categories) {
      let items = menuData.items.filter(i => i.category === cat);
      if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()));
      if (dietFilter) {
        const filter = DIET_FILTERS.find(f => f.key === dietFilter);
        if (filter) items = items.filter(i => i[filter.field]);
      }
      if (ratingFilter) items = items.filter(i => (i.ratings?.average || 0) >= ratingFilter);
      if (items.length > 0) result[cat] = items;
    }
    return result;
  }, [menuData, search, dietFilter, ratingFilter]);

  const grouped = filteredItems();

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-stone-500 text-sm">Loading menu...</div>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <div className="font-display font-bold text-xl text-stone-800">Restaurant not found</div>
          <div className="text-stone-500 text-sm mt-1">Check the QR code and try again</div>
        </div>
      </div>
    );
  }

  const { restaurant } = menuData;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-stone-950' : 'bg-stone-50'} font-body`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'} border-b`}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {restaurant.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className={`font-display font-bold text-base leading-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>{restaurant.name}</h1>
              <div className="flex items-center gap-2">
                {tableNumber && (
                  <span className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Table {tableNumber}</span>
                )}
                {restaurant.rating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-stone-500">{restaurant.rating.toFixed(1)}</span>
                  </div>
                )}
                {restaurant.happyHoursActive && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                    🎉 Happy Hours -{restaurant.happyHoursDiscount}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
                className={`px-2 py-1 text-xs font-bold rounded-lg ${darkMode ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>
                {lang === 'en' ? 'हि' : 'EN'}
              </button>
              <button onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border ${darkMode ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400'} focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Diet filters */}
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
            {DIET_FILTERS.map(f => (
              <button key={f.key} onClick={() => setDietFilter(dietFilter === f.key ? null : f.key)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${dietFilter === f.key ? 'bg-brand-500 text-white' : darkMode ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>
                {f.label}
              </button>
            ))}
            <button onClick={() => setRatingFilter(ratingFilter ? null : 4)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${ratingFilter ? 'bg-brand-500 text-white' : darkMode ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>
              <Star className="w-3 h-3" /> 4+
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}>
          <div className="max-w-2xl mx-auto px-4 flex gap-1 overflow-x-auto py-2 scrollbar-thin">
            {Object.keys(grouped).map(cat => (
              <button key={cat} onClick={() => scrollToCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-brand-500 text-white' : darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu content */}
      <div className="max-w-2xl mx-auto px-4 pb-32">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} ref={el => categoryRefs.current[category] = el} className="pt-6">
            <h2 className={`font-display font-bold text-lg mb-3 ${darkMode ? 'text-white' : 'text-stone-900'}`}>{category}</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item._id} onClick={() => setSelectedItem(item)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${darkMode ? 'bg-stone-900 border-stone-800 hover:border-stone-700' : 'bg-white border-stone-100 hover:border-stone-200'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <VegDot isVeg={item.isVeg} />
                      {item.isBestseller && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">Bestseller</span>}
                      {item.isSpicy && <Flame className="w-3 h-3 text-red-500" />}
                    </div>
                    <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                      {lang === 'hi' && item.nameHindi ? item.nameHindi : item.name}
                    </h3>
                    {item.description && (
                      <p className={`text-xs leading-relaxed line-clamp-2 mt-0.5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`font-display font-bold text-base ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                        ₹{item.price}
                      </span>
                      <StarRating rating={item.ratings?.average} count={item.ratings?.count} />
                      {item.calories && <span className="text-xs text-stone-400">{item.calories}kcal</span>}
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <div className={`w-20 h-20 rounded-xl ${darkMode ? 'bg-stone-800' : 'bg-stone-100'} flex items-center justify-center`}>
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                      className="absolute -bottom-2 -right-2 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-warm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Search className="w-10 h-10 mb-3" />
            <div className="font-semibold">No items found</div>
            <div className="text-sm mt-1">Try a different search or filter</div>
          </div>
        )}
      </div>

      {/* Cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/20 to-transparent">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setCartOpen(true)}
              className="w-full bg-stone-950 text-white rounded-2xl px-5 py-4 flex items-center shadow-2xl hover:bg-stone-900 transition-colors">
              <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center text-xs font-black mr-3 flex-shrink-0">
                {itemCount}
              </div>
              <span className="font-semibold flex-1 text-left">View cart</span>
              <span className="font-display font-black text-lg">₹{subtotal.toFixed(0)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <ItemModal item={selectedItem} lang={lang} onClose={() => setSelectedItem(null)} onAdd={addItem} />
      )}
      {cartOpen && (
        <CartDrawer items={cartItems} restaurant={restaurant} tableNumber={tableNumber} subtotal={subtotal} onClose={() => setCartOpen(false)} />
      )}
    </div>
  );
}
