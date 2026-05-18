export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  display_name?: string;
  fcm_token?: string;
  created_at: string;
}

export interface Product {
  id: number;
  user_id: number;
  actual_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchStore {
  id: number;
  product_id: number;
  convenience_brand: 'seven' | 'gs' | 'cu' | 'emart' | 'lotte';
  search_name: string;
  region?: string;
  is_active: boolean;
  notify_by_fcm: boolean;
  notify_by_vibrate: boolean;
  last_notified_at?: string;
  created_at: string;
}

export interface Store {
  id: number;
  name: string;
  brand: 'seven' | 'gs' | 'cu' | 'emart' | 'lotte';
  address: string;
  latitude: number;
  longitude: number;
  region: string;
  contact?: string;
  created_at: string;
}

export interface Inventory {
  id: number;
  product_id: number;
  store_id: number;
  is_in_stock: boolean;
  price_estimate?: number;
  checked_at: string;
  crawler_source: string;
}

export interface InventoryHistory {
  id: number;
  search_store_id: number;
  store_id?: number;
  status_before?: boolean;
  status_after?: boolean;
  notified_at?: string;
  notification_type: string;
  fcm_success: boolean;
  created_at: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
