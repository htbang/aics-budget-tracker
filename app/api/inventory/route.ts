import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 지역별/점포별 재고 조회
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('product_id');
    const region = req.nextUrl.searchParams.get('region');

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing product_id' },
        { status: 400 }
      );
    }

    let sqlQuery = `
      SELECT i.id, i.product_id, i.store_id, i.is_in_stock, i.price_estimate,
             i.checked_at, i.crawler_source,
             s.name as store_name, s.brand, s.address, s.latitude, s.longitude, s.region
      FROM inventory i
      JOIN stores s ON i.store_id = s.id
      WHERE i.product_id = $1
    `;
    const params: any[] = [parseInt(productId)];

    if (region) {
      sqlQuery += ` AND s.region = $2`;
      params.push(region);
    }

    sqlQuery += ` ORDER BY s.region, s.name`;

    const result = await query(sqlQuery, params);

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
