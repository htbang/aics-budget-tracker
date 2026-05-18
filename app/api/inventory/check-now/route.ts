import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - 수동 재고 갱신 (사용자 요청)
export async function POST(req: NextRequest) {
  try {
    const { user_id, wishlist_id } = await req.json();

    if (!user_id || !wishlist_id) {
      return NextResponse.json(
        { error: 'Missing user_id or wishlist_id' },
        { status: 400 }
      );
    }

    // 찜 항목 조회
    const wishlistResult = await query(
      `SELECT w.id, w.product_id, w.user_id, w.region, p.name, p.brand
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.id = $1 AND w.user_id = $2 AND w.is_active = true;`,
      [wishlist_id, user_id]
    );

    if (wishlistResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    const wishlist = wishlistResult.rows[0];

    // 해당 제품의 현재 재고 상태 조회
    const inventoryResult = await query(
      `SELECT i.id, i.product_id, i.store_id, i.is_in_stock, i.checked_at,
              s.name as store_name, s.brand, s.address, s.region
       FROM inventory i
       JOIN stores s ON i.store_id = s.id
       WHERE i.product_id = $1 ${wishlist.region ? 'AND s.region = $2' : ''}
       ORDER BY s.region, s.name;`,
      wishlist.region ? [wishlist.product_id, wishlist.region] : [wishlist.product_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: wishlist.product_id,
          name: wishlist.name,
          brand: wishlist.brand,
        },
        region: wishlist.region || '전국',
        inventory: inventoryResult.rows,
        in_stock_count: inventoryResult.rows.filter((i: any) => i.is_in_stock).length,
        total_stores: inventoryResult.rows.length,
      },
    });
  } catch (error) {
    console.error('Check inventory now error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
