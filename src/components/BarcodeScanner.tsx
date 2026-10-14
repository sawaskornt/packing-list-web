import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

export function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (value: string) => void;
}) {
  const rawId = useId().replace(/:/g, '');
  const readerId = `barcode-reader-${rawId}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    scannedRef.current = false;
    setError('');

    let mounted = true;
    const html5QrCode = new Html5Qrcode(readerId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 170 },
        },
        (decodedText) => {
          if (!mounted || scannedRef.current || !decodedText) return;
          scannedRef.current = true;
          html5QrCode
            .stop()
            .catch(() => {})
            .finally(() => {
              onScanned(decodedText);
              onClose();
            });
        },
        () => {}
      )
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Camera access is needed to scan barcodes.');
      });

    return () => {
      mounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [visible, readerId, onScanned, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md relative rounded-3xl overflow-hidden bg-zinc-900 border border-white/15 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 text-white">
          <div className="flex items-center gap-2">
            <Camera size={18} />
            <span className="text-sm font-bold">Scan Barcode / QR Code</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div id={readerId} className="w-full min-h-[280px] bg-black" />

        <div className="p-4 text-center">
          <p className="text-white/90 text-sm font-semibold">Point the camera at a barcode</p>
          {error && <p className="text-[#FCA5A5] text-xs font-semibold mt-2">{error}</p>}
          <button
            type="button"
            onClick={onClose}
            className="mt-4 bg-white/15 hover:bg-white/25 text-white font-extrabold text-sm px-7 py-2.5 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
