import { paymentsAPI } from './api';

/**
 * Load Razorpay script dynamically
 */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Initiate Razorpay payment flow
 * @param {Object} options
 * @param {string} options.orderId        - DineFlow order _id
 * @param {number} options.amount         - amount in INR (not paise)
 * @param {string} options.restaurantName
 * @param {Object} options.customer       - { name, phone, email }
 * @param {Function} options.onSuccess    - called with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @param {Function} options.onFailure    - called with error
 */
export const initiateRazorpayPayment = async ({
  orderId,
  amount,
  restaurantName,
  customer,
  onSuccess,
  onFailure,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onFailure?.(new Error('Failed to load Razorpay SDK'));
    return;
  }

  try {
    // Create order on backend
    const res = await paymentsAPI.createOrder({ amount, orderId });
    const { orderId: rzpOrderId, amount: rzpAmount, currency } = res.data;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
      amount: rzpAmount,
      currency: currency || 'INR',
      name: restaurantName || 'DineFlow',
      description: `Payment for order #${orderId?.slice(-8).toUpperCase()}`,
      order_id: rzpOrderId,
      prefill: {
        name: customer?.name || '',
        contact: customer?.phone || '',
        email: customer?.email || `${customer?.phone}@guest.dineflow.io`,
      },
      theme: { color: '#f97316' },
      modal: {
        ondismiss: () => onFailure?.(new Error('Payment cancelled by user')),
      },
      handler: async (response) => {
        try {
          // Verify on backend
          await paymentsAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });
          onSuccess?.(response);
        } catch (err) {
          onFailure?.(err);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      onFailure?.(new Error(response.error?.description || 'Payment failed'));
    });
    rzp.open();
  } catch (err) {
    onFailure?.(err);
  }
};

/**
 * Convenience: pay for a subscription plan
 */
export const initiateSubscriptionPayment = async ({
  plan,
  restaurantName,
  customer,
  onSuccess,
  onFailure,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onFailure?.(new Error('Failed to load Razorpay SDK'));
    return;
  }

  try {
    const res = await paymentsAPI.createSubscription(plan);
    const { orderId: rzpOrderId, amount: rzpAmount, planDetails } = res.data;

    if (planDetails?.price === 0) {
      // Free trial — no payment needed
      onSuccess?.({ plan, free: true });
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
      amount: rzpAmount,
      currency: 'INR',
      name: 'DineFlow Pro',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
      order_id: rzpOrderId,
      prefill: {
        name: customer?.name || '',
        contact: customer?.phone || '',
        email: customer?.email || '',
      },
      theme: { color: '#f97316' },
      handler: async (response) => {
        try {
          await paymentsAPI.verifySubscription({ ...response, plan });
          onSuccess?.(response);
        } catch (err) {
          onFailure?.(err);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (r) =>
      onFailure?.(new Error(r.error?.description || 'Payment failed'))
    );
    rzp.open();
  } catch (err) {
    onFailure?.(err);
  }
};
