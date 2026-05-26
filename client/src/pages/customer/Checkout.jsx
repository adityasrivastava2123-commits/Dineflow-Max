import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Tag, Gift, CreditCard, Banknote, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ordersAPI, paymentsAPI, couponsAPI, loyaltyAPI, authAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant, tableNumber, items, subtotal } = location.state || {};
  const { clearCart } = useCart();

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [identified, setIdentified] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [tipPercent, setTipPercent] = useState(0);
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [usePoints, setUsePoints] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (!restaurant || !items?.length) {
      navigate(-1);
    }
  }, []);

  const handleIdentify = async () => {
    if (!customer.name.trim() || customer.phone.length < 10) {
      toast.error('Please enter valid name and phone');
      return;
    }
    try {
      const res = await authAPI.customerIdentify({ ...customer, restaurantId: restaurant.id });
      setToken(res.data.token);
      setIdentified(true);
      // Load loyalty
      const loyalty = await loyaltyAPI.getAccount(customer.phone, restaurant.id);
      setLoyaltyAccount(loyalty.data);
      toast.success(`Welcome, ${customer.name}!`);
    } catch { toast.error('Failed to identify. Try again.'); }
  };

  const validateCoupon = async () => {
    setCouponError('');
    try {
      const res = await couponsAPI.validate({ code: couponCode, restaurantId: restaurant.id, orderAmount: subtotal });
      if (res.data.valid) {
        setCouponData(res.data);
        toast.success(`Coupon applied! Saving ₹${res.data.discount.toFixed(0)}`);
      } else {
        setCouponError(res.data.message);
      }
    } catch { setCouponError('Invalid coupon'); }
  };

  const tipAmount = subtotal * tipPercent / 100;
  const couponDiscount = couponData?.discount || 0;
  const loyaltyDiscount = usePoints;
  const totalDiscount = couponDiscount + loyaltyDiscount;
  const taxAmount = ((subtotal - totalDiscount) * (restaurant?.taxRate || 5)) / 100;
  const totalAmount = subtotal - totalDiscount + taxAmount + tipAmount;

  const placeOrder = async (razorpayPaymentId = null, razorpayOrderId = null) => {
    const orderData = {
      restaurantId: restaurant.id,
      tableNumber,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.portion?.price || i.price,
        quantity: i.quantity,
        addons: i.addons || [],
        portion: i.portion,
        specialInstructions: i.specialInstructions,
        isVeg: i.isVeg,
      })),
      customerName: customer.name,
      customerPhone: customer.phone,
      paymentMethod,
      tipAmount,
      offerCode: couponData ? couponCode : undefined,
      loyaltyPointsUsed: usePoints,
      notes,
    };

    const res = await ordersAPI.placeOrder(orderData);

    if (razorpayPaymentId) {
      await paymentsAPI.verifyPayment({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: '', // handled server side
        orderId: res.data._id
      });
    }

    clearCart();
    navigate(`/order/${res.data._id}`, { state: { justPlaced: true } });
    toast.success('Order placed! 🎉');
  };

  const handleSubmit = async () => {
    if (!identified) { toast.error('Please enter your details first'); return; }
    setLoading(true);
    try {
      if (paymentMethod === 'razorpay') {
        const rpRes = await paymentsAPI.createOrder({ amount: totalAmount, orderId: 'checkout' });
        const { orderId: rpOrderId } = rpRes.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          name: restaurant.name,
          description: `Order for Table ${tableNumber || 'Takeaway'}`,
          order_id: rpOrderId,
          prefill: { name: customer.name, contact: customer.phone },
          theme: { color: restaurant.branding?.primaryColor || '#f97316' },
          handler: async (response) => {
            try {
              await placeOrder(response.razorpay_payment_id, response.razorpay_order_id);
            } catch { toast.error('Payment verified but order failed. Contact restaurant.'); }
          },
          modal: { ondismiss: () => { setLoading(false); } }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      await placeOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) return null;

  const maxPoints = Math.min(loyaltyAccount?.points || 0, Math.floor(totalAmount * 0.2)); // max 20% redemption

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-stone-100 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-lg">Checkout</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Customer details */}
        <div className="card">
          <div className="font-display font-bold text-stone-900 mb-3">Your Details</div>
          {!identified ? (
            <div className="space-y-3">
              <input className="input" placeholder="Your name" value={customer.name}
                onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
              <input className="input" type="tel" placeholder="Phone number" value={customer.phone}
                onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} maxLength={10} />
              <button onClick={handleIdentify} className="btn-primary w-full">Continue</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 font-bold">
                {customer.name[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-stone-900">{customer.name}</div>
                <div className="text-sm text-stone-500">{customer.phone}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="card">
          <div className="font-display font-bold text-stone-900 mb-3">Order Summary</div>
          <div className="space-y-2 mb-3">
            {items?.map((item, i) => {
              const price = (item.portion?.price || item.price) + (item.addons || []).reduce((s, a) => s + a.price, 0);
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-stone-100 rounded flex items-center justify-center text-xs font-bold text-stone-600">{item.quantity}</span>
                  <span className="flex-1 text-stone-700">{item.name}</span>
                  <span className="font-semibold text-stone-900">₹{(price * item.quantity).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-stone-100 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>₹{subtotal?.toFixed(0)}</span></div>
            {couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon discount</span><span>-₹{couponDiscount.toFixed(0)}</span></div>}
            {loyaltyDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Loyalty points</span><span>-₹{loyaltyDiscount.toFixed(0)}</span></div>}
            <div className="flex justify-between text-stone-600"><span>Tax ({restaurant.taxRate}%)</span><span>₹{taxAmount.toFixed(0)}</span></div>
            {tipAmount > 0 && <div className="flex justify-between text-stone-600"><span>Tip</span><span>₹{tipAmount.toFixed(0)}</span></div>}
            <div className="flex justify-between font-display font-black text-lg text-stone-900 pt-2 border-t border-stone-100">
              <span>Total</span><span>₹{totalAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Coupon */}
        {identified && (
          <div className="card">
            <div className="flex items-center gap-2 font-display font-bold text-stone-900 mb-3">
              <Tag className="w-4 h-4 text-brand-500" />Apply Coupon
            </div>
            {couponData ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div className="flex-1">
                  <div className="font-semibold text-emerald-800 text-sm">{couponCode.toUpperCase()}</div>
                  <div className="text-xs text-emerald-600">Saving ₹{couponDiscount.toFixed(0)}</div>
                </div>
                <button onClick={() => { setCouponData(null); setCouponCode(''); }} className="text-emerald-600 hover:text-emerald-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Enter coupon code" value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())} />
                <button onClick={validateCoupon} className="btn-secondary px-4">Apply</button>
              </div>
            )}
            {couponError && <div className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{couponError}</div>}
          </div>
        )}

        {/* Loyalty points */}
        {identified && loyaltyAccount && loyaltyAccount.points > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 font-display font-bold text-stone-900 mb-3">
              <Gift className="w-4 h-4 text-purple-500" />Loyalty Points
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-stone-900">{loyaltyAccount.points} points available</div>
                <div className="text-xs text-stone-500">1 point = ₹1 discount</div>
              </div>
              <div className="text-purple-600 font-bold text-sm">Worth ₹{loyaltyAccount.points}</div>
            </div>
            <input type="range" min={0} max={maxPoints} value={usePoints}
              onChange={e => setUsePoints(Number(e.target.value))}
              className="w-full accent-purple-500" />
            <div className="flex justify-between text-xs text-stone-500 mt-1">
              <span>₹0</span>
              <span className="text-purple-600 font-semibold">Using ₹{usePoints}</span>
              <span>₹{maxPoints}</span>
            </div>
          </div>
        )}

        {/* Tip */}
        {identified && (
          <div className="card">
            <div className="font-display font-bold text-stone-900 mb-3">Add a tip 🙏</div>
            <div className="flex gap-2">
              {[0, 5, 10, 15].map(pct => (
                <button key={pct} onClick={() => setTipPercent(pct)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tipPercent === pct ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                  {pct === 0 ? 'No tip' : `${pct}%`}
                </button>
              ))}
            </div>
            {tipPercent > 0 && <div className="mt-2 text-center text-sm text-stone-500">Adding ₹{tipAmount.toFixed(0)} as tip</div>}
          </div>
        )}

        {/* Payment method */}
        {identified && (
          <div className="card">
            <div className="font-display font-bold text-stone-900 mb-3">Payment Method</div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPaymentMethod('cash')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
                <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-brand-600' : 'text-stone-400'}`} />
                <div className="text-left">
                  <div className={`font-semibold text-sm ${paymentMethod === 'cash' ? 'text-brand-700' : 'text-stone-700'}`}>Cash</div>
                  <div className="text-xs text-stone-400">Pay at counter</div>
                </div>
              </button>
              <button onClick={() => setPaymentMethod('razorpay')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'razorpay' ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
                <CreditCard className={`w-5 h-5 ${paymentMethod === 'razorpay' ? 'text-brand-600' : 'text-stone-400'}`} />
                <div className="text-left">
                  <div className={`font-semibold text-sm ${paymentMethod === 'razorpay' ? 'text-brand-700' : 'text-stone-700'}`}>Online</div>
                  <div className="text-xs text-stone-400">UPI / Card</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        {identified && (
          <div className="card">
            <div className="font-display font-bold text-stone-900 mb-2">Order notes</div>
            <textarea className="input resize-none text-sm" rows={2}
              placeholder="Any special requests for the kitchen..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        )}

        {/* Place order */}
        <button onClick={handleSubmit} disabled={!identified || loading}
          className="btn-primary w-full py-4 text-base mb-8">
          {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : `Place order · ₹${totalAmount.toFixed(0)}`}
        </button>
      </div>

      {/* Load Razorpay */}
      {paymentMethod === 'razorpay' && (
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      )}
    </div>
  );
}
