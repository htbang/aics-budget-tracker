# 편의점 재고 조회 (Convenience Stock)

편의점 체인(세븐일레븐, GS편의점, CU, 이마트, 롯데마트)에서 원하는 물품의 실시간 재고를 조회하고, 입고 시 **푸시 알림 + 진동**으로 알림받는 서비스입니다.

## 주요 기능

✅ **멀티 편의점 지원** — 세븐일레븐, GS, CU, 이마트, 롯데마트
✅ **자동 재고 확인** — 30분마다 자동 갱신 (Vercel Cron)
✅ **푸시 알림** — 휴대폰 꺼져있어도 수신 (Firebase Cloud Messaging)
✅ **진동 알림** — 모바일 Vibration API 지원
✅ **지역 선택** — 카카오맵 기반 점포 검색
✅ **찜 기능** — 관심 물품 저장 및 관리
✅ **실시간 동기화** — 여러 기기 간 자동 동기화

## 기술 스택

- **프론트엔드**: Next.js 15 + React 18 + TypeScript
- **백엔드**: Next.js API Routes
- **데이터베이스**: PostgreSQL @ Neon
- **인증**: Firebase Authentication
- **알림**: Firebase Cloud Messaging (FCM)
- **지도**: 카카오맵 API
- **배포**: Vercel
- **크롤링**: Playwright

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- PostgreSQL 연결 정보 (DATABASE_URL)
- Firebase 프로젝트 (aics-worksho-c390c)
- 카카오맵 API 키

### 설치

```bash
# 저장소 복제
git clone <repository-url>
cd convenience-stock

# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일에 실제 값 입력

# 데이터베이스 마이그레이션
npm run db:migrate

# 개발 서버 실행
npm run dev
```

### 개발 중 테스트

```bash
# 로컬 개발 서버 실행
npm run dev

# 빌드 및 프로덕션 시뮬레이션
npm run build
npm start
```

## 환경변수 설정

`.env.local` 파일을 생성하고 다음 정보를 입력하세요:

```bash
# Firebase (클라이언트)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aics-worksho-c390c
# ... 기타 Firebase 설정

# PostgreSQL
DATABASE_URL=postgresql://...

# Firebase Admin SDK (서버)
FIREBASE_ADMIN_SDK_KEY={"type":"service_account",...}

# Vercel Cron 인증
CRON_SECRET=your-secret-key

# 카카오맵 API
NEXT_PUBLIC_KAKAO_MAP_API_KEY=...

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 배포 (Vercel)

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# Vercel Dashboard에서 환경변수 설정:
# - DATABASE_URL
# - FIREBASE_ADMIN_SDK_KEY
# - CRON_SECRET
```

## API 엔드포인트

### 인증
- `POST /api/auth/sync` — Firebase UID 동기화

### 제품
- `GET /api/products?user_id=:uid` — 제품 목록
- `POST /api/products` — 제품 추가
- `PUT /api/products/:id` — 제품 수정
- `DELETE /api/products/:id` — 제품 삭제

### 찜 목록
- `GET /api/wishlists?user_id=:uid` — 찜 목록
- `POST /api/wishlists` — 찜 추가
- `PUT /api/wishlists/:id` — 찜 수정
- `DELETE /api/wishlists/:id` — 찜 제거
- `GET /api/wishlists/:id/status` — 재고 상태 조회

### 재고
- `GET /api/inventory?product_id=:pid&region=:region` — 재고 조회
- `POST /api/inventory/check-now` — 수동 재고 갱신

### 점포
- `GET /api/stores?region=:region` — 지역별 점포 검색
- `GET /api/stores?lat=:lat&lng=:lng&radius=1000` — 좌표 기반 검색

### 알림
- `POST /api/firebase-token` — FCM 토큰 저장
- `POST /api/notifications/send` — 알림 발송

### Cron
- `GET /api/cron/check-inventory` — 30분마다 자동 실행

## 프로젝트 구조

```
app/
├── (auth)/          # 로그인, 회원가입
├── (main)/          # 메인 영역 (찜 목록, 검색, 지도, 관리)
└── api/             # API Routes
components/         # 재사용 가능한 UI 컴포넌트
hooks/              # React 커스텀 훅
lib/                # 유틸리티 및 설정
├── db.ts            # PostgreSQL 연결
├── firebase.ts      # Firebase 초기화
├── fcm.ts           # FCM 통합
└── crawlers/        # 편의점 크롤러
types/              # TypeScript 타입
constants/          # 상수 (지역, 브랜드, 메시지)
styles/             # 전역 스타일 (Tailwind)
public/             # 정적 자산
```

## 아키텍처 설계 원칙

### 컴포넌트 분리
- **단일 책임**: 각 컴포넌트는 하나의 역할만 수행
- **Props 기반 커스터마이징**: 색상, 크기, 상태 등을 props로 제어
- **스타일 중앙화**: CSS 변수로 일관된 디자인 유지

### 토큰 효율성
UI 변경 시 최소한의 파일만 수정하도록 설계:
- **색상 변경** → `styles/globals.css` 수정
- **레이아웃 변경** → 해당 컴포넌트만 수정
- **메시지 변경** → `constants/messages.ts` 수정

자세한 구조 가이드는 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) 참조

## 크롤러 구현 순서

1. ✅ **세븐일레븐** (`lib/crawlers/seven-eleven.ts`)
2. ⏳ **GS편의점** (`lib/crawlers/gs.ts`)
3. ⏳ **CU** (`lib/crawlers/cu.ts`)
4. ⏳ **이마트** (`lib/crawlers/emart.ts`)
5. ⏳ **롯데마트** (`lib/crawlers/lotte.ts`)

## 트러블슈팅

### FCM 알림이 수신되지 않음
1. Firebase 프로젝트에서 FCM 활성화 확인
2. 브라우저의 알림 권한 확인
3. Service Worker 등록 확인 (DevTools → Application → Service Workers)
4. `FIREBASE_ADMIN_SDK_KEY` 환경변수 확인

### 데이터베이스 연결 오류
1. `DATABASE_URL` 확인 (psql로 테스트)
2. Neon 대시보드에서 연결 풀 설정 확인
3. 방화벽 규칙 확인

### 크롤러 차단
- 403/429 오류 발생 시 프록시 추가 필요
- `vercel.json`에서 타임아웃 설정 확인

## 성능 최적화

- **Cron 작업**: 30분마다 자동 실행 (과도한 스크래핑 방지)
- **Playwright 풀링**: 여러 요청 병렬 처리 가능하도록 설계
- **데이터베이스 인덱스**: 자주 조회하는 필드에 인덱스 추가
- **Service Worker**: 푸시 알림 백그라운드 처리

## 라이센스

MIT

## 문의

htbang@example.com
