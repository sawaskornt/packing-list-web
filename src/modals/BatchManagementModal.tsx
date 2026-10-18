import React, { useEffect, useState } from 'react';
import { Batch, useStore } from '../store';
import { STATUSES } from '../theme';
import { ConfirmDialog, Field, Input, ModalShell, PrimaryButton, SecondaryButton, Select } from '../components/ui';
import { SubLocationField } from '../components/SubLocationField';
import { formatDate } from '../format';

export function BatchManagementModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const store = useStore();
  const [editing, setEditing] = useState<Batch | null>(null);
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (visible) {
      store.fetchBatches();
      setEditing(null);
    }
  }, [visible]);

  const openEditor = (b: Batch) => {
    setEditing(b);
    setSource(b.source_location);
    setDest(b.dest_location);
    setStatus(b.status);
    setNotes(b.notes || '');
    setItems((b.items || []).map((i: any) => ({ ...i })));
  };

  const updateItemField = (idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const ok = await store.updateBatch(editing.id, {
      source_location: source,
      dest_location: dest,
      status,
      notes,
      items,
    });
    setSaving(false);
    if (ok) setEditing(null);
  };

  const locationNames = store.locations.map((l) => l.name);

  return (
    <ModalShell
      visible={visible}
      title={editing ? `Edit Batch #${editing.id}` : 'Batch Management'}
      onClose={editing ? () => setEditing(null) : onClose}
    >
      {!editing ? (
        <>
          <div className="text-[12px] font-extrabold text-[#6B7280] uppercase tracking-[0.8px] mb-2.5 mt-1">
            All Batches ({store.batches.length})
          </div>
          {store.batches.length === 0 && (
            <div className="text-center text-[#9CA3AF] mt-8 text-sm">No batches found.</div>
          )}
          {store.batches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => openEditor(b)}
              className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 mb-2 border border-[#E5E7EB] hover:border-gray-300 text-left transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-extrabold text-[#111827]">Batch #{b.id}</div>
                <div className="text-[12px] text-[#6B7280] mt-0.5">
                  {b.source_location} → {b.dest_location} · {b.items?.length || 0} items
                </div>
                {b.created_at && (
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5">{formatDate(b.created_at)}</div>
                )}
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0"
                style={{
                  backgroundColor:
                    b.status === 'Completed' ? '#D1FAE5' : b.status === 'In Transit' ? '#E0E7FF' : '#F3F4F6',
                  color:
                    b.status === 'Completed' ? '#059669' : b.status === 'In Transit' ? '#4F46E5' : '#6B7280',
                }}
              >
                {b.status}
              </span>
            </button>
          ))}
        </>
      ) : (
        <>
          <div className="text-[12px] font-extrabold text-[#6B7280] uppercase tracking-[0.8px] mb-2.5 mt-1">
            Batch Details
          </div>
          <Field label="Source Location">
            <Select value={source} options={locationNames} onChange={setSource} />
          </Field>
          <Field label="Destination Location">
            <Select value={dest} options={locationNames} onChange={setDest} />
          </Field>
          <Field label="Batch Status">
            <Select value={status} options={['In Transit', 'Completed', 'Cancelled']} onChange={setStatus} />
          </Field>
          <Field label="Notes">
            <Input value={notes} onChangeText={setNotes} multiline />
          </Field>

          <div className="text-[12px] font-extrabold text-[#6B7280] uppercase tracking-[0.8px] mb-2.5 mt-3">
            Batch Items ({items.length})
          </div>
          {items.map((it, idx) => (
            <div
              key={it.id ?? idx}
              className="bg-white rounded-2xl p-3.5 mb-2.5 border border-[#E5E7EB]"
            >
              <div className="text-[14px] font-bold text-[#111827]">
                {it.item_name || it.name || 'Unknown Item'}
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">#{it.barcode_id}</div>

              <div className="flex gap-2 mt-2.5">
                <div className="flex-1">
                  <div className="text-[9px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.6px] mb-1">
                    Qty
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={String(it.quantity ?? 1)}
                    onChangeText={(v) => updateItemField(idx, 'quantity', Math.max(1, parseInt(v) || 1))}
                    className="!py-2"
                  />
                </div>
                <div className="flex-[2]">
                  <div className="text-[9px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.6px] mb-1">
                    Sub-Loc
                  </div>
                  <SubLocationField
                    value={it.dest_sub_location || ''}
                    onChange={(v) => updateItemField(idx, 'dest_sub_location', v)}
                    location={dest}
                    placeholder="Sub-loc..."
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2.5">
                <div className="flex-1">
                  <div className="text-[9px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.6px] mb-1">
                    Dest Status
                  </div>
                  <Select
                    value={it.dest_status || 'Ready to pack'}
                    options={STATUSES}
                    onChange={(v) => updateItemField(idx, 'dest_status', v)}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.6px] mb-1">
                    Item Status
                  </div>
                  <Select
                    value={it.status || 'In Transit'}
                    options={['In Transit', 'Received']}
                    onChange={(v) => updateItemField(idx, 'status', v)}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2.5 mt-3">
            <SecondaryButton
              title="Delete Batch"
              onPress={() => setConfirmDelete(true)}
              textColor="#DC2626"
              className="flex-1"
            />
            <PrimaryButton
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
              className="flex-1"
            />
          </div>

          <ConfirmDialog
            visible={confirmDelete}
            title="Delete Batch"
            message="Are you sure you want to completely delete this batch? This is irreversible."
            confirmLabel="Delete"
            destructive
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              setConfirmDelete(false);
              if (editing) {
                const ok = await store.deleteBatch(editing.id);
                if (ok) setEditing(null);
              }
            }}
          />
        </>
      )}
    </ModalShell>
  );
}
