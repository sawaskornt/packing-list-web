import React from 'react';
import { Building2, Check, ChevronDown, Home, MapPin, School } from 'lucide-react';
import { InventoryItem } from '../types';
import { statusColor } from '../theme';
import { formatDate } from '../format';
import { SafeImage } from './ui';

export function ItemCard({
  item,
  activeLocation,
  selected,
  selectionMode,
  onToggleSelect,
  onPressImage,
  onPressStatus,
  onPressMove,
  onPressSend,
  onPressHistory,
  onPressEdit,
  onPressDelete,
  onChangeQuantity,
  onMarkSeen,
}: {
  item: InventoryItem;
  activeLocation?: string;
  selected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
  onPressImage: () => void;
  onPressStatus: () => void;
  onPressMove: () => void;
  onPressSend: () => void;
  onPressHistory: () => void;
  onPressEdit: () => void;
  onPressDelete: () => void;
  onChangeQuantity: (delta: number) => void;
  onMarkSeen: () => void;
}) {
  const sc = statusColor(item.status);
  const showLocation = !!activeLocation && item.location !== activeLocation;

  return (
    <div
      onClick={selectionMode ? onToggleSelect : undefined}
      className={`rounded-[18px] p-3.5 border transition-all ${
        selected
          ? 'bg-[#EEF2FF] border-[#4F46E5] shadow-sm'
          : 'bg-white border-[#E5E7EB] hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
      } ${selectionMode ? 'cursor-pointer' : ''}`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (item.image_url) onPressImage();
          }}
          className={`shrink-0 rounded-[14px] overflow-hidden ${item.image_url ? 'cursor-zoom-in' : 'cursor-default'}`}
        >
          <SafeImage uri={item.image_url} className="w-[72px] h-[72px] rounded-[14px]" alt={item.name} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-[15px] font-bold leading-snug line-clamp-2 ${
                item.status === 'Cleaned' ? 'text-[#9CA3AF] line-through' : 'text-[#111827]'
              }`}
            >
              {item.name}
            </h3>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              title={selected ? 'Deselect item' : 'Select item'}
              className={`w-[22px] h-[22px] rounded-[7px] border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                selected ? 'bg-[#4F46E5] border-[#4F46E5]' : 'border-[#D1D5DB] hover:border-[#4F46E5]'
              }`}
            >
              {selected && <Check size={13} color="white" strokeWidth={3} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {item.category && (
              <span className="bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 rounded-full text-[11px] font-bold">
                {item.category}
              </span>
            )}
            {showLocation ? (
              <span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                <LocationIcon location={item.location} size={12} color="#92400E" />
                <span>
                  {item.location}
                  {item.sub_location ? ` › ${item.sub_location}` : ''}
                </span>
              </span>
            ) : item.sub_location ? (
              <span className="bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                <MapPin size={11} color="#6B7280" />
                <span>{item.sub_location}</span>
              </span>
            ) : null}
          </div>

          <p className="text-[11px] text-[#9CA3AF] font-medium mt-1.5 truncate">
            #{item.barcode_id} · seen {formatDate(item.last_seen_at)}
          </p>

          <div
            className="flex items-center justify-between mt-2 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onPressStatus}
              style={{ backgroundColor: sc.bg, color: sc.fg }}
              className="px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 text-[12px] font-extrabold cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span>{item.status}</span>
              <ChevronDown size={12} color={sc.fg} strokeWidth={2.5} />
            </button>

            <div className="flex items-center bg-[#F3F4F6] rounded-full">
              <button
                type="button"
                onClick={() => onChangeQuantity(-1)}
                className="px-3 py-1 text-[16px] font-extrabold text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                −
              </button>
              <span className="text-[14px] font-extrabold text-[#111827] min-w-[24px] text-center">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onChangeQuantity(1)}
                className="px-3 py-1 text-[16px] font-extrabold text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F3F4F6]"
        onClick={(e) => e.stopPropagation()}
      >
        <ActionButton label="Move" onPress={onPressMove} />
        <ActionButton label="Send" onPress={onPressSend} />
        <ActionButton label="Seen" onPress={onMarkSeen} />
        <ActionButton label="History" onPress={onPressHistory} />
        <ActionButton label="Edit" onPress={onPressEdit} />
        <ActionButton label="Delete" onPress={onPressDelete} destructive />
      </div>
    </div>
  );
}

export function LocationIcon({ location, size, color }: { location: string; size: number; color: string }) {
  switch (location) {
    case 'Home':
      return <Home size={size} color={color} />;
    case 'TU':
      return <School size={size} color={color} />;
    default:
      return <Building2 size={size} color={color} />;
  }
}

function ActionButton({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`py-1 px-1.5 text-[12px] font-bold rounded-lg transition-colors cursor-pointer ${
        destructive ? 'text-[#DC2626] hover:bg-red-50' : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}
