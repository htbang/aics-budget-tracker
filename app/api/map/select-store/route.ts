import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - 맵에서 점포 선택 (search_store 생성/활성화)
export async function POST(req: NextRequest) {
  try {
    const { user_id, product_id, store_id, search_name } = await req.json();

    if (!user_id || !product_id || !store_id || !search_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // store의 편의점 브랜드와 지역 조회
    const storeResult = await query(
      `SELECT brand, region FROM stores WHERE id = $1;`,
      [store_id]
    );

    if (storeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const store = storeResult.rows[0];

    // search_store 생성 또는 업데이트
    const result = await query(
      `INSERT INTO search_stores (product_id, convenience_brand, search_name, region, is_active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (product_id, convenience_brand, region)
       DO UPDATE SET is_active = true, search_name = $3
       RETURNING id, product_id, convenience_brand, search_name, region, is_active, created_at;`,
      [product_id, store.brand, search_name, store.region]
    );

    return NextResponse.json({
      success: true,
      message: 'Store selected',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Select store error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 맵에서 점포 해제 (search_store 비활성화)
export async function DELETE(req: NextRequest) {
  try {
    const { user_id, product_id, store_id } = JSON.parse(
      req.nextUrl.searchParams.get('data') || '{}'
    );

    if (!user_id || !product_id || !store_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // store의 편의점 브랜드와 지역 조회
    const storeResult = await query(
      `SELECT brand, region FROM stores WHERE id = $1;`,
      [store_id]
    );

    if (storeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const store = storeResult.rows[0];

    // 소유권 확인
    const ownerCheck = await query(
      `SELECT ss.id FROM search_stores ss
       JOIN products p ON ss.product_id = p.id
       WHERE ss.product_id = $1 AND p.user_id = $2
         AND ss.convenience_brand = $3 AND ss.region = $4;`,
      [product_id, user_id, store.brand, store.region]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 404 }
      );
    }

    // search_store 비활성화
    const result = await query(
      `UPDATE search_stores
       SET is_active = false
       WHERE product_id = $1 AND convenience_brand = $2 AND region = $3
       RETURNING id;`,
      [product_id, store.brand, store.region]
    );

    return NextResponse.json({
      success: true,
      message: 'Store deselected',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Deselect store error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
