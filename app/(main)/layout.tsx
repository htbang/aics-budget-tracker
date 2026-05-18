'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">로드 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              편의점 재고 조회
            </Link>
            <nav className="flex gap-4 items-center">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                홈
              </Link>
              <Link
                href="/search"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                물품 추가
              </Link>
              <Link
                href="/map"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                지도
              </Link>
              <Link
                href="/wishlist"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                찜 관리
              </Link>
              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  로그아웃
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>© 2026 편의점 재고 조회. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
