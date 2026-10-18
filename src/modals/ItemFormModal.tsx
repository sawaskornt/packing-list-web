import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Upload } from 'lucide-react';
import { InventoryItem, Status } from '../types';
import { useStore } from '../store';
import { useToast } from '../toast';
import { STATUSES } from '../theme';
import { ConfirmDialog, Field, Input, ModalShell, PrimaryButton, Select } from '../components/ui';
import { SubLocationField } from '../components/SubLocationField';
import { BarcodeScannerModal } from '../components/BarcodeScanner';
import { resolveImageUrl, uploadImageFile } from '../api';

export function ItemFormModal({
  visible,
  onClose,
  editingItem,
}: {
  visible: boolean;
  onClose: () => void;
  editingItem: InventoryItem | null;
}) {
  const store = useStore();
  const toast = useToast();
  const isEdit = !!editingItem;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [barcodeId, setBarcodeId] = useState('');
  const [status, setStatus] = useState<Status>('Ready to pack');
  const [location, setLocation] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Category management
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setName(editingItem.name);
        setCategory(editingItem.category || '');
        setSubLocation(editingItem.sub_location || '');
        setQuantity(String(editingItem.quantity));
        setBarcodeId(editingItem.barcode_id);
        setStatus(editingItem.status);
        setLocation(editingItem.location);
        setPreviewUri(editingItem.image_url ? resolveImageUrl(editingItem.image_url) || null : null);
      } else {
        setName('');
        setCategory(store.categories[0]?.name || '');
        setSubLocation('');
        setQuantity('1');
        setBarcodeId('');
        setStatus('Ready to pack');
        setLocation(store.activeLocation);
        setPreviewUri(null);
      }
      setSelectedFile(null);
      setAddingCategory(false);
      setNewCategoryName('');
    }
  }, [visible, editingItem, store.categories, store.activeLocation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUri(objectUrl);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }
    setSaving(true);
    let imageUrl = editingItem?.image_url || '';
    if (selectedFile) {
      const uploaded = await uploadImageFile(selectedFile);
      if ('url' in uploaded) {
        imageUrl = uploaded.url;
      } else {
        toast.error(`Image upload failed: ${uploaded.error}`);
        setSaving(false);
        return;
      }
    }

    let ok: boolean;
    if (isEdit && editingItem) {
      ok = await store.updateItem(editingItem.id, {
        name,
        category,
        sub_location: subLocation,
        quantity: Math.max(1, parseInt(quantity) || 1),
        barcode_id: barcodeId,
        status,
        location,
        image_url: imageUrl,
      });
      if (ok) toast.success('Item updated');
    } else {
      ok = await store.addItem({
        name,
        category,
        sub_location: subLocation,
        quantity: Math.max(1, parseInt(quantity) || 1),
        barcode_id: barcodeId,
        image_url: imageUrl,
      });
      if (ok) toast.success('Item added');
    }
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <ModalShell visible={visible} title={isEdit ? 'Edit Item Details' : 'Add New Item'} onClose={onClose}>
      <Field label="Item Name">
        <Input value={name} onChangeText={setName} placeholder="e.g. Vacuum Cleaner" />
      </Field>

      <Field label="Barcode ID">
        <div className="flex gap-2">
          <Input
            value={barcodeId}
            onChangeText={setBarcodeId}
            placeholder="Barcode / ID"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="w-12 rounded-xl bg-[#EEF2FF] hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Scan Barcode"
          >
            <Camera size={20} color="#6B7280" />
          </button>
        </div>
      </Field>

      <Field label="Category">
        <Select
          value={category}
          options={store.categories.map((c) => c.name)}
          onChange={setCategory}
          placeholder="Select category"
        />
        <div className="flex gap-3.5 mt-1.5 ml-0.5">
          <button
            type="button"
            onClick={() => setAddingCategory(!addingCategory)}
            className="text-[12px] font-bold text-[#4F46E5] hover:underline cursor-pointer"
          >
            + New category
          </button>
          {category && (
            <button
              type="button"
              onClick={() => {
                const cat = store.categories.find((c) => c.name === category);
                if (cat) setCategoryToDelete(cat);
              }}
              className="text-[12px] font-bold text-[#DC2626] hover:underline cursor-pointer"
            >
              Delete "{category}"
            </button>
          )}
        </div>
        {addingCategory && (
          <div className="flex gap-2 mt-2">
            <Input
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              className="flex-1"
              onSubmitEditing={async () => {
                if (!newCategoryName.trim()) return;
                const cat = await store.addCategory(newCategoryName);
                if (cat) {
                  setCategory(cat.name);
                  setNewCategoryName('');
                  setAddingCategory(false);
                }
              }}
            />
            <PrimaryButton
              title="Add"
              className="!w-auto px-4.5"
              onPress={async () => {
                if (!newCategoryName.trim()) return;
                const cat = await store.addCategory(newCategoryName);
                if (cat) {
                  setCategory(cat.name);
                  setNewCategoryName('');
                  setAddingCategory(false);
                }
              }}
            />
          </div>
        )}
      </Field>

      {isEdit && (
        <>
          <Field label="Location">
            <Select value={location} options={store.locations.map((l) => l.name)} onChange={setLocation} />
          </Field>
          <Field label="Status">
            <Select value={status} options={STATUSES} onChange={(v) => setStatus(v as Status)} />
          </Field>
        </>
      )}

      <Field label="Sub-location / Storage (Optional)">
        <SubLocationField
          value={subLocation}
          onChange={setSubLocation}
          location={isEdit ? location : store.activeLocation}
        />
      </Field>

      <Field label="Quantity">
        <Input
          type="number"
          min={1}
          value={quantity}
          onChangeText={setQuantity}
        />
      </Field>

      <Field label="Photo">
        <div className="flex items-center gap-2.5">
          {previewUri ? (
            <img
              src={previewUri}
              alt="Item preview"
              className="w-[84px] h-[84px] rounded-[14px] object-cover border border-[#E5E7EB] shrink-0"
            />
          ) : (
            <div className="w-[84px] h-[84px] rounded-[14px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center shrink-0">
              <ImageIcon size={24} color="#D1D5DB" />
            </div>
          )}

          <div className="flex-1 space-y-2">
            {/* Native camera file picker on mobile/tablet browsers */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-[#F3F4F6] hover:bg-gray-200 py-2.5 px-3 rounded-[10px] text-[13px] font-bold text-[#6B7280] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera size={15} color="#6B7280" />
              <span>Take Photo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#F3F4F6] hover:bg-gray-200 py-2.5 px-3 rounded-[10px] text-[13px] font-bold text-[#6B7280] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload size={15} color="#6B7280" />
              <span>Upload from Device</span>
            </button>
          </div>
        </div>
      </Field>

      <PrimaryButton
        title={saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
        onPress={handleSave}
        loading={saving}
        className="mt-2"
      />

      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={setBarcodeId}
      />

      <ConfirmDialog
        visible={!!categoryToDelete}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={async () => {
          if (categoryToDelete) {
            const ok = await store.deleteCategory(categoryToDelete.id);
            if (ok) {
              toast.success(`Category "${categoryToDelete.name}" deleted`);
              if (category === categoryToDelete.name) setCategory('');
            }
          }
          setCategoryToDelete(null);
        }}
      />
    </ModalShell>
  );
}
