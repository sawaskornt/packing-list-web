export interface User {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'operator';
  allowed_locations: string;
  allowed_statuses: string;
  allowed_history?: string;
}

export type Location = string;
export type Status = 'Ready to pack' | 'Packed' | 'Used' | 'Cleaned';

export interface LocationRecord {
  id: number;
  name: string;
}

export interface CategoryRecord {
  id: number;
  name: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  location: Location;
  sub_location?: string;
  quantity: number;
  status: Status;
  category?: string;
  barcode_id: string;
  image_url?: string;
  last_seen_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: number;
  item_id: number | null;
  item_name: string | null;
  event_type: 'created' | 'updated' | 'deleted';
  details: string;
  image_url?: string;
  ip_address?: string;
  user_agent?: string;
  ip_location?: string;
  ip_isp?: string;
  username?: string;
  created_at: string;
}
