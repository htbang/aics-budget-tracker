import { useState, useCallback } from 'react';
import { SearchStore, APIResponse } from '@/types/index';

export function useWishlist(userId?: number) {
  const [searchStores, setSearchStores] = useState<SearchStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlists = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/wishlists?user_id=${id}`);
      const data: APIResponse<SearchStore[]> = await response.json();
      if (data.success) {
        setSearchStores(data.data || []);
      } else {
        setError(data.error || '찜 목록 조회 실패');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addWishlist = useCallback(
    async (
      userId: number,
      productId: number,
      convenienceBrand: string,
      searchName: string,
      region?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/wishlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            product_id: productId,
            convenience_brand: convenienceBrand,
            search_name: searchName,
            region: region || null,
            notify_by_fcm: true,
            notify_by_vibrate: true,
          }),
        });
        const data: APIResponse<SearchStore> = await response.json();
        if (data.success && data.data) {
          setSearchStores((prev) => [data.data!, ...prev]);
          return data.data;
        } else {
          setError(data.error || '찜 추가 실패');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateWishlist = useCallback(
    async (
      searchStoreId: number,
      userId: number,
      updates: Partial<SearchStore>
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/wishlists/${searchStoreId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            notify_by_fcm: updates.notify_by_fcm,
            notify_by_vibrate: updates.notify_by_vibrate,
            search_name: updates.search_name,
          }),
        });
        const data: APIResponse<SearchStore> = await response.json();
        if (data.success && data.data) {
          setSearchStores((prev) =>
            prev.map((s) => (s.id === searchStoreId ? data.data! : s))
          );
          return data.data;
        } else {
          setError(data.error || '찜 수정 실패');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteWishlist = useCallback(
    async (searchStoreId: number, userId: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/wishlists/${searchStoreId}?user_id=${userId}`,
          {
            method: 'DELETE',
          }
        );
        const data: APIResponse<void> = await response.json();
        if (data.success) {
          setSearchStores((prev) => prev.filter((s) => s.id !== searchStoreId));
        } else {
          setError(data.error || '찜 제거 실패');
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
    searchStores,
    loading,
    error,
    fetchWishlists,
    addWishlist,
    updateWishlist,
    deleteWishlist,
  };
}
