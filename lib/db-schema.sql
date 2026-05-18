-- ===== 기존 users 테이블에 FCM 토큰 추가 =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(500);

-- ===== 편의점 정보 =====
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(20) NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(10, 8),
  region VARCHAR(50),
  contact VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand, address)
);
CREATE INDEX IF NOT EXISTS idx_stores_region ON stores(region);
CREATE INDEX IF NOT EXISTS idx_stores_lat_lng ON stores(latitude, longitude);

-- ===== 사용자가 찾는 실제 물품 (상위 레벨) =====
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  actual_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, actual_name)
);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- ===== 편의점별 물품 검색명 + 찜 설정 =====
-- 같은 물품도 편의점마다 다른 이름으로 검색 가능
-- 예: 코카콜라
--   - 세븐일레븐: "Coca-Cola"
--   - GS: "코카콜라"
--   - CU: "콜라"
CREATE TABLE IF NOT EXISTS search_stores (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  convenience_brand VARCHAR(20) NOT NULL,  -- 'seven', 'gs', 'cu', 'emart', 'lotte'
  search_name VARCHAR(255) NOT NULL,       -- 해당 편의점에서의 물품명
  region VARCHAR(50),                       -- 관심 지역
  is_active BOOLEAN DEFAULT true,
  notify_by_fcm BOOLEAN DEFAULT true,
  notify_by_vibrate BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, convenience_brand, region)
);
CREATE INDEX IF NOT EXISTS idx_search_stores_product_id ON search_stores(product_id);
CREATE INDEX IF NOT EXISTS idx_search_stores_brand ON search_stores(convenience_brand);
CREATE INDEX IF NOT EXISTS idx_search_stores_active ON search_stores(is_active);

-- ===== 현재 재고 현황 =====
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  search_store_id INTEGER REFERENCES search_stores(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  is_in_stock BOOLEAN DEFAULT false,
  price_estimate INTEGER,
  checked_at TIMESTAMP DEFAULT NOW(),
  crawler_source VARCHAR(50),
  UNIQUE(search_store_id, store_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_search_store_id ON inventory(search_store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_checked_at ON inventory(checked_at);

-- ===== 재고 변경 이력 + 알림 로그 =====
CREATE TABLE IF NOT EXISTS inventory_history (
  id SERIAL PRIMARY KEY,
  search_store_id INTEGER REFERENCES search_stores(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  status_before BOOLEAN,
  status_after BOOLEAN,
  notified_at TIMESTAMP,
  notification_type VARCHAR(50),
  fcm_success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_history_search_store_id ON inventory_history(search_store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at);
