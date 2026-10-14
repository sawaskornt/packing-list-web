import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Filter,
  History,
  Layers,
  LogOut,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { InventoryItem, Status } from '../types';
import { useStore } from '../store';
import { useToast } from '../toast';
import { STATUSES, statusColor } from '../theme';
import { ItemCard } from '../components/ItemCard';
import { ConfirmDialog } from '../components/ui';
import { ItemFormModal } from '../modals/ItemFormModal';
import { MoveConfirmModal, PendingMove } from '../modals/MoveConfirmModal';
import { AdvancedSearchModal, AdvFilters, EMPTY_FILTERS } from '../modals/AdvancedSearchModal';
import { BulkEditModal } from '../modals/BulkEditModal';
import { ScanModal } from '../modals/ScanModal';
import { TimelineModal } from '../modals/TimelineModal';
import { SendModal } from '../modals/SendModal';
import { ReceiveModal } from '../modals/ReceiveModal';
import { UserManagementModal } from '../modals/UserManagementModal';
import { BatchManagementModal } from '../modals/BatchManagementModal';
import { MigrationModal } from '../modals/MigrationModal';
import { LocationManageModal } from '../modals/LocationManageModal';
import { FullScreenImageModal } from '../modals/FullScreenImageModal';

export function MainScreen() {
  const store = useStore();
  const toast = useToast();
  const { currentUser } = store;

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advFilters, setAdvFilters] = useState<AdvFilters>(EMPTY_FILTERS);
  const [advApplied, setAdvApplied] = useState(false);

  // Modals
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineItem, setTimelineItem] = useState<InventoryItem | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [sendSeedItems, setSendSeedItems] = useState<InventoryItem[]>([]);
  const [showReceive, setShowReceive] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showBatches, setShowBatches] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Item interactions
  const [statusPickerItem, setStatusPickerItem] = useState<InventoryItem | null>(null);
  const [movePickerItem, setMovePickerItem] = useState<InventoryItem | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const canViewHistory =
    !!currentUser &&
    (currentUser.role === 'admin' ||
      currentUser.role === 'manager' ||
      currentUser.allowed_history === 'true');

  const filteredItems = useMemo(() => {
    return store.items.filter((item) => {
      if (advApplied || showAdvancedSearch) {
        const f = advFilters;
        const matchesName =
          !f.name || String(item.name || '').toLowerCase().includes(f.name.toLowerCase());
        const matchesBarcode =
          !f.barcode || String(item.barcode_id || '').toLowerCase().includes(f.barcode.toLowerCase());
        const matchesLocation = f.location === 'All' || item.location === f.location;
        const matchesCategory = f.category === 'All' || item.category === f.category;
        const matchesSubLocation =
          f.sub_location === 'All' ||
          String(item.sub_location || '').toLowerCase().includes(f.sub_location.toLowerCase());
        const matchesStatus = f.status === 'All' || item.status === f.status;
        let matchesDate = true;
        if (f.dateFrom || f.dateTo) {
          const itemDate = new Date(item.updated_at).getTime();
          if (f.dateFrom && itemDate < new Date(f.dateFrom).getTime()) matchesDate = false;
          if (f.dateTo) {
            const toDate = new Date(f.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (itemDate > toDate.getTime()) matchesDate = false;
          }
        }
        return (
          matchesName &&
          matchesBarcode &&
          matchesLocation &&
          matchesCategory &&
          matchesSubLocation &&
          matchesStatus &&
          matchesDate
        );
      }

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        String(item.name || '').toLowerCase().includes(query) ||
        String(item.category || '').toLowerCase().includes(query) ||
        String(item.sub_location || '').toLowerCase().includes(query) ||
        String(item.location || '').toLowerCase().includes(query) ||
        String(item.barcode_id || '').toLowerCase().includes(query);

      if (searchQuery.trim() === '') return item.location === store.activeLocation;
      return matchesSearch;
    });
  }, [store.items, searchQuery, store.activeLocation, advApplied, showAdvancedSearch, advFilters]);

  const openGlobalHistory = () => {
    if (!canViewHistory) {
      toast.error('You do not have permission to view global history.');
      return;
    }
    setTimelineItem(null);
    setShowTimeline(true);
  };

  const confirmPendingMove = async (subLoc: string) => {
    if (!pendingMove) return;
    setMoveLoading(true);
    if (pendingMove.type === 'bulk') {
      const ok = await store.bulkUpdateItems(pendingMove.ids, {
        location: pendingMove.location,
        sub_location: subLoc,
      });
      if (ok) setSelectedItemIds([]);
    } else {
      const ok = await store.updateItem(pendingMove.ids[0], {
        location: pendingMove.location,
        sub_location: subLoc,
      });
      if (ok) toast.success('Item moved');
    }
    setMoveLoading(false);
    setPendingMove(null);
  };

  const toggleSelect = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await store.reloadAll();
    setRefreshing(false);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col pb-28">
      {/* Header Container */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-xs">
                <Package size={17} color="white" />
              </div>
              <h1 className="text-[18px] font-extrabold text-[#111827] tracking-tight">
                Inventory
              </h1>
            </div>

            <div className="flex items-center gap-1.5 relative">
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh inventory"
                className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RefreshCw
                  size={16}
                  color="#6B7280"
                  className={refreshing ? 'animate-spin' : ''}
                />
              </button>
              <button
                type="button"
                onClick={() => setShowScan(true)}
                title="CLS Scan"
                className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Clock size={17} color="#6B7280" />
              </button>
              {canViewHistory && (
                <button
                  type="button"
                  onClick={openGlobalHistory}
                  title="Global History"
                  className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <History size={17} color="#6B7280" />
                </button>
              )}

              {/* User Avatar Menu Trigger */}
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="w-[34px] h-[34px] rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                title="Account menu"
              >
                <span className="text-[#3730A3] font-extrabold text-[13px] uppercase">
                  {currentUser?.username?.[0] || 'U'}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-50 cursor-default"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-60 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] py-2 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-[#F3F4F6]">
                      <div className="text-[14px] font-extrabold text-[#111827]">
                        {currentUser?.username}
                      </div>
                      <div className="text-[10px] font-extrabold text-[#9CA3AF] tracking-wider uppercase mt-0.5">
                        {currentUser?.role}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowLocations(true);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <MapPin size={16} color="#6B7280" />
                      <span>Manage Locations</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setShowUsers(true);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Users size={16} color="#6B7280" />
                          <span>User Management</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setShowBatches(true);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Layers size={16} color="#6B7280" />
                          <span>Batch Management</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setShowMigration(true);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Upload size={16} color="#6B7280" />
                          <span>Data Migration</span>
                        </button>
                      </>
                    )}

                    <div className="border-t border-[#F3F4F6] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        store.logout();
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left text-[14px] font-semibold text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut size={16} color="#DC2626" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search Row */}
          <div className="flex gap-2 pb-2.5">
            <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-full px-3.5 py-2">
              <Search size={16} color="#9CA3AF" className="mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all locations…"
                className="w-full bg-transparent text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 hover:opacity-70 cursor-pointer"
                >
                  <X size={16} color="#9CA3AF" strokeWidth={2.5} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedSearch(true)}
              className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                advApplied
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-[#F3F4F6] hover:bg-gray-200 text-[#6B7280]'
              }`}
              title="Advanced filters"
            >
              <Filter size={15} color={advApplied ? 'white' : '#6B7280'} />
            </button>
          </div>

          {/* Location Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {store.allowedLocations.map((loc) => {
              const active =
                store.activeLocation === loc.name && searchQuery === '' && !advApplied;
              const count = store.items.filter((i) => i.location === loc.name).length;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setAdvApplied(false);
                    store.setActiveLocation(loc.name);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold border transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#4F46E5] border-[#4F46E5] text-white shadow-xs'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span
                    className={`text-[11px] font-bold ${
                      active ? 'text-white/80' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowLocations(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-bold border border-dashed border-[#4F46E5]/40 text-[#4F46E5] hover:bg-indigo-50/50 shrink-0 transition-colors cursor-pointer"
            >
              <Plus size={13} color="#4F46E5" strokeWidth={2.5} />
              <span>Manage</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-3 flex-1">
        {/* Advanced Filter Active Banner */}
        {advApplied && (
          <div className="flex items-center justify-between bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl px-4 py-3 mb-3">
            <span className="text-[12px] font-bold text-[#3730A3]">
              Advanced filters active — {filteredItems.length} results
            </span>
            <button
              type="button"
              onClick={() => {
                setAdvApplied(false);
                setAdvFilters(EMPTY_FILTERS);
              }}
              className="text-[#4F46E5] text-[12px] font-extrabold hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Send / Receive Bar */}
        <div className="flex gap-2.5 mb-4">
          <button
            type="button"
            onClick={() => {
              setSendSeedItems([]);
              setShowSend(true);
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold text-[13px] transition-colors cursor-pointer shadow-xs text-center"
          >
            ⇄ Send Items
          </button>
          <button
            type="button"
            onClick={() => setShowReceive(true)}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-[13px] transition-colors cursor-pointer shadow-xs text-center"
          >
            ⬇ Receive Items
          </button>
        </div>

        {/* Item List / Loading State */}
        {store.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
            <RefreshCw size={32} className="animate-spin text-[#4F46E5] mb-3" />
            <span className="text-sm font-semibold">Loading inventory…</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 text-[#9CA3AF]">
              <Package size={36} strokeWidth={1.5} />
            </div>
            <h3 className="text-[#6B7280] font-bold text-base">No items found</h3>
            <p className="text-[#9CA3AF] text-sm mt-1">
              {searchQuery
                ? 'Try a different search query or clear filters.'
                : `No items in ${store.activeLocation} yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                activeLocation={store.activeLocation}
                selected={selectedItemIds.includes(item.id)}
                selectionMode={selectedItemIds.length > 0}
                onToggleSelect={() => toggleSelect(item.id)}
                onPressImage={() => setFullScreenImage(item.image_url || null)}
                onPressStatus={() => setStatusPickerItem(item)}
                onPressMove={() => setMovePickerItem(item)}
                onPressSend={() => {
                  setSendSeedItems([item]);
                  setShowSend(true);
                }}
                onPressHistory={() => {
                  setTimelineItem(item);
                  setShowTimeline(true);
                }}
                onPressEdit={() => {
                  setEditingItem(item);
                  setShowItemForm(true);
                }}
                onPressDelete={() => setItemToDelete(item)}
                onChangeQuantity={(delta) => {
                  const newQty = Math.max(1, item.quantity + delta);
                  if (newQty !== item.quantity) {
                    store.updateItem(item.id, { quantity: newQty });
                  }
                }}
                onMarkSeen={() => {
                  store.updateItem(item.id, { last_seen_at: new Date().toISOString() });
                  toast.success('Marked as seen');
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Add Item Button */}
      <button
        type="button"
        onClick={() => {
          setEditingItem(null);
          setShowItemForm(true);
        }}
        title="Add new item"
        className={`fixed right-6 z-30 w-14 h-14 rounded-full bg-[#4F46E5] hover:bg-indigo-700 text-white flex items-center justify-center text-3xl font-light shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
          selectedItemIds.length > 0 ? 'bottom-24' : 'bottom-6'
        }`}
      >
        ＋
      </button>

      {/* Bulk Actions Floating Bar */}
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] shadow-2xl p-4">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] font-extrabold flex items-center justify-center shrink-0">
              {selectedItemIds.length}
            </div>
            <button
              type="button"
              onClick={() => setShowBulkEdit(true)}
              className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold text-[13px] transition-colors cursor-pointer text-center"
            >
              Update…
            </button>
            <button
              type="button"
              onClick={() => {
                const selected = store.items.filter((i) => selectedItemIds.includes(i.id));
                if (selected.length > 0) {
                  setSendSeedItems(selected);
                  setShowSend(true);
                }
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-[13px] transition-colors cursor-pointer text-center"
            >
              Send (Batch)
            </button>
            <button
              type="button"
              onClick={() => setSelectedItemIds([])}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
              title="Cancel selection"
            >
              <X size={18} color="#6B7280" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Pickers & Modals */}
      {statusPickerItem && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setStatusPickerItem(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-[12px] font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-1">
              Status: {statusPickerItem.name}
            </h4>
            {STATUSES.map((st) => {
              const isSelected = st === statusPickerItem.status;
              const sc = statusColor(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    store.updateItem(statusPickerItem.id, { status: st });
                    setStatusPickerItem(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EEF2FF] font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  <span style={{ color: sc.fg }} className="font-bold text-[15px]">
                    {st}
                  </span>
                  {isSelected && <Check size={18} color="#4F46E5" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {movePickerItem && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setMovePickerItem(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-[12px] font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-1">
              Move "{movePickerItem.name}" to…
            </h4>
            {store.locations
              .map((l) => l.name)
              .filter((n) => n !== movePickerItem.location)
              .map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setPendingMove({
                      ids: [movePickerItem.id],
                      itemName: movePickerItem.name,
                      location: loc,
                      sub_location: movePickerItem.sub_location || '',
                      type: 'single',
                    });
                    setMovePickerItem(null);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[15px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span>{loc}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      <MoveConfirmModal
        pendingMove={pendingMove}
        onCancel={() => setPendingMove(null)}
        onConfirm={confirmPendingMove}
        loading={moveLoading}
      />

      <ConfirmDialog
        visible={!!itemToDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            const ok = await store.deleteItem(itemToDelete.id);
            if (ok) toast.success('Item deleted');
          }
          setItemToDelete(null);
        }}
      />

      {/* Feature Modals */}
      <ItemFormModal
        visible={showItemForm}
        onClose={() => setShowItemForm(false)}
        editingItem={editingItem}
      />
      <ScanModal visible={showScan} onClose={() => setShowScan(false)} />
      <TimelineModal
        visible={showTimeline}
        itemId={timelineItem?.id ?? null}
        itemName={timelineItem?.name}
        onClose={() => setShowTimeline(false)}
        onPressImage={setFullScreenImage}
      />
      <SendModal
        visible={showSend}
        onClose={() => setShowSend(false)}
        initialItems={sendSeedItems}
        onSent={() => setSelectedItemIds([])}
      />
      <ReceiveModal
        visible={showReceive}
        onClose={() => setShowReceive(false)}
        onPressImage={setFullScreenImage}
      />
      <AdvancedSearchModal
        visible={showAdvancedSearch}
        filters={advFilters}
        setFilters={setAdvFilters}
        onApply={() => {
          setAdvApplied(true);
          setShowAdvancedSearch(false);
        }}
        onClear={() => {
          setAdvFilters(EMPTY_FILTERS);
          setAdvApplied(false);
          setShowAdvancedSearch(false);
        }}
        onClose={() => setShowAdvancedSearch(false)}
      />
      <BulkEditModal
        visible={showBulkEdit}
        selectedIds={selectedItemIds}
        onClose={() => setShowBulkEdit(false)}
        onDone={() => setSelectedItemIds([])}
      />
      {isAdmin && (
        <UserManagementModal visible={showUsers} onClose={() => setShowUsers(false)} />
      )}
      {isAdmin && (
        <BatchManagementModal visible={showBatches} onClose={() => setShowBatches(false)} />
      )}
      {isAdmin && (
        <MigrationModal visible={showMigration} onClose={() => setShowMigration(false)} />
      )}
      <LocationManageModal
        visible={showLocations}
        onClose={() => setShowLocations(false)}
      />
      <FullScreenImageModal
        uri={fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
    </div>
  );
}
