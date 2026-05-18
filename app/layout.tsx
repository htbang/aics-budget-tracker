import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: '편의점 재고 조회',
  description: '세븐일레븐, GS, CU, 이마트, 롯데마트에서 원하는 물품의 실시간 재고를 확인하세요',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey={NEXT_PUBLIC_KAKAO_MAP_API_KEY}"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
