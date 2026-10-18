import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Edit3, Plus, Search, X } from 'lucide-react';
import { useStore } from '../store';
import { Input } from './ui';

export function SubLocationField({
  value,
  onChange,
  location,
  placeholder = 'Select or type sub-location...',
}: {
  value: string;
  onChange: (v: string) => void;
  location?: string;
  placeholder?: string;
}) {
  const { getSubLocations } = useStore();
  const subLocations = useMemo(() => getSubLocations(location), [getSubLocations, location]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [manualTyping, setManualTyping] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return subLocations;
    const q = search.toLowerCase();
    return subLocations.filter((s) => s.toLowerCase().includes(q));
  }, [subLocations, search]);

  const searchTrimmed = search.trim();
  const isExactMatch = subLocations.some(
    (s) => s.toLowerCase() === searchTrimmed.toLowerCase()
  );
  const canCreateNew = searchTrimmed.length > 0 && !isExactMatch;

  return (
    <div>
      {manualTyping ? (
        <div className="relative">
          <Input
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            className="pr-10"
          />
          {subLocations.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setManualTyping(false);
                setSearch(value);
                setOpen(true);
              }}
              title="Search existing sub-locations"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4F46E5] hover:text-indigo-700 p-1 cursor-pointer"
            >
              <Search size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setOpen(true);
            }}
            className="flex-1 bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-xl px-3.5 py-3 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <span className={`text-[15px] truncate ${value ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF]'}`}>
              {value || placeholder}
            </span>
            <div className="flex items-center gap-1 ml-2 shrink-0 text-[#9CA3AF]">
              <Search size={15} />
              <ChevronDown size={15} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setManualTyping(true)}
            title="Type custom sub-location"
            className="px-3 bg-white border border-[#E5E7EB] hover:border-gray-300 hover:bg-gray-50 rounded-xl flex items-center justify-center text-[#6B7280] transition-colors cursor-pointer shrink-0"
          >
            <Edit3 size={16} />
          </button>
        </div>
      )}

      {manualTyping && subLocations.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setManualTyping(false);
            setSearch(value);
            setOpen(true);
          }}
          className="mt-1.5 ml-0.5 text-[12px] font-bold text-[#4F46E5] hover:underline cursor-pointer"
        >
          Browse/Search {location ? `"${location}"` : ''} sub-locations ({subLocations.length})…
        </button>
      )}

      {/* Searchable Sub-location Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[65] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 max-h-[75vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
              <div>
                <h4 className="text-[15px] font-extrabold text-[#111827]">
                  Sub-locations {location ? `· ${location}` : ''}
                </h4>
                <p className="text-[11px] text-[#9CA3AF] font-medium">
                  {subLocations.length} registered in this location
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center bg-[#F3F4F6] rounded-xl px-3 py-2.5 mb-2.5">
              <Search size={16} color="#9CA3AF" className="mr-2 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${location ? `${location} ` : ''}sub-locations…`}
                className="w-full bg-transparent text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-0.5 hover:opacity-70 cursor-pointer"
                >
                  <X size={14} color="#9CA3AF" />
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 space-y-1">
              {/* Option to clear / None */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[14px] transition-colors cursor-pointer ${
                  !value ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold' : 'text-[#6B7280] hover:bg-gray-50'
                }`}
              >
                <span>(None / Clear)</span>
                {!value && <Check size={16} color="#4F46E5" strokeWidth={2.5} />}
              </button>

              {/* Create new sub-location from search query */}
              {canCreateNew && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchTrimmed);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-3 rounded-xl text-left text-[14px] font-bold bg-[#ECFDF5] text-[#059669] hover:bg-emerald-100 transition-colors cursor-pointer border border-[#A7F3D0]"
                >
                  <Plus size={16} className="shrink-0" />
                  <span className="truncate">Use new sub-location: "{searchTrimmed}"</span>
                </button>
              )}

              {/* Filtered existing sub-locations */}
              {filtered.map((subLoc) => {
                const isSelected = subLoc === value;
                return (
                  <button
                    key={subLoc}
                    type="button"
                    onClick={() => {
                      onChange(subLoc);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[14px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold'
                        : 'text-[#111827] hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-2">{subLoc}</span>
                    {isSelected && <Check size={16} color="#4F46E5" strokeWidth={2.5} className="shrink-0" />}
                  </button>
                );
              })}

              {filtered.length === 0 && !canCreateNew && (
                <div className="py-6 text-center text-sm text-[#9CA3AF]">
                  {subLocations.length === 0
                    ? `No sub-locations registered under ${location || 'this location'} yet.`
                    : `No sub-locations matching "${search}"`}
                </div>
              )}
            </div>

            <div className="pt-2.5 mt-2 border-t border-[#F3F4F6] flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setManualTyping(true);
                }}
                className="text-[12px] font-bold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Type manually instead</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[12px] font-bold text-[#4F46E5] hover:underline cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
