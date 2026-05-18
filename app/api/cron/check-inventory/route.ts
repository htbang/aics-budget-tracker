import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Vercel Cron (30분 간격 재고 체크)
export async function GET(req: NextRequest) {
  try {
    // Cron 인증
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 활성 편의점별 찜 목록 조회
    const searchStoresResult = await query(
      `SELECT ss.id, ss.product_id, ss.convenience_brand, ss.search_name, ss.region,
              ss.notify_by_fcm, ss.notify_by_vibrate,
              p.actual_name,
              u.id as user_id, u.fcm_token
       FROM search_stores ss
       JOIN products p ON ss.product_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE ss.is_active = true
       ORDER BY ss.id;`,
      []
    );

    const searchStores = searchStoresResult.rows;

    if (searchStores.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active search stores to check',
        checked_count: 0,
      });
    }

    let checkedCount = 0;
    let notificationsSent = 0;
    const errors: any[] = [];

    // 각 편의점별 찜 항목 처리
    for (const searchStore of searchStores) {
      try {
        // TODO: 크롤러 실행 (lib/crawlers를 통해 편의점별로 search_name으로 검색)
        // 예: SevenElevenCrawler.crawl(searchStore.search_name, searchStore.region)
        // 임시로 기존 inventory 데이터 사용

        // 현재 재고 상태 조회
        const currentInventoryResult = await query(
          `SELECT i.id, i.search_store_id, i.store_id, i.is_in_stock, s.name as store_name
           FROM inventory i
           JOIN stores s ON i.store_id = s.id
           WHERE i.search_store_id = $1 ${searchStore.region ? 'AND s.region = $2' : ''}
           ORDER BY s.name;`,
          searchStore.region
            ? [searchStore.id, searchStore.region]
            : [searchStore.id]
        );

        const currentStocks = currentInventoryResult.rows;

        // 각 점포별 재고 변화 확인
        for (const stock of currentStocks) {
          // 이전 상태 조회
          const historyResult = await query(
            `SELECT status_after FROM inventory_history
             WHERE search_store_id = $1 AND store_id = $2
             ORDER BY created_at DESC
             LIMIT 1;`,
            [searchStore.id, stock.store_id]
          );

          const previousStatus =
            historyResult.rows.length > 0 ? historyResult.rows[0].status_after : null;
          const currentStatus = stock.is_in_stock;

          // 상태 변화 감지 (false → true: 입고!)
          if (previousStatus === false && currentStatus === true) {
            // 이력 저장
            await query(
              `INSERT INTO inventory_history
               (search_store_id, store_id, status_before, status_after, notified_at, notification_type, fcm_success, created_at)
               VALUES ($1, $2, $3, $4, NOW(), 'fcm', true, NOW());`,
              [searchStore.id, stock.store_id, previousStatus, currentStatus]
            );

            // 알림 발송 (FCM + Vibrate)
            if (searchStore.notify_by_fcm && searchStore.fcm_token) {
              console.log(
                `FCM 알림: [${searchStore.convenience_brand}] ${searchStore.actual_name} (${searchStore.search_name}) - ${stock.store_name}에 입고됨`
              );
              notificationsSent++;
            }

            // last_notified_at 업데이트
            if (searchStore.notify_by_vibrate) {
              await query(
                `UPDATE search_stores SET last_notified_at = NOW() WHERE id = $1;`,
                [searchStore.id]
              );
            }
          }
        }

        checkedCount++;
      } catch (error) {
        console.error(`Error checking search store ${searchStore.id}:`, error);
        errors.push({
          search_store_id: searchStore.id,
          convenience_brand: searchStore.convenience_brand,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory check completed',
      checked_count: checkedCount,
      notifications_sent: notificationsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron check-inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
