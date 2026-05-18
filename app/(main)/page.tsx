'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useWishlist } from '@/hooks/useWishlist';

export default function HomePage() {
  const { user } = useAuth();
  const { products, fetchProducts: getProducts } = useProducts();
  const { searchStores, fetchWishlists } = useWishlist();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWishlists: 0,
    inStockCount: 0,
  });

  useEffect(() => {
    if (user?.uid) {
      getProducts(parseInt(user.uid));
      fetchWishlists(parseInt(user.uid));
    }
  }, [user?.uid, getProducts, fetchWishlists]);

  useEffect(() => {
    setStats({
      totalProducts: products.length,
      totalWishlists: searchStores.length,
      inStockCount: 0, // TODO: 실제 재고 조회
    });
  }, [products, searchStores]);

  return (
    <div className="space-y-8">
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          환영합니다, {user?.displayName || '사용자'}님!
        </h1>
        <p className="text-blue-100">
          편의점의 물품을 추적하고 실시간으로 재고를 확인하세요.
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-gray-600 text-sm font-medium mb-1">등록된 물품</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
          <p className="text-gray-500 text-xs mt-2">개</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 text-sm font-medium mb-1">추적 중인 찜</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {stats.totalWishlists}
          </p>
          <p className="text-gray-500 text-xs mt-2">개</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 text-sm font-medium mb-1">입고된 물품</h3>
          <p className="text-3xl font-bold text-green-600">{stats.inStockCount}</p>
          <p className="text-gray-500 text-xs mt-2">개</p>
        </div>
      </div>

      {/* 찜 목록 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">내 찜 목록</h2>
          <a
            href="/wishlist"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            전체 보기 →
          </a>
        </div>

        {searchStores.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">아직 찜한 물품이 없습니다.</p>
            <a
              href="/search"
              className="btn-primary inline-block"
            >
              물품 추가하기
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchStores.slice(0, 6).map((store) => (
              <div key={store.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {store.product_id} {/* TODO: 물품명으로 표시 */}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {store.convenience_brand}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  검색명: {store.search_name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  지역: {store.region || '전국'}
                </p>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs flex-1">
                    상세보기
                  </button>
                  <button className="btn-secondary text-xs flex-1">
                    해제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 빠른 링크 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">시작하기</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/search"
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">📦 물품 추가</h3>
            <p className="text-gray-600 text-sm">
              새로운 물품을 등록하고 편의점별로 추적하세요.
            </p>
          </a>
          <a
            href="/map"
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">🗺️ 지도 보기</h3>
            <p className="text-gray-600 text-sm">
              지역별 편의점을 선택하고 재고를 확인하세요.
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}
