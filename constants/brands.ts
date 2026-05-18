export const BRANDS = ['seven', 'gs', 'cu', 'emart', 'lotte'] as const;

export type Brand = (typeof BRANDS)[number];

export const BRAND_NAMES: Record<Brand, string> = {
  seven: '세븐일레븐',
  gs: 'GS편의점',
  cu: 'CU',
  emart: '이마트',
  lotte: '롯데마트',
};

export const BRAND_COLORS: Record<Brand, string> = {
  seven: '#004687',
  gs: '#C80000',
  cu: '#00A0E9',
  emart: '#ED1C24',
  lotte: '#C41E3A',
};
