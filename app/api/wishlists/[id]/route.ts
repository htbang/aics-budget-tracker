import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 찜 항목의 현재 재고 상태
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wishlistId = parseInt(params.id);

    const result = await query(
      `SELECT w.id, w.product_id, w.user_id, w.region,
              COUNT(CASE WHEN i.is_in_stock = true THEN 1 END) as in_stock_count,
              COUNT(*) as total_stores,
              MAX(i.checked_at) as last_checked
       FROM wishlists w
       LEFT JOIN inventory i ON w.product_id = i.product_id
       LEFT JOIN stores s ON i.store_id = s.id
       WHERE w.id = $1
       GROUP BY w.id, w.product_id, w.user_id, w.region;`,
      [wishlistId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    const status = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        is_in_stock_anywhere: status.in_stock_count > 0,
      },
    });
  } catch (error) {
    console.error('Get wishlist status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - 찜 설정 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id, notify_by_fcm, notify_by_vibrate, region } = await req.json();
    const wishlistId = parseInt(params.id);

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE wishlists
       SET notify_by_fcm = COALESCE($1, notify_by_fcm),
           notify_by_vibrate = COALESCE($2, notify_by_vibrate),
           region = COALESCE($3, region),
           created_at = created_at
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, product_id, region, notify_by_fcm, notify_by_vibrate, is_active, created_at;`,
      [
        notify_by_fcm !== undefined ? notify_by_fcm : null,
        notify_by_vibrate !== undefined ? notify_by_vibrate : null,
        region || null,
        wishlistId,
        user_id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update wishlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 찜 제거 (소프트 삭제)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    const wishlistId = parseInt(params.id);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE wishlists
       SET is_active = false
       WHERE id = $1 AND user_id = $2
       RETURNING id;`,
      [wishlistId, parseInt(userId)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Wishlist deleted',
    });
  } catch (error) {
    console.error('Delete wishlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
