# 편의점별 물품명 다중화 아키텍처

## 문제점 & 해결책

### 문제: 같은 제품이 편의점마다 다른 이름으로 판매됨

```
예: 코카콜라
- 세븐일레븐: "Coca-Cola"
- GS편의점: "코카콜라"
- CU: "콜라"
- 이마트: "코카콜라 250ml"
- 롯데마트: "Coke"
```

하나의 물품을 검색할 때 편의점마다 다른 검색명을 사용해야 하므로, **편의점별로 물품명을 등록할 수 있는 구조**가 필요합니다.

---

## 데이터베이스 구조

### 1. Products 테이블 (사용자가 찾는 실제 물품)

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  actual_name VARCHAR(255),      -- 사용자가 정의한 "실제" 물품명
  description TEXT,               -- 메모 (선택사항)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, actual_name)
);
```

**역할**: 사용자가 찾고 싶은 물품의 기본 정보 저장

**예시 데이터:**
```
id | user_id | actual_name        | description
1  | 1       | 코카콜라           | 빨간 병
2  | 1       | 포카칩             | 고추맛
```

---

### 2. Search_stores 테이블 (편의점별 검색명 + 찜 설정)

```sql
CREATE TABLE search_stores (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  convenience_brand VARCHAR(20),  -- 'seven', 'gs', 'cu', 'emart', 'lotte'
  search_name VARCHAR(255),       -- 해당 편의점에서의 물품명
  region VARCHAR(50),             -- 찾는 지역
  is_active BOOLEAN DEFAULT true,
  notify_by_fcm BOOLEAN DEFAULT true,
  notify_by_vibrate BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP,
  UNIQUE(product_id, convenience_brand, region)
);
```

**역할**: 각 편의점별로 "이 제품을 이렇게 검색하고, 이 지역에서 찜할 것"이라는 설정을 저장

**예시 데이터:**
```
id | product_id | convenience_brand | search_name      | region | notify_by_fcm
1  | 1          | seven             | "Coca-Cola"      | 강남구 | true
2  | 1          | gs                | "코카콜라"        | 강남구 | true
3  | 1          | cu                | "콜라"           | 강남구 | false
4  | 1          | emart             | "코카콜라 250ml"  | 강남구 | true
5  | 2          | seven             | "포카칩 고추맛"   | 서초구 | true
```

**의미**:
- 코카콜라(product_id=1)는 **3개 편의점에서 찜됨**:
  1. 세븐일레븐 강남구 — "Coca-Cola" 검색 — FCM 알림 ON
  2. GS 강남구 — "코카콜라" 검색 — FCM 알림 ON
  3. CU 강남구 — "콜라" 검색 — FCM 알림 OFF (진동만)

---

### 3. Inventory 테이블 (편의점별 찜의 실시간 재고)

```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  search_store_id INTEGER REFERENCES search_stores(id),  -- 편의점별 찜 항목
  store_id INTEGER REFERENCES stores(id),                -- 실제 점포
  is_in_stock BOOLEAN,
  price_estimate INTEGER,
  checked_at TIMESTAMP,
  crawler_source VARCHAR(50),
  UNIQUE(search_store_id, store_id)
);
```

**역할**: `search_stores` 각각에 대해, "강남구의 세븐일레븐 점포들에 이 제품이 있는가?"를 저장

**예시 데이터:**
```
id | search_store_id | store_id | is_in_stock | store_name
1  | 1 (seven)       | 10       | true        | 세븐일레븐 강남역점
2  | 1 (seven)       | 11       | false       | 세븐일레븐 신논현점
3  | 2 (gs)          | 20       | true        | GS편의점 강남역점
```

---

### 4. Inventory_history 테이블 (변화 추적 + 알림 로그)

```sql
CREATE TABLE inventory_history (
  id SERIAL PRIMARY KEY,
  search_store_id INTEGER REFERENCES search_stores(id),
  store_id INTEGER REFERENCES stores(id),
  status_before BOOLEAN,         -- 이전 상태 (품절)
  status_after BOOLEAN,          -- 현재 상태 (입고)
  notified_at TIMESTAMP,         -- 언제 알림을 보냈는가
  notification_type VARCHAR(50), -- 'fcm', 'vibrate'
  fcm_success BOOLEAN,           -- 알림 성공 여부
  created_at TIMESTAMP
);
```

**역할**: "세븐일레븐에서 코카콜라가 품절→입고로 바뀌었고, FCM 알림을 보냈다"는 이력을 저장

---

## API 플로우

### 1. 제품 등록

```
POST /api/products
{
  "user_id": 1,
  "actual_name": "코카콜라",
  "description": "빨간 병"
}

응답:
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "actual_name": "코카콜라",
    "created_at": "2026-05-18T..."
  }
}
```

### 2. 편의점별 찜 등록

```
POST /api/wishlists
{
  "user_id": 1,
  "product_id": 1,
  "convenience_brand": "seven",      -- "이 편의점에서"
  "search_name": "Coca-Cola",        -- "이 이름으로 검색"
  "region": "강남구",                 -- "이 지역에서"
  "notify_by_fcm": true,
  "notify_by_vibrate": true
}

응답:
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "convenience_brand": "seven",
    "search_name": "Coca-Cola",
    "region": "강남구",
    "created_at": "2026-05-18T..."
  }
}
```

### 3. 사용자의 모든 편의점별 찜 조회

```
GET /api/wishlists?user_id=1

