import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - FCM 토큰 저장
export async function POST(req: NextRequest) {
  try {
    const { user_id, fcm_token } = await req.json();

    if (!user_id || !fcm_token) {
      return NextResponse.json(
        { error: 'Missing user_id or fcm_token' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE users
       SET fcm_token = $1
       WHERE id = $2
       RETURNING id, firebase_uid, email, fcm_token;`,
      [fcm_token, user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Save firebase token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
