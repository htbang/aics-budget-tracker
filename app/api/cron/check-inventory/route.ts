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

    // 활성 찜 목록 조회
    const wishlistsResult = await query(
      `SELECT DISTINCT w.id, w.user_id, w.product_id, w.region,
              w.notify_by_fcm, w.notify_by_vibrate,
              p.name as product_name, p.brand,
              u.fcm_token
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       JOIN users u ON w.user_id = u.id
       WHERE w.is_active = true
       ORDER BY w.id;`,
      []
    );

    const wishlists = wishlistsResult.rows;

    if (wishlists.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active wishlists to check',
        checked_count: 0,
      });
    }

    let checkedCount = 0;
    let notificationsSent = 0;
    const errors: any[] = [];

    // 각 찜 항목 처리
    for (const wishlist of wishlists) {
      try {
        // TODO: 크롤러 실행 (lib/crawlers를 통해 편의점별 재고 확인)
        // 임시로 기존 inventory 데이터 사용

        // 현재 재고 상태 조회
        const currentInventoryResult = await query(
          `SELECT id, product_id, store_id, is_in_stock, store_name, store_brand
           FROM (
             SELECT i.id, i.product_id, i.store_id, i.is_in_stock,
                    s.name as store_name, s.brand as store_brand
             FROM inventory i
             JOIN stores s ON i.store_id = s.id
             WHERE i.product_id = $1 ${wishlist.region ? 'AND s.region = $2' : ''}
           ) subquery;`,
          wishlist.region
            ? [wishlist.product_id, wishlist.region]
            : [wishlist.product_id]
        );

        const currentStocks = currentInventoryResult.rows;

        // 각 점포별 재고 변화 확인
        for (const stock of currentStocks) {
          // 이전 상태 조회
          const historyResult = await query(
            `SELECT status_after FROM inventory_history
             WHERE wishlist_id = $1 AND store_id = $2
             ORDER BY created_at DESC
             LIMIT 1;`,
            [wishlist.id, stock.store_id]
          );

          const previousStatus =
            historyResult.rows.length > 0 ? historyResult.rows[0].status_after : null;
          const currentStatus = stock.is_in_stock;

          // 상태 변화 감지 (false → true: 입고!)
          if (previousStatus === false && currentStatus === true) {
            // 이력 저장
            await query(
              `INSERT INTO inventory_history
               (wishlist_id, product_id, store_id, status_before, status_after, notified_at, notification_type, fcm_success, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW(), 'fcm', true, NOW());`,
              [wishlist.id, wishlist.product_id, stock.store_id, previousStatus, currentStatus]
            );

            // 알림 발송 (FCM + Vibrate)
            if (wishlist.notify_by_fcm && wishlist.fcm_token) {
              // TODO: lib/fcm.ts 구현 후 실제 FCM 발송
              console.log(
                `FCM 알림: ${wishlist.product_name} - ${stock.store_name}에 입고됨`
              );
              notificationsSent++;
            }

            // Vibrate 정보 저장 (클라이언트에서 처리)
            if (wishlist.notify_by_vibrate) {
              await query(
                `UPDATE wishlists SET last_notified_at = NOW() WHERE id = $1;`,
                [wishlist.id]
              );
            }
          }
        }

        checkedCount++;
      } catch (error) {
        console.error(`Error checking wishlist ${wishlist.id}:`, error);
        errors.push({
          wishlist_id: wishlist.id,
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
