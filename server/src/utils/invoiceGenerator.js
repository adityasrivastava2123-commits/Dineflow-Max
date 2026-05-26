import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_DIR = path.join(__dirname, "../../tmp");

const ensureTmpDir = () => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
};

/**
 * Generate a professional PDF invoice for a DineFlow order.
 * @param {Object} order - Mongoose order document (populated)
 * @param {Object} restaurant - Mongoose restaurant document
 * @returns {Promise<{filepath: string, filename: string}>}
 */
export const generateInvoicePDF = (order, restaurant) => {
  return new Promise((resolve, reject) => {
    try {
      ensureTmpDir();

      const filename = `invoice_${order.orderNumber || order._id}_${Date.now()}.pdf`;
      const filepath = path.join(TMP_DIR, filename);
      const doc = new PDFDocument({ size: "A5", margin: 40, info: {
        Title: `Invoice - ${order.orderNumber}`,
        Author: restaurant?.name || "DineFlow Pro",
        Subject: "Restaurant Invoice",
      }});

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      const W = doc.page.width - 80; // usable width
      const LEFT = 40;
      let y = 40;

      // ── Colors ──────────────────────────────────────────────
      const BRAND = "#f97316";
      const DARK = "#1c1917";
      const MUTED = "#78716c";
      const LIGHT = "#f5f5f4";
      const GREEN = "#10b981";
      const RED = "#ef4444";

      const hr = (color = LIGHT) => {
        doc.moveTo(LEFT, y).lineTo(LEFT + W, y).strokeColor(color).lineWidth(0.5).stroke();
        y += 8;
      };

      // ── Header ───────────────────────────────────────────────
      // Orange accent bar
      doc.rect(0, 0, doc.page.width, 6).fill(BRAND);
      y = 24;

      doc.font("Helvetica-Bold").fontSize(18).fillColor(DARK);
      doc.text(restaurant?.name || "Restaurant", LEFT, y, { align: "center", width: W });
      y += 22;

      if (restaurant?.address) {
        const addr = typeof restaurant.address === "string"
          ? restaurant.address
          : [restaurant.address.street, restaurant.address.city, restaurant.address.state]
              .filter(Boolean).join(", ");
        doc.font("Helvetica").fontSize(9).fillColor(MUTED);
        doc.text(addr, LEFT, y, { align: "center", width: W });
        y += 14;
      }

      if (restaurant?.phone) {
        doc.font("Helvetica").fontSize(9).fillColor(MUTED);
        doc.text(`Phone: ${restaurant.phone}`, LEFT, y, { align: "center", width: W });
        y += 14;
      }

      if (restaurant?.email) {
        doc.font("Helvetica").fontSize(9).fillColor(MUTED);
        doc.text(restaurant.email, LEFT, y, { align: "center", width: W });
        y += 14;
      }

      y += 4;
      hr(BRAND);

      // ── Invoice Details ───────────────────────────────────────
      doc.font("Helvetica-Bold").fontSize(11).fillColor(DARK);
      doc.text("TAX INVOICE", LEFT, y, { align: "center", width: W });
      y += 14;

      const detailsY = y;
      doc.font("Helvetica").fontSize(9).fillColor(MUTED);
      doc.text(`Invoice No: #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`, LEFT, y);
      doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString("en-IN")}`, LEFT + W / 2, y, { align: "right", width: W / 2 });
      y += 12;
      doc.text(`Table No: ${order.tableNumber}`, LEFT, y);

      const payStatusColor = order.paymentStatus === "paid" ? GREEN : RED;
      doc.fillColor(payStatusColor).font("Helvetica-Bold")
        .text(
          order.paymentStatus?.toUpperCase() || "PENDING",
          LEFT + W / 2, y, { align: "right", width: W / 2 }
        );
      y += 12;

      if (order.customer) {
        doc.font("Helvetica").fontSize(9).fillColor(MUTED);
        doc.text(`Customer: ${order.customer.name || "Guest"} · ${order.customer.phone || ""}`, LEFT, y);
        y += 12;
      }

      y += 4;
      hr();

      // ── Items Table ───────────────────────────────────────────
      const COL = { name: LEFT, qty: LEFT + W * 0.55, rate: LEFT + W * 0.72, total: LEFT + W };

      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
      doc.text("Item", COL.name, y);
      doc.text("Qty", COL.qty, y);
      doc.text("Rate", COL.rate, y);
      doc.text("Amount", COL.total, y, { align: "right" });
      y += 5;
      hr(BRAND);

      for (const item of order.items || []) {
        const price = item.portion?.price || item.price || 0;
        const addonsTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
        const lineTotal = (price + addonsTotal) * item.quantity;

        doc.font("Helvetica").fontSize(9).fillColor(DARK);
        const nameLines = doc.heightOfString(item.name.substring(0, 32), { width: W * 0.5 });
        doc.text(item.name.substring(0, 32), COL.name, y, { width: W * 0.5 });
        doc.text(String(item.quantity), COL.qty, y);
        doc.text(`₹${price.toFixed(0)}`, COL.rate, y);
        doc.text(`₹${lineTotal.toFixed(0)}`, COL.total, y, { align: "right" });
        y += Math.max(14, nameLines + 4);

        if (item.addons?.length > 0) {
          doc.font("Helvetica").fontSize(8).fillColor(MUTED);
          doc.text(
            `  + ${item.addons.map((a) => `${a.name} (₹${a.price})`).join(", ")}`,
            COL.name, y, { width: W * 0.7 }
          );
          y += 11;
        }

        if (item.specialInstructions) {
          doc.font("Helvetica-Oblique").fontSize(8).fillColor("#d97706");
          doc.text(`  Note: "${item.specialInstructions}"`, COL.name, y, { width: W * 0.8 });
          y += 11;
        }
      }

      y += 4;
      hr();

      // ── Totals ────────────────────────────────────────────────
      const TOTAL_LEFT = LEFT + W * 0.5;
      const totalWidth = W * 0.5;

      const addTotalRow = (label, value, bold = false, color = DARK) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9);
        doc.fillColor(color).text(label, TOTAL_LEFT, y, { width: totalWidth * 0.6 });
        doc.text(value, TOTAL_LEFT + totalWidth * 0.6, y, { align: "right", width: totalWidth * 0.4 });
        y += bold ? 14 : 11;
      };

      addTotalRow("Subtotal", `₹${(order.subtotal || 0).toFixed(0)}`);

      if (order.discount > 0) {
        addTotalRow("Discount", `-₹${order.discount.toFixed(0)}`, false, GREEN);
      }

      const taxPercent = order.taxRate || (restaurant?.settings?.taxPercent) || 5;
      addTotalRow(`GST (${taxPercent}%)`, `₹${(order.tax || 0).toFixed(0)}`);

      if (order.tip > 0) {
        addTotalRow("Tip", `₹${order.tip.toFixed(0)}`);
      }

      y += 2;
      hr(BRAND);

      addTotalRow("TOTAL", `₹${(order.totalAmount || 0).toFixed(0)}`, true);

      y += 10;

      // ── Payment method ────────────────────────────────────────
      if (order.paymentMethod) {
        doc.font("Helvetica").fontSize(9).fillColor(MUTED);
        doc.text(
          `Payment: ${order.paymentMethod.toUpperCase()}`,
          LEFT, y, { align: "center", width: W }
        );
        y += 12;
      }

      y += 8;

      // ── Footer ────────────────────────────────────────────────
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND);
      doc.text("Thank you for your visit! 🍽️", LEFT, y, { align: "center", width: W });
      y += 14;

      doc.font("Helvetica").fontSize(8).fillColor(MUTED);
      doc.text("This is a computer-generated invoice. No signature required.", LEFT, y, {
        align: "center", width: W
      });
      y += 10;

      doc.font("Helvetica").fontSize(7).fillColor(MUTED);
      doc.text("Powered by DineFlow Pro · dineflow.app", LEFT, y, {
        align: "center", width: W
      });

      // ── Bottom accent ─────────────────────────────────────────
      doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill(BRAND);

      doc.end();

      stream.on("finish", () => resolve({ filepath, filename }));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Clean up old invoice files (run periodically)
 */
export const cleanupOldInvoices = () => {
  try {
    if (!fs.existsSync(TMP_DIR)) return;
    const files = fs.readdirSync(TMP_DIR);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h
    for (const file of files) {
      const fp = path.join(TMP_DIR, file);
      const stat = fs.statSync(fp);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(fp);
      }
    }
  } catch (err) {
    // Non-critical
  }
};
