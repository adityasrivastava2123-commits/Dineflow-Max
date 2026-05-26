import QRCode from "qrcode";

export const generateQRCode = async (restaurantSlug, tableNumber) => {
  try {
    const qrData = `${process.env.FRONTEND_URL}/restaurant/${restaurantSlug}?table=${tableNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);
    return qrCode;
  } catch (error) {
    throw new Error(`QR Code generation failed: ${error.message}`);
  }
};

export const generateQRCodeSVG = async (restaurantSlug, tableNumber) => {
  try {
    const qrData = `${process.env.FRONTEND_URL}/restaurant/${restaurantSlug}?table=${tableNumber}`;
    const svg = await QRCode.toString(qrData, {
      type: "image/svg+xml",
      width: 300,
    });
    return svg;
  } catch (error) {
    throw new Error(`QR Code SVG generation failed: ${error.message}`);
  }
};
