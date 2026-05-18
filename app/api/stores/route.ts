import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 카카오맵 기반 점포 검색 (지역/좌표 기반)
export async function GET(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get('region');
    const latitude = req.nextUrl.searchParams.get('lat');
    const longitude = req.nextUrl.searchParams.get('lng');
    const radius = req.nextUrl.searchParams.get('radius') || '1000'; // 기본 1km

    if (!region && !latitude) {
      return NextResponse.json(
        { error: 'Missing region or lat/lng' },
        { status: 400 }
      );
    }

    let sqlQuery = `
      SELECT id, name, brand, address, latitude, longitude, region, contact, created_at
      FROM stores
    `;
    const params: any[] = [];

    if (region) {
      sqlQuery += `WHERE region = $1`;
      params.push(region);
    } else if (latitude && longitude) {
      const radiusKm = parseInt(radius) / 1000;
      sqlQuery += `
        WHERE (
          6371 * acos(
            cos(radians($1::float)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2::float)) +
            sin(radians($1::float)) *
            sin(radians(latitude))
          )
        ) <= $3
      `;
      params.push(latitude, longitude, radiusKm);
    }

    sqlQuery += ` ORDER BY name`;

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get stores error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
