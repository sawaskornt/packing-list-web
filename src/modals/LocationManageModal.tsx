import React, { useState } from 'react';
import { useStore } from '../store';
import { ConfirmDialog, Field, Input, ModalShell, PrimaryButton } from '../components/ui';

export function LocationManageModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const store = useStore();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const ok = await store.addLocation(newName.trim());
    setAdding(false);
    if (ok) setNewName('');
  };

  const locToDelete = store.locations.find((l) => l.id === deleteId);

  return (
    <ModalShell visible={visible} title="Manage Locations" onClose={onClose}>
      <Field label="New Location">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChangeText={setNewName}
            placeholder="Location Name"
            className="flex-1"
            onSubmitEditing={handleAdd}
          />
          <PrimaryButton title="Add" onPress={handleAdd} loading={adding} className="!w-auto px-5" />
        </div>
      </Field>

      <div className="text-[12px] font-extrabold text-[#6B7280] uppercase tracking-[0.8px] my-2.5">
        Locations ({store.locations.length})
      </div>

      {store.locations.map((loc) => (
        <div
          key={loc.id}
          className="flex items-center gap-3.5 bg-white rounded-[14px] p-3.5 mb-2 border border-[#E5E7EB]"
        >
          {editingId === loc.id ? (
            <>
              <Input
                value={renameValue}
                onChangeText={setRenameValue}
                className="flex-1 !py-2"
                autoFocus
                onSubmitEditing={async () => {
                  if (renameValue.trim() && (await store.renameLocation(loc.id, renameValue.trim()))) {
                    setEditingId(null);
                  }
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (renameValue.trim() && (await store.renameLocation(loc.id, renameValue.trim()))) {
                    setEditingId(null);
                  }
                }}
                className="text-[#059669] font-extrabold text-sm cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-[#6B7280] font-bold text-sm cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-[15px] font-semibold text-[#111827]">{loc.name}</span>
              <button
                type="button"
                onClick={() => {
                  setEditingId(loc.id);
                  setRenameValue(loc.name);
                }}
                className="text-[#4F46E5] font-bold text-[13px] hover:underline cursor-pointer"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(loc.id)}
                className="text-[#DC2626] font-bold text-[13px] hover:underline cursor-pointer"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete Location"
        message={`Are you sure you want to delete "${locToDelete?.name}"? Items must be moved out first.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) await store.deleteLocation(deleteId);
          setDeleteId(null);
        }}
      />
    </ModalShell>
  );
}
