import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, apiJson, setApiUsername } from './api';
import { useToast } from './toast';
import {
  CategoryRecord,
  InventoryItem,
  Location,
  LocationRecord,
  TimelineEvent,
  User,
} from './types';

export interface Batch {
  id: number;
  source_location: string;
  dest_location: string;
  status: string;
  notes?: string;
  created_at?: string;
  items?: any[];
}

interface StoreValue {
  // Auth
  currentUser: User | null;
  authLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;

  // Data
  items: InventoryItem[];
  timeline: TimelineEvent[];
  locations: LocationRecord[];
  categories: CategoryRecord[];
  batches: Batch[];
  isLoading: boolean;
  activeLocation: Location;
  setActiveLocation: (loc: Location) => void;
  allowedLocations: LocationRecord[];
  existingSubLocations: string[];
  getSubLocations: (location?: string) => string[];

  // Actions
  reloadAll: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchTimeline: (itemId?: number | null) => Promise<TimelineEvent[]>;
  fetchBatches: () => Promise<void>;
  addItem: (payload: {
    name: string;
    sub_location: string;
    category: string;
    quantity: number;
    barcode_id: string;
    image_url: string;
  }) => Promise<boolean>;
  updateItem: (id: number, updates: Partial<InventoryItem>) => Promise<boolean>;
  bulkUpdateItems: (ids: number[], updates: Partial<InventoryItem>) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  clsScan: (barcode: string, location: Location, sub_location?: string) => Promise<InventoryItem>;
  sendItem: (payload: any) => Promise<boolean>;
  sendBatch: (payload: any) => Promise<boolean>;
  receiveItem: (payload: any) => Promise<boolean>;
  receiveBatchItems: (batchId: number, receiveAll: boolean, itemIds: number[], notes: string) => Promise<boolean>;
  updateBatch: (id: number, payload: any) => Promise<boolean>;
  deleteBatch: (id: number) => Promise<boolean>;
  addLocation: (name: string) => Promise<boolean>;
  renameLocation: (id: number, name: string) => Promise<boolean>;
  deleteLocation: (id: number) => Promise<boolean>;
  addCategory: (name: string) => Promise<CategoryRecord | null>;
  deleteCategory: (id: number) => Promise<boolean>;
  fetchUsers: () => Promise<User[]>;
  createUser: (payload: any) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  migrate: (json: string) => Promise<string | null>;
}

const StoreContext = createContext<StoreValue>(null as any);

