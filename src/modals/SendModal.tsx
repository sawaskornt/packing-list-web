import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { InventoryItem, Status } from '../types';
import { useStore } from '../store';
import { useToast } from '../toast';
import { STATUSES } from '../theme';
import { Field, Input, ModalShell, PrimaryButton, Select } from '../components/ui';

interface BatchLine {
  item: InventoryItem;
  quantityToSend: number;
}

export function SendModal({
  visible,
  onClose,
  initialItems,
  onSent,
}: {
  visible: boolean;
  onClose: () => void;
  initialItems: InventoryItem[];
  onSent: () => void;
}) {
  const store = useStore();
  const toast = useToast();
  const [sourceLocation, setSourceLocation] = useState('');
  const [destLocation, setDestLocation] = useState('');
  const [batchItems, setBatchItems] = useState<BatchLine[]>([]);
  const [destSubLocation, setDestSubLocation] = useState('');
  const [destStatus, setDestStatus] = useState<Status>('Ready to pack');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      const seed = initialItems.length > 0 ? initialItems : [];
      const sourceLoc = seed[0]?.location || store.allowedLocations[0]?.name || '';
      setSourceLocation(sourceLoc);
      setBatchItems(
        seed
          .filter((i) => i.location === (seed[0]?.location || ''))
          .map((i) => ({ item: i, quantityToSend: i.quantity }))
      );
      const otherLoc =
        store.locations.find((l) => l.name !== sourceLoc)?.name || store.locations[0]?.name || '';
      setDestLocation(otherLoc);
      setDestSubLocation('');
      setDestStatus('Ready to pack');
      setNotes('');
    }
  }, [visible]);

  const sourceOptions = store.allowedLocations.map((l) => l.name);
  const destOptions = store.locations
    .map((l) => l.name)
    .filter((n) => n.toLowerCase() !== sourceLocation.toLowerCase());

  const addableItems = store.items.filter(
    (i) =>
      (i.location || '').toLowerCase() === sourceLocation.toLowerCase() &&
      !batchItems.some((bi) => bi.item.id === i.id)
  );

  const handleSubmit = async () => {
    if (batchItems.length === 0) {
      toast.error('No items added to send batch');
      return;
    }
    setSending(true);
    const ok = await store.sendBatch({
      source_location: sourceLocation,
      dest_location: destLocation,
      dest_sub_location: destSubLocation,
      dest_status: destStatus,
      notes,
      items: batchItems.map((bi) => ({ barcode_id: bi.item.barcode_id, quantity: bi.quantityToSend })),
    });
    setSending(false);
    if (ok) {
      onSent();
      onClose();
    }
  };

  return (
    <ModalShell visible={visible} title="Send Items in Batch" onClose={onClose}>
      <p className="text-[13px] text-[#6B7280] mb-4.5">
        Compose a batch of items to send collectively to a destination.
      </p>

      <Field label="Source Location">
        <Select
          value={sourceLocation}
          options={sourceOptions}
          onChange={(newLoc) => {
            setSourceLocation(newLoc);
            setBatchItems([]);
            if (destLocation === newLoc) {
              const other =
                store.locations.find((l) => (l.name || '').toLowerCase() !== newLoc.toLowerCase())
                  ?.name || '';
              setDestLocation(other);
            }
          }}
        />
      </Field>

      <Field label="Destination Location">
        <Select value={destLocation} options={destOptions} onChange={setDestLocation} />
      </Field>

      <Field label={`Add Items from ${sourceLocation || '…'}`}>
        <Select
          value=""
          placeholder="-- Add an item to this batch --"
          options={addableItems.map(
            (i) => `${i.name} (Qty: ${i.quantity} | #${(i.barcode_id || '').slice(-4)})`
          )}
          onChange={(label) => {
            const idx = addableItems.findIndex(
              (i) => `${i.name} (Qty: ${i.quantity} | #${(i.barcode_id || '').slice(-4)})` === label
            );
            const matched = addableItems[idx];
            if (matched && !batchItems.some((bi) => bi.item.id === matched.id)) {
              setBatchItems([...batchItems, { item: matched, quantityToSend: matched.quantity }]);
            }
          }}
        />
      </Field>

      <Field label={`Batch Items (${batchItems.length})`}>
        {batchItems.length === 0 ? (
          <div className="border border-dashed border-[#E5E7EB] rounded-2xl p-6 text-center">
            <p className="text-[12px] text-[#9CA3AF]">
              No items added to this transfer batch. Add items from the picker above.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
            {batchItems.map((bi, idx) => (
              <div
                key={bi.item.id}
                className={`flex items-center p-3 gap-2.5 ${idx > 0 ? 'border-t border-[#F3F4F6]' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-[#111827] truncate">
                    {bi.item.name || 'Unnamed Item'}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                    #{bi.item.barcode_id} (Avail: {bi.item.quantity})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={bi.item.quantity || 1}
                    value={String(bi.quantityToSend)}
                    onChangeText={(v) => {
                      const val = Math.min(bi.item.quantity || 1, Math.max(1, parseInt(v) || 1));
                      setBatchItems(
                        batchItems.map((line, idy) =>
                          idy === idx ? { ...line, quantityToSend: val } : line
                        )
                      );
                    }}
                    className="!w-16 text-center !py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setBatchItems(batchItems.filter((_, idy) => idy !== idx))}
                    className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <X size={16} color="#DC2626" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field label="Destination Sub-location (Optional)">
        <Input
          value={destSubLocation}
          onChangeText={setDestSubLocation}
          placeholder="e.g. Rack A, Shelf 3"
        />
      </Field>

      <Field label="Destination Status">
        <Select value={destStatus} options={STATUSES} onChange={(v) => setDestStatus(v as Status)} />
      </Field>

      <Field label="Transaction Notes">
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Details of batch material transfer…"
          multiline
        />
      </Field>

      <PrimaryButton
        title={sending ? 'Sending Materials Batch…' : 'Submit Batch Transfer'}
        onPress={handleSubmit}
        loading={sending}
        disabled={batchItems.length === 0}
      />
    </ModalShell>
  );
}
