import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 맵 화면용: 지역의 점포들 + 사용자의 물품 재고 현황 (한 번에 조회)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    const region = req.nextUrl.searchParams.get('region');

    if (!userId || !region) {
      return NextResponse.json(
        { error: 'Missing user_id or region' },
        { status: 400 }
      );
    }

    // 1. 이 지역의 모든 편의점 조회
    const storesResult = await query(
      `SELECT id, name, brand, address, latitude, longitude, region, contact
       FROM stores
       WHERE region = $1
       ORDER BY brand, name;`,
      [region]
    );

    const stores = storesResult.rows;

    if (stores.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          region,
          stores: [],
          products: [],
          store_groups: [],
        },
      });
    }

    // 2. 사용자가 이 지역에서 추적 중인 물품들 조회
    const productsResult = await query(
      `SELECT DISTINCT p.id, p.actual_name, p.description
       FROM products p
       JOIN search_stores ss ON p.id = ss.product_id
       WHERE p.user_id = $1 AND ss.region = $2 AND ss.is_active = true
       ORDER BY p.actual_name;`,
      [parseInt(userId), region]
    );

    const products = productsResult.rows;

    // 3. 각 점포별로 사용자의 물품 재고 현황 조회
    const inventoryResult = await query(
      `SELECT i.search_store_id, i.store_id, i.is_in_stock, i.price_estimate, i.checked_at,
              ss.product_id, ss.convenience_brand, ss.search_name,
              p.actual_name,
              s.name as store_name, s.brand
       FROM inventory i
       JOIN search_stores ss ON i.search_store_id = ss.id
       JOIN products p ON ss.product_id = p.id
       JOIN stores s ON i.store_id = s.id
       WHERE p.user_id = $1 AND s.region = $2 AND ss.is_active = true
       ORDER BY s.id, p.id;`,
      [parseInt(userId), region]
    );

    // 4. 점포별 재고 그룹화
    const inventoryByStore: {
      [storeId: number]: {
        [productId: number]: {
          is_in_stock: boolean;
          price_estimate?: number;
          checked_at: string;
        };
      };
    } = {};

    for (const inv of inventoryResult.rows) {
      if (!inventoryByStore[inv.store_id]) {
        inventoryByStore[inv.store_id] = {};
      }
      inventoryByStore[inv.store_id][inv.product_id] = {
        is_in_stock: inv.is_in_stock,
        price_estimate: inv.price_estimate,
        checked_at: inv.checked_at,
      };
    }

    // 5. 편의점 브랜드별로 그룹화 (계층 표시용)
    interface StoreGroup {
      [brand: string]: {
        name: string;
        stores: {
          id: number;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          inventory: {
            [productId: number]: {
              is_in_stock: boolean;
              price_estimate?: number;
              checked_at: string;
            };
          };
          in_stock_count: number;
          total_products: number;
        }[];
      };
    }

    const storeGroups: StoreGroup = {};

    for (const store of stores) {
      if (!storeGroups[store.brand]) {
        storeGroups[store.brand] = {
          name: store.brand,
          stores: [],
        };
      }

      const storeInventory = inventoryByStore[store.id] || {};
      const inStockCount = Object.values(storeInventory).filter(
        (inv: any) => inv.is_in_stock
      ).length;

      storeGroups[store.brand].stores.push({
        id: store.id,
        name: store.name,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        inventory: storeInventory,
        in_stock_count: inStockCount,
        total_products: products.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        region,
        stores_count: stores.length,
        products_count: products.length,
        products,
        store_groups: storeGroups,
      },
    });
  } catch (error) {
    console.error('Get map inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