응답:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "actual_name": "코카콜라",
      "convenience_brand": "seven",
      "search_name": "Coca-Cola",
      "region": "강남구",
      "notify_by_fcm": true,
      "created_at": "2026-05-18T..."
    },
    {
      "id": 2,
      "product_id": 1,
      "actual_name": "코카콜라",
      "convenience_brand": "gs",
      "search_name": "코카콜라",
      "region": "강남구",
      "notify_by_fcm": true,
      "created_at": "2026-05-18T..."
    }
  ]
}
```

### 4. 편의점별 찜의 현재 재고 조회

```
GET /api/wishlists/:id/status

응답:
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "convenience_brand": "seven",
    "search_name": "Coca-Cola",
    "region": "강남구",
    "in_stock_count": 3,          -- 강남구 세븐일레븐 중 3곳에 재고 있음
    "total_stores": 8,             -- 강남구 세븐일레븐은 총 8곳
    "last_checked": "2026-05-18T..."
  }
}
```

---

## Cron 워크플로우 (30분마다)

```
1. 활성 search_stores 조회
   ↓
2. 각 편의점별 항목마다:
   
   a) 크롤러 실행
      SevenElevenCrawler.crawl("Coca-Cola", "강남구")
      ↓
   b) 결과를 inventory에 저장
      - search_store_id: 1
      - store_id: 10, 11, 12, ...
      - is_in_stock: true/false
      ↓
   c) 이전 상태와 비교 (inventory_history)
      - 이전: false (품절)
      - 현재: true (입고) ← 변화 감지!
      ↓
   d) 알림 발송
      FCM: "[세븐일레븐] 코카콜라 - 강남역점에 입고됨!"
      Vibrate: 진동 활성화
      ↓
   e) inventory_history 기록
```

---

## UI 플로우

### 물품 추가 & 편의점별 설정

```
화면 1: "내가 찾는 물품"
┌─────────────────────────┐
│ 물품명 입력             │
│ [______코카콜라________]│
│ [추가]                  │
└─────────────────────────┘
    ↓

화면 2: "어느 편의점에서?"
┌─────────────────────────┐
│ ☑ 세븐일레븐           │
│ ☑ GS편의점             │
│ ☑ CU                   │
│ ☐ 이마트               │
│ ☐ 롯데마트             │
└─────────────────────────┘
    ↓

화면 3: "각 편의점에서 이렇게 검색할 거예요"
┌──────────────────────────────┐
│ 세븐일레븐                    │
│ 검색명: [Coca-Cola_____] │
│                              │
│ GS편의점                     │
│ 검색명: [코카콜라_______] │
│                              │
│ CU                           │
│ 검색명: [콜라__________] │
│                              │
│ [완료]                       │
└──────────────────────────────┘
    ↓

화면 4: "어느 지역에서?"
┌─────────────────────────┐
│ 지역선택 (드롭다운)      │
│ [강남구________▼]       │
│ [확인]                  │
└─────────────────────────┘
    ↓

화면 5: "알림 설정"
┌─────────────────────────┐
│ 세븐일레븐              │
│ FCM 알림: [ON ]        │
│ 진동: [ON ]            │
│                         │
│ GS편의점                │
│ FCM 알림: [ON ]        │
│ 진동: [OFF]            │
│ ...                    │
│ [저장]                 │
└─────────────────────────┘
```

---

## 핵심 차이점

| 항목 | 이전 구조 | 새로운 구조 |
|------|---------|-----------|
| **찜 단위** | 제품 | 편의점 + 제품 + 지역 |
| **검색명** | 하나 (모든 편의점에 동일) | 편의점별로 다름 |
| **DB 테이블** | products, wishlists | products, search_stores, inventory |
| **예시** | 코카콜라 찜 | 세븐일레븐에서 "Coca-Cola" 찜 |
| | | GS에서 "코카콜라" 찜 |
| | | CU에서 "콜라" 찜 |

---

## 마이그레이션

기존 `products + wishlists` 구조에서 `products + search_stores` 구조로 전환:

```sql
-- 기존 데이터 변환 (한 번만 실행)
INSERT INTO search_stores (product_id, convenience_brand, search_name, region, notify_by_fcm, notify_by_vibrate, created_at)
SELECT 
  w.product_id,
  'seven' as convenience_brand,  -- 기본값으로 세븐일레븐 선택
  p.name as search_name,         -- 기존 물품명 사용
  w.region,
  w.notify_by_fcm,
  w.notify_by_vibrate,
  w.created_at
FROM wishlists w
JOIN products p ON w.product_id = p.id;

-- 그 후 wishlists 테이블은 사용하지 않음
DROP TABLE wishlists;
```

---

## 요약

### 핵심 개선점
✅ 편의점마다 다른 물품명 지원  
✅ 같은 제품을 여러 편의점에서 추적 가능  
✅ 편의점별로 알림 설정 독립적 제어  
✅ 크롤러가 편의점별 검색명을 정확히 사용

### 사용자 경험
"코카콜라를 찾는데, 세븐일레븐에서는 'Coca-Cola'로, GS에서는 '코카콜라'로 검색하고 싶어"  
→ **이제 가능! 🎉**
