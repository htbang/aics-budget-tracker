import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 사용자의 편의점별 찜 목록
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
      `SELECT ss.id, ss.product_id, p.actual_name, ss.convenience_brand, ss.search_name,
              ss.region, ss.is_active, ss.notify_by_fcm, ss.notify_by_vibrate,
              ss.last_notified_at, ss.created_at
       FROM search_stores ss
       JOIN products p ON ss.product_id = p.id
       WHERE p.user_id = $1 AND ss.is_active = true
       ORDER BY p.actual_name, ss.convenience_brand;`,
      [parseInt(userId)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get search stores error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 편의점별 찜 추가
export async function POST(req: NextRequest) {
  try {
    const { user_id, product_id, convenience_brand, search_name, region, notify_by_fcm, notify_by_vibrate } = await req.json();

    if (!user_id || !product_id || !convenience_brand || !search_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // product 소유 확인
    const productCheck = await query(
      `SELECT id FROM products WHERE id = $1 AND user_id = $2;`,
      [product_id, user_id]
    );

    if (productCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found or not owned by user' },
        { status: 404 }
      );
    }

    const result = await query(
      `INSERT INTO search_stores (product_id, convenience_brand, search_name, region, notify_by_fcm, notify_by_vibrate, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING id, product_id, convenience_brand, search_name, region, notify_by_fcm, notify_by_vibrate, created_at;`,
      [product_id, convenience_brand, search_name, region || null, notify_by_fcm !== false, notify_by_vibrate !== false]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create search store error:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This convenience store variant already exists for this product and region' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
