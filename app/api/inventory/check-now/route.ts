import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - 수동 재고 갱신 (편의점별)
export async function POST(req: NextRequest) {
  try {
    const { user_id, search_store_id } = await req.json();

    if (!user_id || !search_store_id) {
      return NextResponse.json(
        { error: 'Missing user_id or search_store_id' },
        { status: 400 }
      );
    }

    // 편의점별 찜 항목 조회 (소유권 확인)
    const searchStoreResult = await query(
      `SELECT ss.id, ss.product_id, ss.convenience_brand, ss.search_name, ss.region,
              p.actual_name
       FROM search_stores ss
       JOIN products p ON ss.product_id = p.id
       WHERE ss.id = $1 AND p.user_id = $2 AND ss.is_active = true;`,
      [search_store_id, user_id]
    );

    if (searchStoreResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Search store not found' },
        { status: 404 }
      );
    }

    const searchStore = searchStoreResult.rows[0];

    // 해당 편의점의 현재 재고 상태 조회
    const inventoryResult = await query(
      `SELECT i.id, i.search_store_id, i.store_id, i.is_in_stock, i.checked_at,
              s.name as store_name, s.brand, s.address, s.region
       FROM inventory i
       JOIN stores s ON i.store_id = s.id
       WHERE i.search_store_id = $1 ${searchStore.region ? 'AND s.region = $2' : ''}
       ORDER BY s.region, s.name;`,
      searchStore.region
        ? [search_store_id, searchStore.region]
        : [search_store_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: searchStore.product_id,
          name: searchStore.actual_name,
          search_name: searchStore.search_name,
        },
        convenience_brand: searchStore.convenience_brand,
        region: searchStore.region || '전국',
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
