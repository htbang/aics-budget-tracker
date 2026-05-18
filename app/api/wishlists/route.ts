import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 사용자의 찜 목록
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT w.id, w.user_id, w.product_id, p.name, p.brand, w.region,
              w.is_active, w.notify_by_fcm, w.notify_by_vibrate, w.last_notified_at,
              w.created_at
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1 AND w.is_active = true
       ORDER BY w.created_at DESC;`,
      [parseInt(userId)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get wishlists error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 새 찜 추가
export async function POST(req: NextRequest) {
  try {
    const { user_id, product_id, region, notify_by_fcm, notify_by_vibrate } = await req.json();

    if (!user_id || !product_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO wishlists (user_id, product_id, region, notify_by_fcm, notify_by_vibrate, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, user_id, product_id, region, is_active, notify_by_fcm, notify_by_vibrate, created_at;`,
      [user_id, product_id, region || null, notify_by_fcm !== false, notify_by_vibrate !== false]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create wishlist error:', error);

    // UNIQUE 제약 위반 (중복)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Wishlist already exists for this product and region' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
