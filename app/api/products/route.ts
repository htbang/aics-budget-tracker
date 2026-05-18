import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 사용자의 제품 목록
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
      `SELECT id, user_id, actual_name, description, is_active, created_at, updated_at
       FROM products
       WHERE user_id = $1 AND is_active = true
       ORDER BY updated_at DESC;`,
      [parseInt(userId)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 새 제품 추가
export async function POST(req: NextRequest) {
  try {
    const { user_id, actual_name, description } = await req.json();

    if (!user_id || !actual_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO products (user_id, actual_name, description, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW())
       RETURNING id, user_id, actual_name, description, is_active, created_at, updated_at;`,
      [user_id, actual_name, description || null]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create product error:', error);

    // UNIQUE 제약 위반 (중복)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Product already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
