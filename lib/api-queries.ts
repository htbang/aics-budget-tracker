/**
 * 지역 기반 재고 조회 및 점포 선택 관련 API 쿼리
 */

export type ConvenienceBrand = 'seven' | 'gs' | 'cu' | 'emart' | 'lotte';

// ===== 1. 지역별 점포 조회 =====
export interface GetStoresByRegionRequest {
  region: string; // '강남구', '서초구' 등
}

export interface StoreWithSelectionStatus {
  id: number;
  name: string;
  brand: ConvenienceBrand;
  address: string;
  latitude: number;
  longitude: number;
  region: string;
  is_selected: boolean; // 사용자가 이미 선택했는지 여부
  has_active_wishlist: number; // 활성 찜 개수
}

// ===== 2. 좌표 기반 점포 조회 (맵 이동) =====
export interface GetStoresByCoordinateRequest {
  latitude: number;
  longitude: number;
  radius: number; // 미터 단위, 기본 1000
}

// ===== 3. 특정 점포들의 물품 재고 조회 =====
export interface GetInventoryByStoresRequest {
  user_id: number;
  store_ids: number[]; // 선택된 점포들
}

export interface ProductInventoryInStores {
  product_id: number;
  actual_name: string;
  description?: string;
  stores: {
    store_id: number;
    store_name: string;
    convenience_brand: ConvenienceBrand;
    region: string;
    is_in_stock: boolean;
    price_estimate?: number;
    checked_at: string;
  }[];
  total_in_stock: number;
  total_out_of_stock: number;
}

// ===== 4. 사용자가 점포를 선택/해제 시 Search_stores 업데이트 =====
export interface SelectStoreForProductRequest {
  user_id: number;
  product_id: number;
  store_id: number;
  convenience_brand: ConvenienceBrand;
  search_name: string; // 해당 편의점에서의 검색명
  region: string;
  is_active: boolean; // true: 선택, false: 해제
}

// ===== 5. 사용자의 현재 선택된 점포 목록 =====
export interface GetUserSelectedStoresRequest {
  user_id: number;
  region?: string; // 선택사항: 특정 지역만
}

export interface UserSelectedStore {
  store_id: number;
  store_name: string;
  brand: ConvenienceBrand;
  region: string;
  selected_product_count: number; // 이 점포에서 추적 중인 물품 수
}

// ===== 6. 지역별 사용자 선택 현황 =====
export interface RegionSelectionStatus {
  region: string;
  total_stores: number;
  selected_stores: number;
  available_stores: StoreWithSelectionStatus[];
}

// ===== 7. 물품별 점포 재고 현황 (한 물품, 여러 점포) =====
export interface GetProductInventoryRequest {
  user_id: number;
  product_id: number;
  regions?: string[]; // 선택사항: 특정 지역들만
}

export interface ProductInventoryStatus {
  product_id: number;
  actual_name: string;
  stores: {
    store_id: number;
    store_name: string;
    brand: ConvenienceBrand;
    region: string;
    is_in_stock: boolean;
    search_name: string; // 이 편의점에서 검색할 이름
    is_selected: boolean; // 사용자가 선택했는지
  }[];
}

// ===== 8. 맵 이동 시 한 번에 조회할 데이터 =====
export interface MapViewData {
  region: string;
  latitude: number;
  longitude: number;
  zoom: number;
  stores: StoreWithSelectionStatus[]; // 이 지역의 모든 편의점
  user_selections: {
    [store_id: number]: boolean; // 점포별 선택 여부
  };
  products: ProductInventoryStatus[]; // 사용자의 등록 물품들
}
