const router = require('express').Router();
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { Subscription } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');
const QRCode = require('qrcode');

// GET /api/invoices/order/:orderId - Generate GST invoice PDF
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('restaurantId');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const restaurant = order.restaurantId;
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    doc.pipe(res);

    // Colors
    const primaryColor = restaurant.branding?.primaryColor || '#f97316';
    const darkColor = '#1c1917';

    // Header background
    doc.rect(0, 0, 595, 120).fill(darkColor);

    // Restaurant name
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text(restaurant.name, 40, 30, { width: 350 });

    if (restaurant.GSTIN) {
      doc.fontSize(9).font('Helvetica').fillColor('#d6d3d1')
        .text(`GSTIN: ${restaurant.GSTIN}`, 40, 60);
    }

    doc.fontSize(9).fillColor('#d6d3d1')
      .text(`${restaurant.address?.street || ''}, ${restaurant.address?.city || ''} - ${restaurant.address?.pincode || ''}`, 40, 75)
      .text(`Phone: ${restaurant.phone || ''}`, 40, 90);

    // Invoice label
    doc.fontSize(11).fillColor(primaryColor).font('Helvetica-Bold')
      .text('TAX INVOICE', 430, 40);
    doc.fontSize(9).fillColor('white').font('Helvetica')
      .text(`#${order.orderNumber}`, 430, 58)
      .text(new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 430, 72)
      .text(new Date(order.createdAt).toLocaleTimeString('en-IN'), 430, 86);

    // Customer info box
    doc.rect(40, 135, 250, 65).fillAndStroke('#fafaf9', '#e7e5e4');
    doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, 142);
    doc.font('Helvetica').fontSize(10).text(order.customerName, 50, 155)
      .text(`Phone: ${order.customerPhone}`, 50, 168);
    if (order.tableNumber) doc.text(`Table: ${order.tableNumber}`, 50, 181);

    // Order info box
    doc.rect(310, 135, 245, 65).fillAndStroke('#fafaf9', '#e7e5e4');
    doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('ORDER DETAILS', 320, 142);
    doc.font('Helvetica').fontSize(9)
      .text(`Payment: ${order.paymentMethod.toUpperCase()}`, 320, 155)
      .text(`Status: ${order.paymentStatus.toUpperCase()}`, 320, 168);
    if (order.tableNumber) doc.text(`Table No: ${order.tableNumber}`, 320, 181);

    // Items table header
    const tableTop = 220;
    doc.rect(40, tableTop, 515, 22).fill(darkColor);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text('ITEM', 50, tableTop + 7)
      .text('QTY', 300, tableTop + 7)
      .text('RATE', 360, tableTop + 7)
      .text('AMOUNT', 460, tableTop + 7);

    // Items rows
    let y = tableTop + 30;
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      if (i % 2 === 0) doc.rect(40, y - 5, 515, 20).fill('#fafaf9');
      
      const itemPrice = item.portion?.price || item.price;
      const addonsTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
      const lineTotal = (itemPrice + addonsTotal) * item.quantity;

      doc.fillColor(darkColor).fontSize(9).font('Helvetica')
        .text(item.name + (item.portion?.size ? ` (${item.portion.size})` : ''), 50, y)
        .text(String(item.quantity), 300, y)
        .text(`₹${(itemPrice + addonsTotal).toFixed(2)}`, 360, y)
        .text(`₹${lineTotal.toFixed(2)}`, 460, y);

      if (item.addons?.length) {
        y += 14;
        doc.fillColor('#78716c').fontSize(8).text(`  + ${item.addons.map(a => a.name).join(', ')}`, 55, y);
      }
      y += 20;
    }

    // Totals section
    y += 10;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#e7e5e4').lineWidth(1).stroke();
    y += 15;

    const addRow = (label, value, bold = false, color = darkColor) => {
      doc.fillColor(color).fontSize(9)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(label, 380, y)
        .text(value, 460, y);
      y += 18;
    };

    addRow('Subtotal', `₹${order.subtotal.toFixed(2)}`);
    if (order.discountAmount > 0) addRow('Discount', `-₹${order.discountAmount.toFixed(2)}`, false, '#16a34a');
    
    const cgst = order.taxAmount / 2;
    const sgst = order.taxAmount / 2;
    addRow(`CGST (${restaurant.taxRate / 2}%)`, `₹${cgst.toFixed(2)}`);
    addRow(`SGST (${restaurant.taxRate / 2}%)`, `₹${sgst.toFixed(2)}`);
    if (order.tipAmount > 0) addRow('Tip', `₹${order.tipAmount.toFixed(2)}`);

    doc.moveTo(380, y).lineTo(555, y).strokeColor('#e7e5e4').stroke();
    y += 8;
    doc.rect(380, y - 3, 175, 24).fill(darkColor);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text('TOTAL', 385, y + 3)
      .text(`₹${order.totalAmount.toFixed(2)}`, 460, y + 3);

    // QR Code for verification
    y += 50;
    try {
      const qrData = await QRCode.toDataURL(`${process.env.CLIENT_URL}/order/${order._id}`);
      doc.image(qrData, 40, y, { width: 70 });
      doc.fillColor('#78716c').fontSize(8).font('Helvetica')
        .text('Scan to track order', 40, y + 74, { width: 70, align: 'center' });
    } catch (e) {}

    // Footer
    doc.rect(0, 760, 595, 82).fill('#fafaf9');
    doc.fillColor('#78716c').fontSize(8).font('Helvetica')
      .text('Thank you for dining with us! We hope to see you again.', 40, 772, { align: 'center', width: 515 })
      .text('This is a computer-generated invoice and does not require a signature.', 40, 786, { align: 'center', width: 515 });
    doc.fillColor('#d6d3d1').fontSize(7)
      .text('Powered by DineFlow • dineflow.app', 40, 802, { align: 'center', width: 515 });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/invoices/subscription/:subscriptionId - Subscription invoice
