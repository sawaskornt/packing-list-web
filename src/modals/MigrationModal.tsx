import React, { useState } from 'react';
import { useStore } from '../store';
import { Field, Input, ModalShell, PrimaryButton } from '../components/ui';

export function MigrationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const store = useStore();
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    if (!json.trim()) return;
    setError('');
    setMigrating(true);
    const err = await store.migrate(json);
    setMigrating(false);
    if (err) {
      setError(err);
    } else {
      setJson('');
      onClose();
    }
  };

  return (
    <ModalShell visible={visible} title="Data Migration" onClose={onClose}>
      <p className="text-[13px] text-[#6B7280] mb-4 leading-5">
        Paste exported JSON data below. Arrays are accepted directly; objects are scanned for an items list.
      </p>
      <Field label="JSON Data">
        <Input
          value={json}
          onChangeText={setJson}
          placeholder='[{"name": "Item", "location": "Condo", ...}]'
          multiline
          className="min-h-[220px] font-mono text-[12px]"
        />
      </Field>
      {error && <p className="text-[#DC2626] text-[13px] font-semibold mb-3">{error}</p>}
      <PrimaryButton
        title={migrating ? 'Migrating…' : 'Run Migration'}
        onPress={handleMigrate}
        loading={migrating}
        disabled={!json.trim()}
      />
    </ModalShell>
  );
}
