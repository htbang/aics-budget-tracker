'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';

export default function SearchPage() {
  const { user } = useAuth();
  const { products, loading, error, addProduct } = useProducts();
  const [actualName, setActualName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !actualName) return;

    setSubmitting(true);
    try {
      await addProduct(parseInt(user.uid), actualName, description);
      setActualName('');
      setDescription('');
      setSuccessMessage('물품이 추가되었습니다!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 추가 폼 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">물품 추가</h1>

        <form onSubmit={handleAddProduct} className="space-y-4">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              물품명 *
            </label>
            <input
              type="text"
              value={actualName}
              onChange={(e) => setActualName(e.target.value)}
              placeholder="예: 코카콜라, 포카칩 고추맛"
              className="input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              사용자가 정의한 물품의 실제 이름입니다. 편의점별로 검색명을 다르게 설정할 수 있습니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택사항)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 빨간 병, 음료수 등"
              className="input min-h-24"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading || !actualName}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '추가 중...' : '물품 추가'}
          </button>
        </form>
      </section>

      {/* 등록된 물품 목록 */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          등록된 물품 ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">등록된 물품이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="card flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {product.actual_name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {product.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    등록일: {new Date(product.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-sm px-3 py-1">
                    편집
                  </button>
                  <button className="btn-secondary text-sm px-3 py-1 text-red-600 hover:bg-red-50">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 안내 */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 다음 단계</h3>
        <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
          <li>물품을 추가한 후</li>
          <li>지도에서 지역을 선택하고</li>
          <li>편의점별로 검색할 이름을 설정하세요</li>
          <li>입고되면 푸시 알림을 받습니다!</li>
        </ol>
      </section>
    </div>
  );
}