router.get('/subscription/:subscriptionId', auth, async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.subscriptionId).populate('restaurantId');
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=dineflow-invoice-${sub._id}.pdf`);
    doc.pipe(res);

    // DineFlow header
    doc.rect(0, 0, 595, 100).fill('#1c1917');
    doc.fillColor('#f97316').fontSize(26).font('Helvetica-Bold').text('DineFlow', 40, 30);
    doc.fillColor('#d6d3d1').fontSize(9).font('Helvetica')
      .text('Restaurant Management Platform', 40, 58)
      .text('support@dineflow.app • dineflow.app', 40, 72);

    doc.fillColor('white').fontSize(11).font('Helvetica-Bold').text('SUBSCRIPTION INVOICE', 390, 42);
    doc.fillColor('#d6d3d1').fontSize(9).font('Helvetica')
      .text(`#INV-${sub._id.toString().slice(-8).toUpperCase()}`, 390, 60)
      .text(new Date(sub.createdAt).toLocaleDateString('en-IN'), 390, 74);

    // Restaurant box
    doc.rect(40, 120, 515, 70).fillAndStroke('#fafaf9', '#e7e5e4');
    doc.fillColor('#1c1917').fontSize(9).font('Helvetica-Bold').text('BILLED TO', 55, 130);
    doc.font('Helvetica').fontSize(11).text(sub.restaurantId?.name || 'Restaurant', 55, 145);
    doc.fontSize(9).fillColor('#78716c')
      .text(sub.restaurantId?.email || '', 55, 162)
      .text(sub.restaurantId?.GSTIN ? `GSTIN: ${sub.restaurantId.GSTIN}` : '', 55, 176);

    // Plan details
    const planColors = { trial: '#6b7280', basic: '#3b82f6', standard: '#8b5cf6', premium: '#f59e0b' };
    const planColor = planColors[sub.plan] || '#f97316';

    doc.rect(40, 210, 515, 100).fillAndStroke('#fafaf9', '#e7e5e4');
    doc.rect(40, 210, 8, 100).fill(planColor);
    doc.fillColor('#1c1917').fontSize(9).font('Helvetica-Bold').text('PLAN DETAILS', 60, 220);
    doc.fontSize(18).text(`${sub.plan.toUpperCase()} PLAN`, 60, 235);
    doc.fontSize(9).font('Helvetica').fillColor('#78716c')
      .text(`Start Date: ${new Date(sub.startDate).toLocaleDateString('en-IN')}`, 60, 268)
      .text(`End Date: ${new Date(sub.endDate).toLocaleDateString('en-IN')}`, 60, 282)
      .text(`Payment ID: ${sub.paymentId || 'N/A'}`, 60, 296);

    // Amount
    doc.rect(350, 235, 190, 60).fill(planColor);
    doc.fillColor('white').fontSize(10).font('Helvetica').text('AMOUNT PAID', 360, 248);
    doc.fontSize(24).font('Helvetica-Bold').text(`₹${sub.price?.toLocaleString('en-IN') || '0'}`, 360, 265);

    // Footer
    doc.rect(0, 720, 595, 122).fill('#fafaf9');
    doc.fillColor('#1c1917').fontSize(10).font('Helvetica-Bold').text('Thank you for choosing DineFlow!', 40, 735, { align: 'center', width: 515 });
    doc.fillColor('#78716c').fontSize(9).font('Helvetica')
      .text('For support: support@dineflow.app', 40, 755, { align: 'center', width: 515 })
      .text('This is a computer-generated invoice.', 40, 772, { align: 'center', width: 515 });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
