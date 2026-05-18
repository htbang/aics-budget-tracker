import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 편의점별 지역 재고 조회
export async function GET(req: NextRequest) {
  try {
    const searchStoreId = req.nextUrl.searchParams.get('search_store_id');

    if (!searchStoreId) {
      return NextResponse.json(
        { error: 'Missing search_store_id' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT i.id, i.search_store_id, i.store_id, i.is_in_stock, i.price_estimate,
              i.checked_at, i.crawler_source,
              s.name as store_name, s.brand, s.address, s.latitude, s.longitude, s.region,
              ss.convenience_brand, ss.search_name
       FROM inventory i
       JOIN stores s ON i.store_id = s.id
       JOIN search_stores ss ON i.search_store_id = ss.id
       WHERE i.search_store_id = $1
       ORDER BY s.region, s.name;`,
      [parseInt(searchStoreId)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
