'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapPage() {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [region, setRegion] = useState('강남구');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !window.kakao) return;

    // 카카오맵 초기화
    const container = mapContainer.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.4979, 127.0276), // 강남역
      level: 5,
    };

    const kakaoMap = new window.kakao.maps.Map(container, options);
    setMap(kakaoMap);

    // 중심 좌표 이동 리스너
    window.kakao.maps.event.addListener(kakaoMap, 'center_changed', () => {
      // TODO: 지역 업데이트 로직
    });
  }, []);

  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegion(e.target.value);
    setLoading(true);
    try {
      // TODO: /api/map/inventory API 호출
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 지역 선택 */}
      <div className="flex gap-4 items-center">
        <select
          value={region}
          onChange={handleRegionChange}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="강남구">강남구</option>
          <option value="강동구">강동구</option>
          <option value="강북구">강북구</option>
          <option value="강서구">강서구</option>
          <option value="관악구">관악구</option>
          <option value="광진구">광진구</option>
          <option value="구로구">구로구</option>
          <option value="금천구">금천구</option>
          <option value="노원구">노원구</option>
          <option value="도봉구">도봉구</option>
          <option value="동대문구">동대문구</option>
          <option value="동작구">동작구</option>
          <option value="마포구">마포구</option>
          <option value="서대문구">서대문구</option>
          <option value="서초구">서초구</option>
          <option value="성동구">성동구</option>
          <option value="성북구">성북구</option>
          <option value="송파구">송파구</option>
          <option value="양천구">양천구</option>
          <option value="영등포구">영등포구</option>
          <option value="용산구">용산구</option>
          <option value="은평구">은평구</option>
          <option value="종로구">종로구</option>
          <option value="중구">중구</option>
          <option value="중랑구">중랑구</option>
        </select>
        {loading && <span className="text-gray-600">로드 중...</span>}
      </div>

      {/* 맵 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen">
        {/* 맵 (2/3) */}
        <div ref={mapContainer} className="lg:col-span-2 rounded-lg shadow overflow-hidden" />

        {/* 재고 목록 (1/3) */}
        <div className="bg-white rounded-lg shadow overflow-y-auto p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 물품 재고</h2>

          {loading ? (
            <p className="text-gray-600">로드 중...</p>
          ) : (
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-3">
                <h3 className="font-semibold text-gray-900">세븐일레븬</h3>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                  <li>강남역점 (입고: 2/3)</li>
                  <li>신논현점 (입고: 1/3)</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-3">
                <h3 className="font-semibold text-gray-900">GS편의점</h3>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                  <li>강남역점 (입고: 2/3)</li>
                </ul>
              </div>

              <div className="border-l-4 border-cyan-500 pl-3">
                <h3 className="font-semibold text-gray-900">CU</h3>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                  <li className="text-gray-400">선택된 편의점 없음</li>
                </ul>
              </div>
            </div>
          )}

          {/* 추가 버튼 */}
          <button className="w-full btn-primary mt-4">➕ 편의점 추가</button>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p>
          💡 <strong>팁:</strong> 지역을 선택하면 해당 지역의 편의점들이 표시됩니다.
          체크박스를 선택하면 해당 편의점에서 물품 입고 시 알림을 받습니다.
        </p>
      </div>
    </div>
  );
}
