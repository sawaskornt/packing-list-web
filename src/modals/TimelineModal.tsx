import React, { useEffect, useState } from 'react';
import { Globe, Loader2, MapPin, Smartphone, User, Wifi } from 'lucide-react';
import { ModalShell, SafeImage } from '../components/ui';
import { useStore } from '../store';
import { TimelineEvent } from '../types';
import { formatDate } from '../format';

const eventStyle = (type: TimelineEvent['event_type']) => {
  switch (type) {
    case 'created':
      return { color: '#059669', label: 'Created' };
    case 'deleted':
      return { color: '#DC2626', label: 'Deleted' };
    default:
      return { color: '#4F46E5', label: 'Updated' };
  }
};

export function TimelineModal({
  visible,
  itemId,
  itemName,
  onClose,
  onPressImage,
}: {
  visible: boolean;
  itemId: number | null;
  itemName?: string | null;
  onClose: () => void;
  onPressImage: (url: string) => void;
}) {
  const store = useStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      store.fetchTimeline(itemId).then((evts) => {
        setEvents(evts);
        setLoading(false);
      });
    }
  }, [visible, itemId]);

  return (
    <ModalShell
      visible={visible}
      title={itemId ? `History: ${itemName || 'Item'}` : 'Global History'}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-[#4F46E5]" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center text-[#9CA3AF] py-12 text-sm">No history events found.</div>
      ) : (
        events.map((ev) => {
          const es = eventStyle(ev.event_type);
          return (
            <div
              key={ev.id}
              className="flex gap-3 bg-white rounded-2xl p-3.5 mb-2.5 border border-[#E5E7EB]"
            >
              <div
                className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: es.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[12px] font-extrabold uppercase tracking-[0.5px]"
                    style={{ color: es.color }}
                  >
                    {es.label}
                  </span>
                  <span className="text-[11px] text-[#9CA3AF] font-semibold">
                    {formatDate(ev.created_at)}
                  </span>
                </div>
                {ev.item_name && (
                  <div className="text-[14px] font-bold text-[#111827] mt-1">{ev.item_name}</div>
                )}
                <div className="text-[13px] text-[#6B7280] mt-1 leading-relaxed">{ev.details}</div>
                {ev.username && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <User size={11} color="#9CA3AF" />
                    <span className="text-[11px] text-[#9CA3AF] font-semibold">{ev.username}</span>
                  </div>
                )}
                {(ev.ip_address || ev.ip_location || ev.ip_isp || ev.user_agent) && (
                  <div className="mt-2 pt-2 border-t border-[#F3F4F6] space-y-1">
                    <div className="flex flex-wrap gap-x-3.5 gap-y-1">
                      {ev.ip_address && (
                        <div className="flex items-center gap-1">
                          <Globe size={10} color="#9CA3AF" />
                          <span className="text-[11px] text-[#9CA3AF] font-semibold font-mono">
                            {ev.ip_address}
                          </span>
                        </div>
                      )}
                      {ev.ip_location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={10} color="#9CA3AF" />
                          <span className="text-[11px] text-[#9CA3AF] font-semibold">
                            {ev.ip_location}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3.5 gap-y-1">
                      {ev.ip_isp && (
                        <div className="flex items-center gap-1 max-w-[200px]">
                          <Wifi size={10} color="#9CA3AF" className="shrink-0" />
                          <span className="text-[11px] text-[#9CA3AF] font-semibold truncate">
                            {ev.ip_isp}
                          </span>
                        </div>
                      )}
                      {ev.user_agent && (
                        <div className="flex items-center gap-1 max-w-[220px]">
                          <Smartphone size={10} color="#9CA3AF" className="shrink-0" />
                          <span className="text-[11px] text-[#9CA3AF] font-semibold truncate">
                            {ev.user_agent.split(')')[0].split('(').pop() ||
                              ev.user_agent.substring(0, 24) + '…'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {ev.image_url && (
                  <button
                    type="button"
                    onClick={() => onPressImage(ev.image_url!)}
                    className="mt-2 block cursor-zoom-in"
                  >
                    <SafeImage uri={ev.image_url} className="w-[72px] h-[72px] rounded-xl" />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </ModalShell>
  );
}
