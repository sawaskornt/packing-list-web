import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { ModalShell, Field, Input, PrimaryButton } from '../components/ui';
import { BarcodeScannerModal } from '../components/BarcodeScanner';
import { MoveConfirmModal, PendingMove } from './MoveConfirmModal';
import { useStore } from '../store';

export function ScanModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const store = useStore();
  const [barcode, setBarcode] = useState('');
  const [scanLocation, setScanLocation] = useState(store.activeLocation);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (visible) {
      setBarcode('');
      setScanStatus(null);
      const allowed = store.allowedLocations;
      if (allowed.length > 0 && !allowed.some((l) => l.name === scanLocation)) {
        setScanLocation(allowed[0].name);
      }
    }
  }, [visible]);

  const startScanMove = (code: string) => {
    if (!code.trim()) return;
    const item = store.items.find((i) => i.barcode_id === code);
    setPendingMove({
      ids: item ? [item.id] : [],
      itemName: item?.name || `Barcode #${code}`,
      location: scanLocation,
      sub_location: item?.sub_location || '',
      type: 'scan',
    });
  };

  const confirmMove = async (subLoc: string) => {
    if (!pendingMove) return;
    setMoving(true);
    try {
      const data = await store.clsScan(barcode, pendingMove.location, subLoc);
      setScanStatus({ type: 'success', message: `Successfully updated ${data.name} to ${data.location}` });
      setBarcode('');
    } catch (e: any) {
      setScanStatus({ type: 'error', message: e.message || 'Scan failed' });
    } finally {
      setMoving(false);
      setPendingMove(null);
    }
  };

  return (
    <ModalShell visible={visible} title="CLS Scan" onClose={onClose}>
      <h3 className="text-[22px] font-extrabold text-[#111827] mb-1">Scan Item Barcode</h3>
      <p className="text-[13px] text-[#6B7280] mb-5">
        Scanned items are moved to the location below and marked as seen.
      </p>

      <Field label="Current Location">
        <div className="flex flex-wrap gap-2">
          {store.allowedLocations.map((loc) => {
            const active = scanLocation === loc.name;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setScanLocation(loc.name)}
                className={`px-3.5 py-2 rounded-full text-[13px] font-bold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#4F46E5] border-[#4F46E5] text-white'
                    : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Item Barcode">
        <div className="flex gap-2">
          <Input
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Type or scan barcode"
            className="flex-1"
            onSubmitEditing={() => startScanMove(barcode)}
          />
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="w-12 rounded-xl bg-[#EEF2FF] hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Scan with Camera"
          >
            <Camera size={20} color="#6B7280" />
          </button>
        </div>
      </Field>

      <PrimaryButton title="Move Item" onPress={() => startScanMove(barcode)} disabled={!barcode.trim()} />

      {scanStatus && (
        <div
          className={`mt-4 rounded-[14px] p-3.5 border text-[13px] font-semibold ${
            scanStatus.type === 'success'
              ? 'bg-[#D1FAE5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          {scanStatus.message}
        </div>
      )}

      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={(code) => {
          setBarcode(code);
          startScanMove(code);
        }}
      />

      <MoveConfirmModal
        pendingMove={pendingMove}
        onCancel={() => setPendingMove(null)}
        onConfirm={confirmMove}
        loading={moving}
      />
    </ModalShell>
  );
}
