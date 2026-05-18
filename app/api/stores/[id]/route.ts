import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 특정 점포의 상세 정보 + 해당 점포의 재고 현황
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = parseInt(params.id);
    const userId = req.nextUrl.searchParams.get('user_id');

    // 점포 기본 정보
    const storeResult = await query(
      `SELECT id, name, brand, address, latitude, longitude, region, contact
       FROM stores
       WHERE id = $1;`,
      [storeId]
    );

    if (storeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const store = storeResult.rows[0];

    // 이 점포의 재고 현황 (사용자가 추적 중인 물품만)
    let inventory = [];
    if (userId) {
      const inventoryResult = await query(
        `SELECT ss.id as search_store_id, ss.product_id, p.actual_name, ss.convenience_brand,
                ss.search_name, i.is_in_stock, i.price_estimate, i.checked_at
         FROM search_stores ss
         JOIN products p ON ss.product_id = p.id
         LEFT JOIN inventory i ON ss.id = i.search_store_id AND i.store_id = $1
         WHERE p.user_id = $2
           AND ss.convenience_brand = $3
           AND ss.region = $4
           AND ss.is_active = true
         ORDER BY p.actual_name;`,
        [storeId, parseInt(userId), store.brand, store.region]
      );
      inventory = inventoryResult.rows;
    }

    return NextResponse.json({
      success: true,
      data: {
        store,
        inventory,
        in_stock_count: inventory.filter((i: any) => i.is_in_stock).length,
        total_products: inventory.length,
      },
    });
  } catch (error) {
    console.error('Get store detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
