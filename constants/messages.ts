export const MESSAGES = {
  // Success
  WISHLIST_ADDED: '찜 목록에 추가했습니다',
  WISHLIST_REMOVED: '찜 목록에서 제거했습니다',
  PRODUCT_ADDED: '물품이 추가되었습니다',
  PRODUCT_UPDATED: '물품이 수정되었습니다',
  PRODUCT_DELETED: '물품이 삭제되었습니다',
  NOTIFICATION_ENABLED: '알림이 활성화되었습니다',
  NOTIFICATION_DISABLED: '알림이 비활성화되었습니다',

  // Inventory Status
  IN_STOCK: '입고됨',
  OUT_OF_STOCK: '품절',
  NO_DATA: '재고 정보 없음',

  // Errors
  MISSING_REQUIRED_FIELDS: '필수 입력 항목이 누락되었습니다',
  PRODUCT_ALREADY_EXISTS: '이미 등록된 물품입니다',
  PRODUCT_NOT_FOUND: '물품을 찾을 수 없습니다',
  WISHLIST_NOT_FOUND: '찜 항목을 찾을 수 없습니다',
  UNAUTHORIZED: '권한이 없습니다',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다',

  // FCM & Notifications
  ENABLE_NOTIFICATIONS: '알림을 활성화하시겠습니까?',
  NOTIFICATION_PERMISSION_DENIED: '알림 권한을 거부했습니다',
  FCM_TOKEN_SAVED: 'FCM 토큰이 저장되었습니다',

  // Loading & Actions
  LOADING: '로드 중...',
  CHECKING_INVENTORY: '재고 확인 중...',
  SAVING: '저장 중...',
  DELETING: '삭제 중...',
} as const;
