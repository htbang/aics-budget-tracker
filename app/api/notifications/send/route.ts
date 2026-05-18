import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - FCM 알림 발송 (내부용, Bearer 토큰 인증)
export async function POST(req: NextRequest) {
  try {
    // 내부 API 호출 인증
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      user_id,
      search_store_id,
      product_name,
      convenience_brand,
      store_name,
    } = await req.json();

    if (!user_id || !search_store_id || !product_name || !store_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 사용자의 FCM 토큰 조회
    const userResult = await query(
      `SELECT id, fcm_token FROM users WHERE id = $1;`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const fcmToken = user.fcm_token;

    if (!fcmToken) {
      return NextResponse.json({
        success: true,
        message: 'User has no FCM token registered',
      });
    }

    // TODO: FCM Admin SDK로 실제 푸시 알림 발송
    // lib/fcm.ts 구현 후 아래 코드 활성화:
    /*
    const messaging = getMessaging();
    const response = await messaging.send({
      token: fcmToken,
      notification: {
        title: '재고 입고! 🎉',
        body: `[${convenience_brand}] ${product_name} - ${store_name}에 입고되었습니다!`,
      },
      webpush: {
        data: {
          search_store_id: search_store_id.toString(),
          product_name: product_name,
          convenience_brand: convenience_brand,
          store_name: store_name,
        },
      },
    });
    */

    // 재고 변경 이력 기록
    const historyResult = await query(
      `INSERT INTO inventory_history (search_store_id, status_after, notified_at, notification_type, fcm_success, created_at)
       VALUES ($1, true, NOW(), 'fcm', true, NOW())
       RETURNING id;`,
      [search_store_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification queued',
      data: {
        history_id: historyResult.rows[0].id,
        fcm_token_found: !!fcmToken,
      },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
