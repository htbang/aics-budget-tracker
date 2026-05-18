# 맵 기반 지역별 재고 추적 UI 플로우

## 개요

사용자가 카카오맵에서 지역을 이동하면:
1. **상단 맵**: 해당 지역의 편의점들이 표시
2. **하단 목록**: 선택된 편의점들의 물품 재고가 실시간 표시
3. **선택/해제**: 맵에서 점포를 선택하거나 해제 가능
4. **계층 표시**: 편의점 브랜드별로 그룹화 (세븐, GS, CU 등)

---

## 화면 구성 (2단 레이아웃)

```
┌─────────────────────────────────────────┐
│ 🗺️  카카오맵 (상단 60%)                 │
│ 현재 위치: 강남구 | 강남역 근처        │
│                                         │
│ 편의점 마커들 (클릭 가능)               │
│ 세븐일레븐 ●●●                        │
│ GS편의점 ●●●                          │
│ CU ●●                                │
│ 이마트 ●                              │
│                                         │
│ [상세보기] [선택/해제]                 │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 📦 물품 재고 (하단 40%)                 │
│                                         │
│ 강남구 (세븐일레븐 3곳, GS 2곳)         │
│                                         │
│ 세븐일레븐                              │
│ ├─ 강남역점 (입고: 2/3)                │
│ │  ✓ 코카콜라                          │
│ │  ✓ 포카칩 고추                       │
│ │  ○ 비타500                          │
│ ├─ 신논현점 (입고: 1/3)                │
│ │  ○ 코카콜라                          │
│ │  ✓ 포카칩 고추                       │
│ │  ○ 비타500                          │
│ └─ 서비스점 (입고: 0/3)                │
│    ○ 코카콜라 ○ 포카칩 ○ 비타500      │
│                                         │
│ GS편의점                                │
│ ├─ 강남역점 (입고: 2/3)                │
│ │  ✓ 코카콜라  ✓ 포카칩  ○ 비타500    │
│ └─ 신논현점 (입고: 1/3)                │
│    ○ 코카콜라  ✓ 포카칩  ○ 비타500    │
│                                         │
│ CU                                     │
│ ┌─ [➕ 추가하기]                       │
└─────────────────────────────────────────┘
```

---

## API 플로우

### 1. 맵 화면 초기 로드

```
사용자: 강남구 지역으로 맵 이동

↓

API: GET /api/map/inventory?user_id=1&region=강남구

응답:
{
  "success": true,
  "data": {
    "region": "강남구",
    "stores_count": 8,
    "products_count": 3,
    
    "products": [
      { "id": 1, "actual_name": "코카콜라" },
      { "id": 2, "actual_name": "포카칩 고추" },
      { "id": 3, "actual_name": "비타500" }
    ],
    
    "store_groups": {
      "seven": {
        "name": "세븐일레븐",
        "stores": [
          {
            "id": 10,
            "name": "강남역점",
            "address": "서울 강남구 테헤란로...",
            "latitude": 37.4979,
            "longitude": 127.0276,
            "inventory": {
              "1": { "is_in_stock": true, "checked_at": "2026-05-18T..." },
              "2": { "is_in_stock": true, "checked_at": "2026-05-18T..." },
              "3": { "is_in_stock": false, "checked_at": "2026-05-18T..." }
            },
            "in_stock_count": 2,
            "total_products": 3
          },
          {
            "id": 11,
            "name": "신논현점",
            "address": "서울 강남구 논현로...",
            "latitude": 37.4963,
            "longitude": 127.0287,
            "inventory": {
              "1": { "is_in_stock": false },
              "2": { "is_in_stock": true },
              "3": { "is_in_stock": false }
            },
            "in_stock_count": 1,
            "total_products": 3
          }
        ]
      },
      "gs": {
        "name": "GS편의점",
        "stores": [
          {
            "id": 20,
            "name": "강남역점",
            ...
          }
        ]
      }
    }
  }
}
```

---

### 2. 맵에서 점포 클릭 → 상세보기

```
사용자: 세븐일레븬 강남역점 클릭

↓

API: GET /api/stores/10?user_id=1

응답:
{
  "success": true,
  "data": {
    "store": {
      "id": 10,
      "name": "세븐일레븐 강남역점",
      "brand": "seven",
      "address": "서울 강남구 테헤란로...",
      "latitude": 37.4979,
      "longitude": 127.0276,
      "region": "강남구",
      "contact": "02-6959-XXXX"
    },
    "inventory": [
      {
        "search_store_id": 1,
        "product_id": 1,
        "actual_name": "코카콜라",
        "convenience_brand": "seven",
        "search_name": "Coca-Cola",
        "is_in_stock": true,
        "price_estimate": 2500,
        "checked_at": "2026-05-18T14:30:00"
      },
      {
        "search_store_id": 2,
        "product_id": 2,
        "actual_name": "포카칩 고추",
        "convenience_brand": "seven",
        "search_name": "포카칩 고추맛",
        "is_in_stock": true,
        "price_estimate": 2000,
        "checked_at": "2026-05-18T14:30:00"
      }
    ],
    "in_stock_count": 2,
    "total_products": 2
  }
}
```

---

### 3. 점포 선택 (찜 추가)

```
사용자: "강남역점에서 비타500도 찾고 싶어"

↓

API: POST /api/map/select-store
{
  "user_id": 1,
  "product_id": 3,  // 비타500
  "store_id": 10,   // 세븐일레븬 강남역점
  "search_name": "비타500"
}

응답:
{
  "success": true,
  "message": "Store selected",
  "data": {
    "id": 101,
    "product_id": 3,
    "convenience_brand": "seven",
    "search_name": "비타500",
    "region": "강남구",
    "is_active": true,
    "created_at": "2026-05-18T14:35:00"
  }
}

↓ (자동)

GET /api/map/inventory?user_id=1&region=강남구 재조회

→ 하단 재고 목록 업데이트 (비타500 추가됨)
```

