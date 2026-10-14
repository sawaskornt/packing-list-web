import React from 'react';
import { resolveImageUrl } from '../api';

export function FullScreenImageModal({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  if (!uri) return null;
  const resolved = resolveImageUrl(uri);

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/92 flex flex-col items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
      {resolved && (
        <img
          src={resolved}
          alt="Full screen preview"
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
      )}
      <div className="absolute bottom-10 text-white/70 text-xs font-semibold">
        Click anywhere to close
      </div>
    </div>
  );
}
