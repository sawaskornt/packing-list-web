import React, { useMemo } from 'react';
import { ModalShell, Field, Input, PrimaryButton, SecondaryButton, Select } from '../components/ui';
import { useStore } from '../store';
import { STATUSES } from '../theme';

export interface AdvFilters {
  name: string;
  barcode: string;
  location: string;
  category: string;
  sub_location: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_FILTERS: AdvFilters = {
  name: '',
  barcode: '',
  location: 'All',
  category: 'All',
  sub_location: 'All',
  status: 'All',
  dateFrom: '',
  dateTo: '',
};

export function AdvancedSearchModal({
  visible,
  filters,
  setFilters,
  onApply,
  onClear,
  onClose,
}: {
  visible: boolean;
  filters: AdvFilters;
  setFilters: (f: AdvFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const { locations, categories, getSubLocations } = useStore();

  const subLocationOptions = useMemo(() => {
    return ['All', ...getSubLocations(filters.location)];
  }, [getSubLocations, filters.location]);

  return (
    <ModalShell visible={visible} title="Advanced Search" onClose={onClose}>
      <Field label="Item Name">
        <Input value={filters.name} onChangeText={(v) => setFilters({ ...filters, name: v })} placeholder="Contains…" />
      </Field>
      <Field label="Barcode ID">
        <Input value={filters.barcode} onChangeText={(v) => setFilters({ ...filters, barcode: v })} placeholder="Contains…" />
      </Field>
      <Field label="Location">
        <Select
          value={filters.location}
          options={['All', ...locations.map((l) => l.name)]}
          searchable
          title="locations"
          onChange={(newLoc) => {
            const newSubs = getSubLocations(newLoc);
            const stillValid = filters.sub_location === 'All' || newSubs.includes(filters.sub_location);
            setFilters({
              ...filters,
              location: newLoc,
              sub_location: stillValid ? filters.sub_location : 'All',
            });
          }}
        />
      </Field>
      <Field label="Item Type">
        <Select
          value={filters.category}
          options={['All', ...categories.map((c) => c.name)]}
          searchable
          title="categories"
          onChange={(v) => setFilters({ ...filters, category: v })}
        />
      </Field>
      <Field label={`Sub-location ${filters.location && filters.location !== 'All' ? `(${filters.location})` : ''}`}>
        <Select
          value={filters.sub_location}
          options={subLocationOptions}
          searchable
          title="sub-locations"
          onChange={(v) => setFilters({ ...filters, sub_location: v })}
        />
      </Field>
      <Field label="Status">
        <Select
          value={filters.status}
          options={['All', ...STATUSES]}
          onChange={(v) => setFilters({ ...filters, status: v })}
        />
      </Field>
      <Field label="Last Update Range (YYYY-MM-DD)">
        <div className="flex gap-2.5">
          <Input
            type="date"
            value={filters.dateFrom}
            onChangeText={(v) => setFilters({ ...filters, dateFrom: v })}
            placeholder="From: 2026-01-01"
            className="flex-1"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChangeText={(v) => setFilters({ ...filters, dateTo: v })}
            placeholder="To: 2026-12-31"
            className="flex-1"
          />
        </div>
      </Field>

      <div className="flex gap-2.5 mt-2">
        <SecondaryButton title="Clear Filters" onPress={onClear} className="flex-1" />
        <PrimaryButton title="Apply Filters" onPress={onApply} className="flex-1" />
      </div>
    </ModalShell>
  );
}
