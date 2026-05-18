import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT - 제품 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id, actual_name, description } = await req.json();
    const productId = parseInt(params.id);

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE products
       SET actual_name = COALESCE($1, actual_name),
           description = COALESCE($2, description),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, actual_name, description, is_active, created_at, updated_at;`,
      [actual_name || null, description || null, productId, user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 제품 삭제 (소프트 삭제)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    const productId = parseInt(params.id);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE products
       SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id;`,
      [productId, parseInt(userId)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
