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

-- ===== 사용자가 찾는 물품 =====
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name, brand)
);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- ===== 찜 목록 (사용자 관심 = product + 관심지역 + 알림설정) =====
CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  region VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  notify_by_fcm BOOLEAN DEFAULT true,
  notify_by_vibrate BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id, region)
);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_active ON wishlists(is_active);

-- ===== 현재 재고 현황 =====
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  is_in_stock BOOLEAN DEFAULT false,
  price_estimate INTEGER,
  checked_at TIMESTAMP DEFAULT NOW(),
  crawler_source VARCHAR(50),
  UNIQUE(product_id, store_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_checked_at ON inventory(checked_at);

-- ===== 재고 변경 이력 + 알림 로그 =====
CREATE TABLE IF NOT EXISTS inventory_history (
  id SERIAL PRIMARY KEY,
  wishlist_id INTEGER REFERENCES wishlists(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  status_before BOOLEAN,
  status_after BOOLEAN,
  notified_at TIMESTAMP,
  notification_type VARCHAR(50),
  fcm_success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_history_wishlist_id ON inventory_history(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at);
