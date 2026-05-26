export const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${timestamp}-${random}`;
};

export const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    const itemPrice = item.price * item.quantity;
    const addonsPrice = (item.addons || []).reduce((sum, addon) => sum + (addon.price || 0), 0);
    return total + itemPrice + addonsPrice;
  }, 0);
};

export const applyTax = (amount) => {
  const taxPercent = parseFloat(process.env.TAX_PERCENT) || 5;
  return amount + (amount * taxPercent) / 100;
};

export const formatOrder = (order) => {
  return {
    ...order.toObject(),
    formattedTotal: `₹${order.totalAmount.toLocaleString("en-IN")}`,
    formattedSubtotal: `₹${order.subtotal.toLocaleString("en-IN")}`,
    formattedTax: `₹${order.tax.toLocaleString("en-IN")}`,
  };
};
