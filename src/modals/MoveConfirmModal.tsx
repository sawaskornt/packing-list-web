import React, { useEffect, useState } from 'react';
import { Location } from '../types';
import { ConfirmDialog, Field } from '../components/ui';
import { SubLocationField } from '../components/SubLocationField';

export interface PendingMove {
  ids: number[];
  itemName?: string;
  location: Location;
  sub_location?: string;
  type: 'single' | 'bulk' | 'scan';
}

export function MoveConfirmModal({
  pendingMove,
  onCancel,
  onConfirm,
  loading,
}: {
  pendingMove: PendingMove | null;
  onCancel: () => void;
  onConfirm: (subLocation: string) => void;
  loading?: boolean;
}) {
  const [subLoc, setSubLoc] = useState('');

  useEffect(() => {
    setSubLoc(pendingMove?.sub_location || '');
  }, [pendingMove]);

  return (
    <ConfirmDialog
      visible={!!pendingMove}
      title="Confirm Move"
      onCancel={onCancel}
      onConfirm={() => onConfirm(subLoc)}
      confirmLabel="Move"
      confirmLoading={loading}
    >
      {pendingMove && (
        <>
          <p className="text-[#6B7280] text-[14px] leading-5 mb-3.5">
            Move{' '}
            <span className="font-extrabold text-[#111827]">
              {pendingMove.type === 'bulk' ? `${pendingMove.ids.length} items` : pendingMove.itemName}
            </span>{' '}
            to <span className="font-extrabold text-[#4F46E5]">{pendingMove.location}</span>?
          </p>
          <Field label="Sub-location / Storage (Optional)">
            <SubLocationField value={subLoc} onChange={setSubLoc} location={pendingMove.location} />
          </Field>
        </>
      )}
    </ConfirmDialog>
  );
}