export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState<Location>('Condo');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        setApiUsername(user.username);
        setCurrentUser(user);
      }
    } catch {}
    setAuthLoading(false);
  }, []);

  const allowedLocations = useMemo(() => {
    if (!currentUser?.allowed_locations || currentUser.allowed_locations === 'All') return locations;
    const allowedNames = currentUser.allowed_locations.split(',').map((l) => l.trim().toLowerCase());
    const filtered = locations.filter((loc) => loc.name && allowedNames.includes(loc.name.toLowerCase()));
    return filtered.length > 0 ? filtered : locations;
  }, [locations, currentUser]);

  const existingSubLocations = useMemo(() => {
    const subs = items.map((item) => item.sub_location).filter(Boolean) as string[];
    return Array.from(new Set(subs)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [items]);

  const getSubLocations = useCallback(
    (loc?: string) => {
      if (!loc || loc === 'All') {
        return existingSubLocations;
      }
      const locLower = loc.trim().toLowerCase();
      const subs = items
        .filter((item) => (item.location || '').trim().toLowerCase() === locLower)
        .map((item) => item.sub_location)
        .filter(Boolean) as string[];
      return Array.from(new Set(subs)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    },
    [items, existingSubLocations]
  );


  const fetchItems = useCallback(async () => {
    try {
      const response = await apiFetch('/api/inventory');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch items:', e);
    }
  }, []);

  const fetchTimeline = useCallback(async (itemId?: number | null) => {
    try {
      const url = itemId ? `/api/timeline?item_id=${itemId}` : '/api/timeline';
      const response = await apiFetch(url);
      const data = await response.json();
      const events = Array.isArray(data) ? data : [];
      if (!itemId) setTimeline(events);
      return events;
    } catch (e) {
      console.error('Failed to fetch timeline:', e);
      return [];
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/batches');
      if (resp.ok) setBatches(await resp.json());
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await apiFetch('/api/locations');
      const data = await response.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch locations:', e);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiFetch('/api/categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/init');
      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        setTimeline(Array.isArray(data.timeline) ? data.timeline : []);
        const locs = Array.isArray(data.locations) ? data.locations : [];
        setLocations(locs);
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        fetchBatches();
      } else {
        await Promise.all([fetchItems(), fetchTimeline(), fetchLocations(), fetchCategories(), fetchBatches()]);
      }
    } catch (e) {
      console.error('Error during init:', e);
      await Promise.all([fetchItems(), fetchTimeline(), fetchLocations(), fetchCategories(), fetchBatches()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, fetchTimeline, fetchLocations, fetchCategories, fetchBatches]);

  useEffect(() => {
    if (currentUser) reloadAll();
  }, [currentUser, reloadAll]);

  useEffect(() => {
    if (allowedLocations.length > 0) {
      const exists = allowedLocations.some((l) => l.name === activeLocation);
      if (!exists) setActiveLocation(allowedLocations[0].name);
    }
  }, [allowedLocations, activeLocation]);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const resp = await apiJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (resp.ok) {
        const user = await resp.json();
        localStorage.setItem('currentUser', JSON.stringify(user));
        setApiUsername(user.username);
        setCurrentUser(user);
        toast.success(`Welcome back, ${user.username}!`);
        return null;
      }
      const err = await resp.json();
      return err.error || 'Invalid credentials';
    } catch (e) {
      console.error(e);
      return 'Server connection failed';
    }
  }, [toast]);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setApiUsername(null);
    setCurrentUser(null);
    setItems([]);
    setTimeline([]);
    setBatches([]);
    toast.success('Logged out successfully');
  }, [toast]);

  const addItem = useCallback(
    async (payload: {
      name: string;
      sub_location: string;
      category: string;
      quantity: number;
      barcode_id: string;
      image_url: string;
    }) => {
      try {
        const response = await apiJson('/api/inventory', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            location: activeLocation,
            category: payload.category || 'General',
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setItems((prev) => [data, ...prev]);
          fetchTimeline();
          return true;
        }
        toast.error(data.error || 'Failed to add item');
        return false;
      } catch (e: any) {
        toast.error('Failed to add item: ' + (e.message || 'Unknown error'));
        return false;
      }
    },
    [activeLocation, fetchTimeline, toast]
  );

  const updateItem = useCallback(
    async (id: number, updates: Partial<InventoryItem>) => {
      let previousItems: InventoryItem[] = [];
      setItems((prev) => {
        previousItems = prev;
        return prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      });
      try {
        const response = await apiJson(`/api/inventory/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        const data = await response.json();
        if (response.ok) {
          setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
          fetchTimeline();
          return true;
        }
        setItems(previousItems);
        toast.error(data.error || 'Failed to update item');
        return false;
      } catch (e: any) {
        setItems(previousItems);
        toast.error('Failed to update item: ' + (e.message || 'Unknown error'));
        return false;
      }
    },
    [fetchTimeline, toast]
  );

  const bulkUpdateItems = useCallback(
    async (ids: number[], updates: Partial<InventoryItem>) => {
      try {
        const response = await apiJson('/api/inventory/bulk-update', {
          method: 'PATCH',
          body: JSON.stringify({ ids, updates }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(`Successfully updated ${ids.length} items`);
          await fetchItems();
          await fetchTimeline();
          return true;
        }
        toast.error(data.error || 'Failed to update items');
        return false;
      } catch {
        toast.error('Bulk update failed');
        return false;
      }
    },
    [fetchItems, fetchTimeline, toast]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        const response = await apiFetch(`/api/inventory/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          fetchTimeline();
          return true;
        }
        const error = await response.json();
        toast.error(error.error || 'Failed to delete item');
        return false;
      } catch {
        toast.error('Network error while deleting item');
        return false;
      }
    },
    [fetchTimeline, toast]
  );

  const clsScan = useCallback(
    async (barcode: string, location: Location, sub_location?: string) => {
      const response = await apiJson('/api/cls-scan', {
        method: 'POST',
        body: JSON.stringify({ barcode_id: barcode, location, sub_location }),
      });
      const data = await response.json();
      if (response.ok) {
        setItems((prev) => [data, ...prev.filter((item) => item.id !== data.id)]);
        fetchTimeline();
        return data as InventoryItem;
      }
      throw new Error(data.error || 'Scan failed');
    },
    [fetchTimeline]
  );

  const refreshItemsAndTimeline = useCallback(async () => {
    try {
      const reloadResp = await apiFetch('/api/init');
      if (reloadResp.ok) {
        const reloadData = await reloadResp.json();
        setItems(reloadData.items);
        setTimeline(reloadData.timeline);
      }
    } catch {}
  }, []);

  const sendItem = useCallback(
    async (payload: any) => {
      try {
        const resp = await apiJson('/api/inventory/send', { method: 'POST', body: JSON.stringify(payload) });
        if (resp.ok) {
          toast.success('Item sent successfully');
          await refreshItemsAndTimeline();
          return true;
        }
        const err = await resp.json();
        toast.error(err.error || 'Failed to transfer item');
        return false;
      } catch {
        toast.error('Connection failed');
        return false;
      }
    },
    [refreshItemsAndTimeline, toast]
  );

  const sendBatch = useCallback(
    async (payload: any) => {
      try {
        const resp = await apiJson('/api/inventory/send-batch', { method: 'POST', body: JSON.stringify(payload) });
        if (resp.ok) {
          toast.success('Batch sent successfully in transit');
          await refreshItemsAndTimeline();
          fetchBatches();
          return true;
        }
        const err = await resp.json();
        toast.error(err.error || 'Failed to send batch');
        return false;
      } catch {
        toast.error('Connection failed');
        return false;
      }
    },
    [refreshItemsAndTimeline, fetchBatches, toast]
  );

  const receiveItem = useCallback(
    async (payload: any) => {
      try {
        const resp = await apiJson('/api/inventory/receive', { method: 'POST', body: JSON.stringify(payload) });
        if (resp.ok) {
          toast.success('Inventory received successfully');
          await refreshItemsAndTimeline();
          return true;
        }
        const err = await resp.json();
        toast.error(err.error || 'Failed to receive inventory');
        return false;
      } catch {
        toast.error('Connection failed');
        return false;
      }
    },
    [refreshItemsAndTimeline, toast]
  );

  const receiveBatchItems = useCallback(
    async (batchId: number, receiveAll: boolean, itemIds: number[], notes: string) => {
      try {
        const resp = await apiJson(`/api/batches/${batchId}/receive`, {
          method: 'POST',
          body: JSON.stringify({ receive_all: receiveAll, item_ids: itemIds, notes }),
        });
        if (resp.ok) {
          toast.success(receiveAll ? 'Entire batch received successfully!' : 'Selected items from batch received successfully!');
          await refreshItemsAndTimeline();
          fetchBatches();
          return true;
        }
        const err = await resp.json();
        toast.error(err.error || 'Failed to receive batch items');
        return false;
      } catch {
        toast.error('Connection failed');
        return false;
      }
    },
    [refreshItemsAndTimeline, fetchBatches, toast]
  );

  const updateBatch = useCallback(
    async (id: number, payload: any) => {
      try {
        const resp = await apiJson(`/api/batches/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        if (resp.ok) {
          toast.success('Batch updated successfully!');
          fetchBatches();
          return true;
        }
        const err = await resp.json();
        toast.error(err.error || 'Failed to update batch');
        return false;
      } catch {
        toast.error('Connection error');
        return false;
      }
    },
    [fetchBatches, toast]
  );

  const deleteBatch = useCallback(
    async (id: number) => {
      try {
        const resp = await apiFetch(`/api/batches/${id}`, { method: 'DELETE' });
        if (resp.ok) {
          toast.success('Batch deleted successfully');
          fetchBatches();
          return true;
        }
        toast.error('Failed to delete batch');
        return false;
      } catch {
        toast.error('Connection error');
        return false;
      }
    },
    [fetchBatches, toast]
  );

  const addLocation = useCallback(
    async (name: string) => {
      try {
        const response = await apiJson('/api/locations', { method: 'POST', body: JSON.stringify({ name }) });
        if (response.ok) {
          const data = await response.json();
          setLocations((prev) => [...prev, data]);
          return true;
        }
        const error = await response.json();
        toast.error(error.error || 'Failed to add location');
        return false;
      } catch {
        toast.error('Network error while adding location');
        return false;
      }
    },
    [toast]
  );

  const renameLocation = useCallback(
    async (id: number, name: string) => {
      try {
        const response = await apiJson(`/api/locations/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
        if (response.ok) {
          const data = await response.json();
          const oldLoc = locations.find((l) => l.id === id);
          setLocations((prev) => prev.map((l) => (l.id === id ? data : l)));
          if (oldLoc && activeLocation === oldLoc.name) setActiveLocation(name);
          fetchTimeline();
          fetchItems();
          return true;
        }
        const error = await response.json();
        toast.error(error.error || 'Failed to rename location');
        return false;
      } catch {
        toast.error('Network error while renaming location');
        return false;
      }
    },
    [locations, activeLocation, fetchTimeline, fetchItems, toast]
  );

  const deleteLocation = useCallback(
    async (id: number) => {
      const loc = locations.find((l) => l.id === id);
      if (!loc) return false;
      try {
        const response = await apiFetch(`/api/locations/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setLocations((prev) => prev.filter((l) => l.id !== id));
          if (activeLocation === loc.name) {
            const remaining = locations.filter((l) => l.id !== id);
            if (remaining.length > 0) setActiveLocation(remaining[0].name);
          }
          fetchTimeline();
          return true;
        }
        const error = await response.json();
        toast.error(error.error || 'Failed to delete location');
        return false;
      } catch {
        toast.error('Network error while deleting location');
        return false;
      }
    },
    [locations, activeLocation, fetchTimeline, toast]
  );

  const addCategory = useCallback(
    async (name: string) => {
      try {
        const response = await apiJson('/api/categories', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
        if (response.ok) {
          const data = await response.json();
          setCategories((prev) => [...prev, data]);
          toast.success(`Category "${data.name}" added`);
          return data as CategoryRecord;
        }
        const error = await response.json();
        toast.error(error.error || 'Failed to add category');
        return null;
      } catch {
        toast.error('Network error while adding category');
        return null;
      }
    },
    [toast]
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      try {
        const response = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setCategories((prev) => prev.filter((cat) => cat.id !== id));
          return true;
        }
        const error = await response.json();
        toast.error(error.error || 'Failed to delete category');
        return false;
      } catch {
        toast.error('Network error while deleting category');
        return false;
      }
    },
    [toast]
  );

  const fetchUsers = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/users');
      if (resp.ok) return (await resp.json()) as User[];
      return [];
    } catch {
      return [];
    }
  }, []);

  const createUser = useCallback(
    async (payload: any) => {
      try {
        const resp = await apiJson('/api/users', { method: 'POST', body: JSON.stringify(payload) });
        if (resp.ok) {
          toast.success('User created successfully');
          return true;
        }
        const err = await resp.json();
        toast.error(err.error || 'Failed to create user');
        return false;
      } catch {
        toast.error('Connection error');
        return false;
      }
    },
    [toast]
  );

  const deleteUser = useCallback(
    async (id: number) => {
      try {
        const resp = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
        if (resp.ok) {
          toast.success('User deleted');
          return true;
        }
        const err = await resp.json();
        toast.error(err.error || 'Failed to delete');
        return false;
      } catch {
        toast.error('Connection error');
        return false;
      }
    },
    [toast]
  );

  const migrate = useCallback(
    async (json: string): Promise<string | null> => {
      let data: any;
      try {
        data = JSON.parse(json);
      } catch {
        return 'Invalid JSON format. Please check the data from "Item Information".';
      }
      if (Array.isArray(data)) {
        data = { items: data };
      } else if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        const arrayKey = keys.find((k) => Array.isArray(data[k]));
        if (arrayKey && !data.items && !data.inventory) {
          data = { ...data, items: data[arrayKey] };
        }
      }
      try {
        const response = await apiJson('/api/migrate', { method: 'POST', body: JSON.stringify(data) });
        if (response.ok) {
          const result = await response.json();
          fetchItems();
          fetchLocations();
          fetchTimeline();
          toast.success(result.message || 'Migration complete');
          return null;
        }
        const error = await response.json();
        return error.error || 'Migration failed';
      } catch {
        return 'Network error during migration';
      }
    },
    [fetchItems, fetchLocations, fetchTimeline, toast]
  );

  const value: StoreValue = {
    currentUser,
    authLoading,
    login,
    logout,
    items,
    timeline,
    locations,
    categories,
    batches,
    isLoading,
    activeLocation,
    setActiveLocation,
    allowedLocations,
    existingSubLocations,
    getSubLocations,
    reloadAll,
    fetchItems,
    fetchTimeline,
    fetchBatches,
    addItem,
    updateItem,
    bulkUpdateItems,
    deleteItem,
    clsScan,
    sendItem,
    sendBatch,
    receiveItem,
    receiveBatchItems,
    updateBatch,
    deleteBatch,
    addLocation,
    renameLocation,
    deleteLocation,
    addCategory,
    deleteCategory,
    fetchUsers,
    createUser,
    deleteUser,
    migrate,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
