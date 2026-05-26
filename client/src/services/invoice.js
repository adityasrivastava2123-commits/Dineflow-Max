import jsPDF from 'jspdf';

/**
 * Generate a PDF invoice for an order and trigger download.
 * @param {Object} order - order object with items, totals, etc.
 * @param {Object} restaurant - restaurant details
 * @returns {string} - PDF blob URL
 */
export const generateInvoicePDF = (order, restaurant) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a6' });
  const W = doc.internal.pageSize.getWidth();
  let y = 10;

  const line = () => {
    doc.setDrawColor(220, 220, 210);
    doc.line(10, y, W - 10, y);
    y += 4;
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 20);
  doc.text(restaurant?.name || 'Restaurant', W / 2, y, { align: 'center' });
  y += 6;

  if (restaurant?.address) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108);
    const addr = typeof restaurant.address === 'string' ? restaurant.address
      : [restaurant.address.street, restaurant.address.city, restaurant.address.state].filter(Boolean).join(', ');
    doc.text(addr, W / 2, y, { align: 'center' });
    y += 5;
  }

  if (restaurant?.phone) {
    doc.setFontSize(8);
    doc.text(`📞 ${restaurant.phone}`, W / 2, y, { align: 'center' });
    y += 5;
  }

  line();

  // Invoice details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 20);
  doc.text('TAX INVOICE', W / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 70);
  doc.text(`Order: #${order.orderNumber || order._id?.slice(-8).toUpperCase()}`, 10, y);
  doc.text(`Table: ${order.tableNumber}`, W - 10, y, { align: 'right' });
  y += 4;
  doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}`, 10, y);
  y += 5;

  if (order.customer) {
    doc.text(`Customer: ${order.customer.name || 'Guest'} · ${order.customer.phone || ''}`, 10, y);
    y += 4;
  }

  line();

  // Items header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 20);
  doc.text('Item', 10, y);
  doc.text('Qty', W - 40, y);
  doc.text('Amount', W - 10, y, { align: 'right' });
  y += 4;
  line();

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 40);

  for (const item of order.items || []) {
    const price = item.portion?.price || item.price;
    const addonsTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
    const lineTotal = (price + addonsTotal) * item.quantity;

    doc.text(item.name.substring(0, 24), 10, y);
    doc.text(`${item.quantity}`, W - 40, y);
    doc.text(`₹${lineTotal.toFixed(0)}`, W - 10, y, { align: 'right' });
    y += 4;

    if (item.specialInstructions) {
      doc.setTextColor(180, 120, 50);
      doc.text(`  "${item.specialInstructions}"`, 10, y);
      doc.setTextColor(50, 50, 40);
      y += 3;
    }
  }

  line();

  // Totals
  const addRow = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 9 : 8);
    doc.text(label, W - 50, y);
    doc.text(value, W - 10, y, { align: 'right' });
    y += 4;
  };

  addRow('Subtotal', `₹${(order.subtotal || 0).toFixed(0)}`);

  if (order.discount > 0) {
    doc.setTextColor(16, 185, 129);
    addRow('Discount', `-₹${order.discount.toFixed(0)}`);
    doc.setTextColor(50, 50, 40);
  }

  addRow(`Tax (${order.taxRate || 5}%)`, `₹${(order.tax || 0).toFixed(0)}`);

  if (order.tip > 0) addRow('Tip', `₹${order.tip.toFixed(0)}`);

  doc.setTextColor(30, 30, 20);
  addRow('TOTAL', `₹${(order.totalAmount || 0).toFixed(0)}`, true);

  y += 2;
  // Payment status
  const payColor = order.paymentStatus === 'paid' ? [16, 185, 129] : [245, 158, 11];
  doc.setTextColor(...payColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    order.paymentStatus === 'paid' ? '✓ PAID' : 'PAYMENT PENDING',
    W / 2, y, { align: 'center' }
  );
  y += 7;

  // Footer
  doc.setTextColor(160, 160, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Thank you for dining with us!', W / 2, y, { align: 'center' });
  y += 4;
  doc.text('Powered by DineFlow Pro', W / 2, y, { align: 'center' });

  const filename = `invoice-${order.orderNumber || order._id}-${Date.now()}.pdf`;
  doc.save(filename);

  return URL.createObjectURL(doc.output('blob'));
};

/**
 * Share invoice via WhatsApp Web
 * @param {Object} order
 * @param {Object} restaurant
 */
export const shareInvoiceWhatsApp = (order, restaurant) => {
  const items = (order.items || [])
    .map((i) => `• ${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toFixed(0)}`)
    .join('\n');

  const message = encodeURIComponent(
    `🧾 *Invoice from ${restaurant?.name}*\n\n` +
    `Order: #${order.orderNumber}\n` +
    `Table: ${order.tableNumber}\n\n` +
    `${items}\n\n` +
    `*Total: ₹${order.totalAmount?.toFixed(0)}*\n` +
    `Status: ${order.paymentStatus?.toUpperCase()}\n\n` +
    `Thank you for dining with us! 🍽️`
  );

  window.open(`https://wa.me/?text=${message}`, '_blank');
};
