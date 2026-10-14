import React, { useEffect, useState } from 'react';
import { ModalShell, Field, PrimaryButton, SecondaryButton, Select } from '../components/ui';
import { SubLocationField } from '../components/SubLocationField';
import { useStore } from '../store';

const KEEP = 'Keep current';

export function BulkEditModal({
  visible,
  selectedIds,
  onClose,
  onDone,
}: {
  visible: boolean;
  selectedIds: number[];
  onClose: () => void;
  onDone: () => void;
}) {
  const store = useStore();
  const [targetLocation, setTargetLocation] = useState('');
  const [subLocMode, setSubLocMode] = useState<string>(KEEP);
  const [newSubLoc, setNewSubLoc] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTargetLocation('');
      setSubLocMode(KEEP);
      setNewSubLoc('');
      setConfirming(false);
    }
  }, [visible]);

  const subLocationForUpdate = () => {
    if (subLocMode === KEEP) return undefined;
    if (subLocMode === 'Clear') return '';
    return newSubLoc;
  };

  const handleApply = async () => {
    const updates: any = {};
    if (targetLocation) updates.location = targetLocation;
    const sub = subLocationForUpdate();
    if (sub !== undefined) updates.sub_location = sub;
    if (Object.keys(updates).length === 0) return;
    setSaving(true);
    const ok = await store.bulkUpdateItems(selectedIds, updates);
    setSaving(false);
    if (ok) {
      onDone();
      onClose();
    }
  };

  return (
    <ModalShell visible={visible} title={`Update ${selectedIds.length} Items`} onClose={onClose}>
      {!confirming ? (
        <>
          <Field label="New Location">
            <Select
              value={targetLocation || KEEP}
              options={[KEEP, ...store.locations.map((l) => l.name)]}
              onChange={(v) => setTargetLocation(v === KEEP ? '' : v)}
            />
          </Field>
          <Field label="Sub-location">
            <Select value={subLocMode} options={[KEEP, 'Clear', 'Set new']} onChange={setSubLocMode} />
            {subLocMode === 'Set new' && (
              <div className="mt-2.5">
                <SubLocationField value={newSubLoc} onChange={setNewSubLoc} />
              </div>
            )}
          </Field>
          <PrimaryButton
            title="Continue"
            onPress={() => setConfirming(true)}
            disabled={!targetLocation && subLocMode === KEEP}
            className="mt-2"
          />
        </>
      ) : (
        <>
          <h3 className="text-[20px] font-extrabold text-[#111827] mb-3.5">Confirm Bulk Update</h3>
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] mb-4">
            <div className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.8px]">New Location</div>
            <div className="text-[15px] font-bold text-[#111827] mt-0.5 mb-3">
              {targetLocation || 'Keep current'}
            </div>
            <div className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.8px]">Sub-location</div>
            <div className="text-[15px] font-bold text-[#111827] mt-0.5">
              {subLocMode === KEEP ? 'Keep current' : subLocMode === 'Clear' ? '(cleared)' : newSubLoc || '(empty)'}
            </div>
          </div>
          <p className="text-[#6B7280] text-[13px] mb-4">
            This will update {selectedIds.length} items. This action is recorded in history.
          </p>
          <div className="flex gap-2.5">
            <SecondaryButton title="Back" onPress={() => setConfirming(false)} className="flex-1" />
            <PrimaryButton
              title={`Update ${selectedIds.length} Items`}
              onPress={handleApply}
              loading={saving}
              className="flex-1"
            />
          </div>
        </>
      )}
    </ModalShell>
  );
}
