import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';
import { useStore } from '../store';
import { ConfirmDialog, Field, Input, ModalShell, PrimaryButton, Select } from '../components/ui';

export function UserManagementModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const store = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'operator'>('operator');
  const [allowedLocations, setAllowedLocations] = useState('All');
  const [allowedStatuses, setAllowedStatuses] = useState('All');
  const [allowedHistory, setAllowedHistory] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const refresh = () => store.fetchUsers().then(setUsers);

  useEffect(() => {
    if (visible) refresh();
  }, [visible]);

  const handleCreate = async () => {
    if (!username || !password) return;
    setCreating(true);
    const ok = await store.createUser({
      username,
      password,
      role,
      allowed_locations: allowedLocations,
      allowed_statuses: allowedStatuses,
      allowed_history: allowedHistory ? 'true' : 'false',
    });
    setCreating(false);
    if (ok) {
      setUsername('');
      setPassword('');
      setRole('operator');
      setAllowedLocations('All');
      setAllowedStatuses('All');
      setAllowedHistory(false);
      refresh();
    }
  };

  return (
    <ModalShell visible={visible} title="User Roles & Access Control" onClose={onClose}>
      <div className="text-[12px] font-extrabold text-[#6B7280] uppercase tracking-[0.8px] mb-2.5 mt-1">
        Create New Account
      </div>
      <div className="bg-white rounded-[18px] p-4 border border-[#E5E7EB] mb-5">
        <Field label="Username">
          <Input value={username} onChangeText={setUsername} placeholder="Username" />
        </Field>
        <Field label="Password">
          <Input value={password} onChangeText={setPassword} type="password" placeholder="Password" />
        </Field>
        <Field label="Role">
          <Select value={role} options={['operator', 'manager', 'admin']} onChange={(v) => setRole(v as any)} />
        </Field>
        <Field label="Allowed Locations">
          <Input
            value={allowedLocations}
            onChangeText={setAllowedLocations}
            placeholder='"All" or comma-separated, e.g. Condo, Home'
          />
        </Field>
        <Field label="Allowed Statuses">
          <Input
            value={allowedStatuses}
            onChangeText={setAllowedStatuses}
            placeholder='"All" or comma-separated statuses'
          />
        </Field>
        <label className="flex items-center justify-between mb-4 cursor-pointer">
          <span className="text-[13px] font-semibold text-[#111827]">Allow Global History Access</span>
          <input
            type="checkbox"
            checked={allowedHistory}
            onChange={(e) => setAllowedHistory(e.target.checked)}
            className="w-5 h-5 accent-[#4F46E5] rounded cursor-pointer"
          />
        </label>
        <PrimaryButton
          title="Create Account"
          onPress={handleCreate}
          loading={creating}
          disabled={!username || !password}
        />
      </div>

      <div className="text-[12px] font-extrabold text-[#6B7280] uppercase tracking-[0.8px] mb-2.5">
        Registered Accounts ({users.length})
      </div>
      {users.map((usr) => (
        <div
          key={usr.id}
          className="flex items-center gap-3 bg-white rounded-2xl p-3.5 mb-2 border border-[#E5E7EB]"
        >
          <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <span className="text-[#4F46E5] font-extrabold uppercase text-sm">{usr.username[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-[#111827]">{usr.username}</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5 leading-4">
              {usr.role.toUpperCase()} · Locations: {usr.allowed_locations} · Statuses: {usr.allowed_statuses}
              {usr.allowed_history === 'true' ? ' · History ✓' : ''}
            </div>
          </div>
          {usr.username !== store.currentUser?.username && (
            <button
              type="button"
              onClick={() => setUserToDelete(usr)}
              className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
            >
              <X size={16} color="#DC2626" strokeWidth={2.5} />
            </button>
          )}
        </div>
      ))}

      <ConfirmDialog
        visible={!!userToDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.username}"?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (userToDelete) {
            const ok = await store.deleteUser(userToDelete.id);
            if (ok) refresh();
          }
          setUserToDelete(null);
        }}
      />
    </ModalShell>
  );
}
