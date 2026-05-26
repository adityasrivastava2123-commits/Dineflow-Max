import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, Link2, Check } from 'lucide-react';

export default function QRDisplay({ restaurant, tableNumber, size = 160 }) {
  const [copied, setCopied] = useState(false);

  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const qrUrl = `${baseUrl}/restaurant/${restaurant?.slug}?table=${tableNumber}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Get the SVG element
    const svg = document.getElementById(`qr-${tableNumber}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 80;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR
      ctx.drawImage(img, 20, 20, size, size);

      // Add label
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${restaurant?.name || 'Restaurant'}`, canvas.width / 2, size + 48);
      ctx.fillStyle = '#78716c';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Table ${tableNumber}`, canvas.width / 2, size + 66);

      const link = document.createElement('a');
      link.download = `table-${tableNumber}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl border-2 border-stone-100 shadow-card">
        <QRCode
          id={`qr-${tableNumber}`}
          value={qrUrl}
          size={size}
          level="M"
          fgColor="#1c1917"
          bgColor="#ffffff"
        />
      </div>

      {/* Table label */}
      <div className="text-center">
        <p className="font-display font-bold text-stone-900 text-sm">Table {tableNumber}</p>
        <p className="text-xs text-stone-400 mt-0.5 max-w-[180px] truncate">{qrUrl}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {copied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
        <button
          onClick={handleDownload}
          className="btn-primary text-xs py-1.5 px-3"
        >
          <Download className="w-3 h-3" />
          Download
        </button>
      </div>
    </div>
  );
}
