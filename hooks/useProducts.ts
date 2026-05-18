import { useState, useCallback } from 'react';
import { Product, APIResponse } from '@/types/index';

export function useProducts(userId?: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products?user_id=${id}`);
      const data: APIResponse<Product[]> = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      } else {
        setError(data.error || '물품 조회 실패');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(
    async (userId: number, actualName: string, description?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, actual_name: actualName, description }),
        });
        const data: APIResponse<Product> = await response.json();
        if (data.success && data.data) {
          setProducts((prev) => [data.data!, ...prev]);
          return data.data;
        } else {
          setError(data.error || '물품 추가 실패');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateProduct = useCallback(
    async (productId: number, userId: number, actualName?: string, description?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            actual_name: actualName,
            description,
          }),
        });
        const data: APIResponse<Product> = await response.json();
        if (data.success && data.data) {
          setProducts((prev) =>
            prev.map((p) => (p.id === productId ? data.data! : p))
          );
          return data.data;
        } else {
          setError(data.error || '물품 수정 실패');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteProduct = useCallback(
    async (productId: number, userId: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${productId}?user_id=${userId}`, {
          method: 'DELETE',
        });
        const data: APIResponse<void> = await response.json();
        if (data.success) {
          setProducts((prev) => prev.filter((p) => p.id !== productId));
        } else {
          setError(data.error || '물품 삭제 실패');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