---

### 4. 점포 해제 (찜 취소)

```
사용자: "강남역점의 비타500 찜 취소"

↓

API: DELETE /api/map/select-store
{
  "data": {
    "user_id": 1,
    "product_id": 3,
    "store_id": 10
  }
}

응답:
{
  "success": true,
  "message": "Store deselected",
  "data": { "id": 101 }
}

↓ (자동)

GET /api/map/inventory 재조회

→ 비타500 제거됨
```

---

### 5. 다른 지역 추가

```
사용자: "강남구" + "서초구"도 함께 추적하고 싶어

↓

1. 서초구로 맵 이동
API: GET /api/map/inventory?user_id=1&region=서초구

응답: 서초구의 편의점들과 재고 표시

2. 서초구 편의점에서 물품 선택
API: POST /api/map/select-store
{
  "user_id": 1,
  "product_id": 1,  // 코카콜라
  "store_id": 30,   // 서초구 이마트
  "search_name": "코카콜라 250ml"
}

↓

3. 필요하면 "강남구 + 서초구" 동시 조회도 가능
API: GET /api/wishlists?user_id=1
→ 모든 지역의 모든 찜 목록 조회
```

---

## 하단 재고 목록 렌더링 로직

```typescript
// 응답 데이터 구조
interface MapInventoryResponse {
  region: string;
  products: Product[];
  store_groups: {
    [brand: string]: {
      name: string;
      stores: {
        id: number;
        name: string;
        inventory: {
          [product_id: number]: {
            is_in_stock: boolean;
            checked_at: string;
          }
        },
        in_stock_count: number;
        total_products: number;
      }[]
    }
  }
}

// 렌더링
render() {
  return (
    <div className="inventory-list">
      <h2>{region}</h2>
      
      {/* 편의점 브랜드별 그룹 */}
      {Object.entries(store_groups).map(([brand, group]) => (
        <section key={brand}>
          <h3>{group.name}</h3>
          
          {/* 각 브랜드의 점포들 */}
          {group.stores.map(store => (
            <details key={store.id} open>
              <summary>
                {store.name} (입고: {store.in_stock_count}/{store.total_products})
              </summary>
              
              {/* 이 점포의 물품 재고 */}
              <ul>
                {products.map(product => {
                  const inv = store.inventory[product.id];
                  return (
                    <li key={product.id}>
                      {inv?.is_in_stock ? '✓' : '○'} {product.actual_name}
                    </li>
                  );
                })}
              </ul>
              
              {/* 선택/해제 버튼 */}
              <button onClick={() => toggleStore(product.id, store.id)}>
                {hasWishlist(product.id, store.id) ? '해제' : '추가'}
              </button>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
```

---

## 성능 최적화

### 1. 캐싱
- 같은 지역의 `/api/map/inventory` 결과 → 로컬 캐시
- 10초 이상 맵이 이동하지 않으면 새로 조회

### 2. 점포 그룹화
- 편의점별 브랜드로 자동 그룹화 (`store_groups`)
- 클라이언트에서 추가 가공 불필요

### 3. 실시간 업데이트
- 점포 선택/해제 → 자동으로 하단 재고 목록 재조회
- WebSocket (추후) 또는 polling으로 실시간 재고 업데이트

---

## 사용자 시나리오

### 시나리오 1: 강남구에서 "에너지음료" 찾기
```
1. 맵을 강남구로 이동
   → 강남구의 모든 편의점 표시 (세븐, GS, CU, 이마트 등)
   
2. 에너지음료 물품이 이미 등록되어 있음
   → 하단에 각 편의점의 재고 표시 (입고/품절)
   
3. "강남역점 세븐에서 찾고 싶다" → 선택
   → 알림 설정: FCM ON, 진동 ON
   
4. 강남역점 세븐에서 입고되면 → 푸시 알림 + 진동
```

### 시나리오 2: "강남구 + 서초구" 동시 추적
```
1. 강남구에서 여러 편의점 선택 후
2. 맵을 서초구로 스크롤
   → 서초구의 편의점들로 자동 전환
   
3. 서초구 편의점에서도 동일 물품 선택 가능
   → GET /api/wishlists로 전체 조회하면 모든 지역이 나옴
```

### 시나리오 3: 새로운 물품 추가
```
1. 맵 화면의 "물품 추가" 버튼 → 물품 등록 모달
2. "포카칩 새우맛" 추가
3. 현재 보는 지역의 모든 점포에서 "포카칩 새우맛" 검색 가능
   → 각 편의점별로 검색명 입력
```

---

## API 요약 (맵 관련)

| 엔드포인트 | 메서드 | 설명 | 호출 시점 |
|-----------|--------|------|---------|
| `/api/map/inventory` | GET | 지역의 점포들 + 재고 조회 | 맵 이동 시 |
| `/api/stores/:id` | GET | 점포 상세정보 + 재고 | 점포 클릭 |
| `/api/map/select-store` | POST | 점포 선택 (찜 추가) | 선택 버튼 클릭 |
| `/api/map/select-store` | DELETE | 점포 해제 (찜 취소) | 해제 버튼 클릭 |
| `/api/wishlists` | GET | 모든 지역 찜 목록 | 찜 관리 화면 |

---

## 추후 개선사항

- [ ] WebSocket으로 실시간 재고 푸시 (30분 → 실시간)
- [ ] 클러스터링: 점포가 너무 많으면 지도에서 숫자로 표시
- [ ] 점포 필터링 (세븐만, GS만, 등등)
- [ ] 즐겨찾는 점포 (별표)
- [ ] 지역 즐겨찾기 저장
