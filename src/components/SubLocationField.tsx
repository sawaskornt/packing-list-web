import React, { useState } from 'react';
import { Input, Select } from './ui';
import { useStore } from '../store';

export function SubLocationField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { existingSubLocations } = useStore();
  const [typing, setTyping] = useState(existingSubLocations.length === 0);

  return (
    <div>
      {typing || existingSubLocations.length === 0 ? (
        <Input value={value} onChangeText={onChange} placeholder="e.g. Kitchen shelf, Box 3" />
      ) : (
        <Select
          value={value}
          options={['(None)', ...existingSubLocations]}
          onChange={(v) => onChange(v === '(None)' ? '' : v)}
          placeholder="Select sub-location"
        />
      )}
      {existingSubLocations.length > 0 && (
        <button
          type="button"
          onClick={() => setTyping(!typing)}
          className="mt-1.5 ml-0.5 text-[12px] font-bold text-[#4F46E5] hover:underline cursor-pointer"
        >
          {typing ? 'Choose from existing…' : 'Type a new sub-location…'}
        </button>
      )}
    </div>
  );
}
