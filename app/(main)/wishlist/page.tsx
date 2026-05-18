'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { useProducts } from '@/hooks/useProducts';

export default function WishlistPage() {
  const { user } = useAuth();
  const { searchStores, loading, fetchWishlists, deleteWishlist } = useWishlist();
  const { products } = useProducts();
  const [grouped, setGrouped] = useState<any>({});

  useEffect(() => {
    if (user?.uid) {
      fetchWishlists(parseInt(user.uid));
    }
  }, [user?.uid, fetchWishlists]);

  useEffect(() => {
    // 지역별로 그룹화
    const result: any = {};
    searchStores.forEach((store) => {
      if (!result[store.region || '전국']) {
        result[store.region || '전국'] = [];
      }
      result[store.region || '전국'].push(store);
    });
    setGrouped(result);
  }, [searchStores]);

  const handleDelete = async (searchStoreId: number) => {
    if (!user || !confirm('정말 제거하시겠습니까?')) return;
    await deleteWishlist(searchStoreId, parseInt(user.uid));
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.actual_name || `물품 #${productId}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">찜 관리</h1>
        <span className="text-2xl font-bold text-blue-600">{searchStores.length}개</span>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">로드 중...</p>
        </div>
      ) : searchStores.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">아직 찜한 물품이 없습니다.</p>
          <a href="/search" className="btn-primary inline-block">
            물품 추가하기
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([region, stores]: [string, any]) => (
            <section key={region} className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📍 {region}
                <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                  {stores.length}개
                </span>
              </h2>

              <div className="space-y-2">
                {stores.map((store: any) => (
                  <div
                    key={store.id}
                    className="card flex justify-between items-start hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {getProductName(store.product_id)}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {store.convenience_brand}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        검색명: <span className="font-medium">{store.search_name}</span>
                      </p>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            defaultChecked={store.notify_by_fcm}
                            className="rounded"
                          />
                          FCM 알림
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            defaultChecked={store.notify_by_vibrate}
                            className="rounded"
                          />
                          진동
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="btn-secondary text-sm px-3 py-1 text-red-600 hover:bg-red-50 flex-shrink-0"
                    >
                      해제
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
