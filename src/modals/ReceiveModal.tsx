import React, { useEffect, useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { Status } from '../types';
import { Batch, useStore } from '../store';
import { useToast } from '../toast';
import { STATUSES } from '../theme';
import { Field, Input, ModalShell, PrimaryButton, SafeImage, Select } from '../components/ui';
import { BarcodeScannerModal } from '../components/BarcodeScanner';
import { formatDate } from '../format';

export function ReceiveModal({
  visible,
  onClose,
  onPressImage,
}: {
  visible: boolean;
  onClose: () => void;
  onPressImage: (url: string) => void;
}) {
  const store = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<'batch' | 'barcode'>('batch');

  // Batch tab state
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [receiving, setReceiving] = useState(false);

  // Barcode tab state
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [status, setStatus] = useState<Status>('Ready to pack');
  const [notes, setNotes] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (visible) {
      store.fetchBatches();
      setTab('batch');
      setSelectedBatchId(null);
      setSelectedItemIds([]);
      setBarcode('');
      setName('');
      setCategory(store.categories[0]?.name || '');
      setQuantity('1');
      setLocation(store.allowedLocations[0]?.name || '');
      setSubLocation('');
      setStatus('Ready to pack');
      setNotes('');
    }
  }, [visible]);

  // Autofill from existing item or in-transit batch item when barcode matches
  useEffect(() => {
    if (!barcode) return;
    const matched = store.items.find((i) => i.barcode_id === barcode);
    if (matched) {
      setName(matched.name);
      setCategory(matched.category || '');
      setLocation(matched.location);
      setSubLocation(matched.sub_location || '');
      setStatus(matched.status);
      return;
    }
    for (const batch of store.batches) {
      if (batch.status === 'In Transit') {
        const bItem = batch.items?.find((bi: any) => bi.barcode_id === barcode && bi.status === 'In Transit');
        if (bItem) {
          setName(bItem.name || bItem.item_name || '');
          setCategory(bItem.category || '');
          setLocation(batch.dest_location);
          setSubLocation(bItem.dest_sub_location || '');
          setStatus(bItem.dest_status || 'Ready to pack');
          setQuantity(String(bItem.quantity || 1));
          break;
        }
      }
    }
  }, [barcode]);

  const inTransitBatches = store.batches.filter((b) => b.status === 'In Transit');
  const activeBatch: Batch | undefined = store.batches.find((b) => b.id === selectedBatchId);

  const barcodeMatched =
    !!barcode &&
    (store.items.some((i) => i.barcode_id === barcode) ||
      store.batches.some(
        (b) => b.status === 'In Transit' && b.items?.some((bi: any) => bi.barcode_id === barcode && bi.status === 'In Transit')
      ));

  const selectBatch = (id: number | null) => {
    setSelectedBatchId(id);
    if (id) {
      const batch = store.batches.find((b) => b.id === id);
      if (batch?.items) {
        setSelectedItemIds(batch.items.filter((i: any) => i.status === 'In Transit').map((i: any) => i.id));
      }
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleReceiveBatch = async (receiveAll: boolean) => {
    if (!selectedBatchId) {
      toast.error('No batch selected');
      return;
    }
    if (!receiveAll && selectedItemIds.length === 0) {
      toast.error('No items selected to receive');
      return;
    }
    setReceiving(true);
    const ok = await store.receiveBatchItems(selectedBatchId, receiveAll, selectedItemIds, notes);
    setReceiving(false);
    if (ok) onClose();
  };

  const handleReceiveBarcode = async () => {
    if (!barcode) {
      toast.error('Barcode ID is required');
      return;
    }
    setReceiving(true);
    const ok = await store.receiveItem({
      barcode_id: barcode,
      name,
      category,
      quantity: Math.max(1, parseInt(quantity) || 1),
      location,
      sub_location: subLocation,
      status,
      notes,
    });
    setReceiving(false);
    if (ok) onClose();
  };

  const batchLabel = (b: Batch) =>
    `Batch #${b.id} | ${b.source_location} → ${b.dest_location}${(b as any).sender_username ? ` (${(b as any).sender_username})` : ''}`;

  return (
    <ModalShell visible={visible} title="Receive Items" onClose={onClose}>
      <div className="flex bg-[#E5E7EB] rounded-xl p-1 mb-4.5">
        <button
          type="button"
          onClick={() => setTab('batch')}
          className={`flex-1 py-2 text-center text-[13px] font-bold rounded-lg transition-colors cursor-pointer ${
            tab === 'batch' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
          }`}
        >
          Receive Batch
        </button>
        <button
          type="button"
          onClick={() => setTab('barcode')}
          className={`flex-1 py-2 text-center text-[13px] font-bold rounded-lg transition-colors cursor-pointer ${
            tab === 'barcode' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
          }`}
        >
          By Barcode
        </button>
      </div>

      {tab === 'batch' ? (
        <>
          <Field label="Select Available Batch">
            <Select
              value={activeBatch ? batchLabel(activeBatch) : ''}
              placeholder="-- Select In-Transit Batch to Process --"
              options={inTransitBatches.map(batchLabel)}
              onChange={(label) => {
                const batch = inTransitBatches.find((b) => batchLabel(b) === label);
                selectBatch(batch?.id ?? null);
              }}
            />
          </Field>

          {activeBatch && (
            <>
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3.5 mb-3.5">
                <div className="text-[11px] font-extrabold text-[#065F46] uppercase tracking-[0.6px] mb-1">
                  Batch Info
                </div>
                <div className="text-[13px] text-[#047857] font-semibold">
                  {activeBatch.source_location} → {activeBatch.dest_location}
                </div>
                {activeBatch.created_at && (
                  <div className="text-[13px] text-[#047857] font-semibold mt-0.5">
                    Date: {formatDate(activeBatch.created_at)}
                  </div>
                )}
                {activeBatch.notes && (
                  <div className="text-[13px] text-[#047857] italic mt-0.5">
                    "{activeBatch.notes}"
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.8px]">
                  Items in Batch
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allIds = (activeBatch.items || []).map((i: any) => i.id);
                    setSelectedItemIds(selectedItemIds.length === allIds.length ? [] : allIds);
                  }}
                  className="text-[#059669] text-[11px] font-extrabold hover:underline cursor-pointer"
                >
                  {selectedItemIds.length === (activeBatch.items || []).length
                    ? 'Unselect All'
                    : 'Select All'}
                </button>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden mb-3.5">
                {(activeBatch.items || []).map((bItem: any, idx: number) => {
                  const isChecked = selectedItemIds.includes(bItem.id);
                  const isReceived = bItem.status === 'Received';
                  return (
                    <div
                      key={bItem.id}
                      onClick={() => {
                        if (isReceived) return;
                        setSelectedItemIds(
                          isChecked
                            ? selectedItemIds.filter((id) => id !== bItem.id)
                            : [...selectedItemIds, bItem.id]
                        );
                      }}
                      className={`flex items-center p-3 gap-2.5 transition-colors ${
                        idx > 0 ? 'border-t border-[#F3F4F6]' : ''
                      } ${isReceived ? 'opacity-50' : 'cursor-pointer'} ${
                        isChecked && !isReceived ? 'bg-[#ECFDF5]' : ''
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          isChecked || isReceived
                            ? 'bg-[#059669] border-[#059669]'
                            : 'border-[#D1D5DB]'
                        }`}
                      >
                        {(isChecked || isReceived) && <Check size={12} color="white" strokeWidth={3} />}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (bItem.image_url) onPressImage(bItem.image_url);
                        }}
                        disabled={!bItem.image_url}
                        className={`shrink-0 rounded-lg overflow-hidden ${
                          bItem.image_url ? 'cursor-zoom-in' : 'cursor-default'
                        }`}
                      >
                        <SafeImage uri={bItem.image_url} className="w-10 h-10 rounded-lg" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#111827] truncate">
                          {bItem.item_name || bItem.name || 'Unknown Item'}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF]">#{bItem.barcode_id}</div>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-md">
                        Qty: {bItem.quantity}
                      </span>
                      {isReceived && (
                        <span className="text-[8px] font-extrabold text-[#9CA3AF] tracking-wider">
                          RECEIVED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <Field label="Receive Notes (Optional)">
                <Input
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add detail regarding this batch…"
                  multiline
                />
              </Field>
            </>
          )}

          <div className="flex gap-2.5 mt-2">
            <PrimaryButton
              title="Receive Full Batch"
              onPress={() => handleReceiveBatch(true)}
              loading={receiving}
              disabled={!selectedBatchId}
              color="#047857"
              className="flex-1"
            />
            <PrimaryButton
              title={`Receive Selected (${selectedItemIds.length})`}
              onPress={() => handleReceiveBatch(false)}
              loading={receiving}
              disabled={!selectedBatchId || selectedItemIds.length === 0}
              color="#059669"
              className="flex-1"
            />
          </div>
        </>
      ) : (
        <>
          <Field label="Scan or Type Barcode ID">
            <div className="flex gap-2">
              <Input
                value={barcode}
                onChangeText={setBarcode}
                placeholder="e.g. 10034871…"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-12 rounded-xl bg-[#ECFDF5] hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Scan Barcode"
              >
                <Camera size={20} color="#059669" />
              </button>
            </div>
          </Field>

          {barcode && (
            <div
              className={`rounded-2xl p-3.5 border mb-3.5 ${
                barcodeMatched
                  ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                  : 'bg-[#FFFBEB] border-[#FDE68A]'
              }`}
            >
              <div
                className={`text-[12px] font-extrabold ${
                  barcodeMatched ? 'text-[#065F46]' : 'text-[#92400E]'
                }`}
              >
                {barcodeMatched ? 'Registered barcode matched' : 'New registration detected'}
              </div>
              <div
                className={`text-[11px] mt-1 leading-relaxed ${
                  barcodeMatched ? 'text-[#047857]' : 'text-[#B45309]'
                }`}
              >
                {barcodeMatched
                  ? 'This item already exists! Storing more quantity will add onto the existing stock.'
                  : 'This barcode is unregistered. Provide a name to create a new record.'}
              </div>
            </div>
          )}

          <Field label="Item Name">
            <Input value={name} onChangeText={setName} placeholder="Provide name of material…" />
          </Field>
          <Field label="Quantity to Add">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChangeText={setQuantity}
            />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              options={store.categories.map((c) => c.name)}
              onChange={setCategory}
              placeholder="-- Select a category --"
            />
          </Field>
          <Field label="Location">
            <Select
              value={location}
              options={store.allowedLocations.map((l) => l.name)}
              onChange={setLocation}
            />
          </Field>
          <Field label="Sub-location">
            <Input
              value={subLocation}
              onChangeText={setSubLocation}
              placeholder="e.g. Closet 2"
            />
          </Field>
          <Field label="Status">
            <Select value={status} options={STATUSES} onChange={(v) => setStatus(v as Status)} />
          </Field>
          <Field label="Receive Notes (Optional)">
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Record description of incoming items…"
              multiline
            />
          </Field>

          <PrimaryButton
            title={receiving ? 'Receiving Materials…' : 'Save Item Receive'}
            onPress={handleReceiveBarcode}
            loading={receiving}
            color="#059669"
            className="mt-2"
          />

          <BarcodeScannerModal
            visible={showScanner}
            onClose={() => setShowScanner(false)}
            onScanned={setBarcode}
          />
        </>
      )}
    </ModalShell>
  );
}
