import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 편의점별 찜 항목의 현재 재고 상태
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchStoreId = parseInt(params.id);

    const result = await query(
      `SELECT ss.id, ss.product_id, ss.convenience_brand, ss.search_name, ss.region,
              COUNT(CASE WHEN i.is_in_stock = true THEN 1 END) as in_stock_count,
              COUNT(*) as total_stores,
              MAX(i.checked_at) as last_checked
       FROM search_stores ss
       LEFT JOIN inventory i ON ss.id = i.search_store_id
       WHERE ss.id = $1
       GROUP BY ss.id, ss.product_id, ss.convenience_brand, ss.search_name, ss.region;`,
      [searchStoreId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Search store not found' },
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
    console.error('Get search store status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - 편의점별 찜 설정 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id, notify_by_fcm, notify_by_vibrate, search_name } = await req.json();
    const searchStoreId = parseInt(params.id);

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // product 소유 확인
    const ownerCheck = await query(
      `SELECT ss.id FROM search_stores ss
       JOIN products p ON ss.product_id = p.id
       WHERE ss.id = $1 AND p.user_id = $2;`,
      [searchStoreId, user_id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Search store not found or not owned by user' },
        { status: 404 }
      );
    }

    const result = await query(
      `UPDATE search_stores
       SET notify_by_fcm = COALESCE($1, notify_by_fcm),
           notify_by_vibrate = COALESCE($2, notify_by_vibrate),
           search_name = COALESCE($3, search_name)
       WHERE id = $4
       RETURNING id, product_id, convenience_brand, search_name, region, notify_by_fcm, notify_by_vibrate, is_active, created_at;`,
      [
        notify_by_fcm !== undefined ? notify_by_fcm : null,
        notify_by_vibrate !== undefined ? notify_by_vibrate : null,
        search_name || null,
        searchStoreId,
      ]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update search store error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 편의점별 찜 제거 (소프트 삭제)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    const searchStoreId = parseInt(params.id);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // 소유권 확인
    const ownerCheck = await query(
      `SELECT ss.id FROM search_stores ss
       JOIN products p ON ss.product_id = p.id
       WHERE ss.id = $1 AND p.user_id = $2;`,
      [searchStoreId, parseInt(userId)]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Search store not found' },
        { status: 404 }
      );
    }

    const result = await query(
      `UPDATE search_stores
       SET is_active = false
       WHERE id = $1
       RETURNING id;`,
      [searchStoreId]
    );

    return NextResponse.json({
      success: true,
      message: 'Search store removed',
    });
  } catch (error) {
    console.error('Delete search store error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
