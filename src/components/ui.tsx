import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { resolveImageUrl } from '../api';

// ---------- SafeImage ----------
export function SafeImage({
  uri,
  className = '',
  alt = '',
}: {
  uri?: string | null;
  className?: string;
  alt?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const resolved = resolveImageUrl(uri);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (!resolved || hasError) {
    return (
      <div className={`bg-[#F9FAFB] flex items-center justify-center border border-[#E5E7EB] ${className}`}>
        <ImageIcon size={20} color="#D1D5DB" />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-cover bg-[#F9FAFB] ${className}`}
    />
  );
}

// ---------- ModalShell ----------
export function ModalShell({
  visible,
  title,
  onClose,
  children,
  headerRight,
  maxWidth = 'max-w-lg',
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[#F8F9FA] w-full ${maxWidth} max-h-[92vh] sm:max-h-[86vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E5E7EB] shrink-0">
          <h2 className="text-[17px] font-extrabold text-[#111827] truncate pr-2">{title}</h2>
          <div className="flex items-center gap-3 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} color="#6B7280" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ---------- Labeled field ----------
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-[0.8px] mb-1.5 ml-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input({
  value,
  onChangeText,
  onSubmitEditing,
  className = '',
  multiline,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: string;
  onChangeText: (v: string) => void;
  onSubmitEditing?: () => void;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={rest.placeholder}
        rows={3}
        className={`w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4F46E5] transition-all ${className}`}
      />
    );
  }

  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmitEditing) {
          e.preventDefault();
          onSubmitEditing();
        }
        rest.onKeyDown?.(e);
      }}
      className={`w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4F46E5] transition-all ${className}`}
    />
  );
}

// ---------- Select ----------
export function Select({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-xl px-3.5 py-3 flex items-center justify-between text-left transition-colors cursor-pointer"
      >
        <span className={`text-[15px] truncate ${value ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
          {value || placeholder || 'Select...'}
        </span>
        <ChevronDown size={16} color="#9CA3AF" className="ml-2 shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-3 max-h-[70vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-[#9CA3AF]">No options available</div>
            ) : (
              options.map((opt) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-left text-[15px] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold' : 'text-[#111827] hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    {isSelected && <Check size={18} color="#4F46E5" strokeWidth={2.5} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Buttons ----------
export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  color,
  className = '',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled || loading}
      style={{ backgroundColor: color || '#4F46E5' }}
      className={`w-full rounded-[14px] py-3.5 px-4 flex items-center justify-center text-white font-extrabold text-[14px] transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 ${className}`}
    >
      {loading ? <Loader2 size={18} className="animate-spin text-white" /> : title}
    </button>
  );
}

export function SecondaryButton({
  title,
  onPress,
  className = '',
  textColor,
}: {
  title: string;
  onPress: () => void;
  className?: string;
  textColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={textColor ? { color: textColor } : undefined}
      className={`w-full rounded-[14px] py-3.5 px-4 flex items-center justify-center bg-[#F3F4F6] hover:bg-gray-200 text-[#6B7280] font-bold text-[14px] transition-colors cursor-pointer ${className}`}
    >
      {title}
    </button>
  );
}

// ---------- Confirm dialog ----------
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive,
  onConfirm,
  onCancel,
  children,
  confirmLoading,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
  confirmLoading?: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[20px] p-5.5 w-full max-w-[400px] shadow-2xl border border-[#E5E7EB]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[18px] font-extrabold text-[#111827] mb-1.5">{title}</h3>
        {message && <p className="text-[14px] text-[#6B7280] leading-5 mb-2">{message}</p>}
        {children}
        <div className="flex gap-2.5 mt-4.5">
          <SecondaryButton title="Cancel" onPress={onCancel} className="flex-1" />
          <PrimaryButton
            title={confirmLabel}
            onPress={onConfirm}
            loading={confirmLoading}
            color={destructive ? '#DC2626' : '#4F46E5'}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
