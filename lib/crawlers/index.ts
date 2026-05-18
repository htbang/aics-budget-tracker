export type CrawlerBrand = 'seven' | 'gs' | 'cu' | 'emart' | 'lotte';

export interface CrawlerResult {
  brand: CrawlerBrand;
  storeName: string;
  address: string;
  isInStock: boolean;
  priceEstimate?: number;
  scrapedAt: Date;
}

export interface CrawlerConfig {
  timeout?: number;
  headless?: boolean;
  proxy?: string;
}

export abstract class BaseCrawler {
  brand: CrawlerBrand;
  timeout: number;
  headless: boolean;
  proxy?: string;

  constructor(brand: CrawlerBrand, config: CrawlerConfig = {}) {
    this.brand = brand;
    this.timeout = config.timeout || 30000;
    this.headless = config.headless !== false;
    this.proxy = config.proxy;
  }

  abstract crawl(
    productName: string,
    region?: string
  ): Promise<CrawlerResult[]>;

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 크롤러 팩토리
export async function createCrawler(
  brand: CrawlerBrand,
  config?: CrawlerConfig
): Promise<BaseCrawler> {
  switch (brand) {
    case 'seven':
      const { SevenElevenCrawler } = await import('./seven-eleven');
      return new SevenElevenCrawler(config);
    // case 'gs':
    //   const { GSCrawler } = await import('./gs');
    //   return new GSCrawler(config);
    // case 'cu':
    //   const { CUCrawler } = await import('./cu');
    //   return new CUCrawler(config);
    // case 'emart':
    //   const { EmartCrawler } = await import('./emart');
    //   return new EmartCrawler(config);
    // case 'lotte':
    //   const { LotteCrawler } = await import('./lotte');
    //   return new LotteCrawler(config);
    default:
      throw new Error(`Unknown crawler brand: ${brand}`);
  }
}

// 모든 브랜드 순차 크롤링
export async function crawlAllBrands(
  productName: string,
  region?: string,
  config?: CrawlerConfig
): Promise<Map<CrawlerBrand, CrawlerResult[]>> {
  const brands: CrawlerBrand[] = ['seven']; // 'gs', 'cu', 'emart', 'lotte'
  const results = new Map<CrawlerBrand, CrawlerResult[]>();

  for (const brand of brands) {
    try {
      const crawler = await createCrawler(brand, config);
      const crawlResults = await crawler.crawl(productName, region);
      results.set(brand, crawlResults);
      console.log(`✓ ${brand}: ${crawlResults.length} stores`);

      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit
    } catch (error) {
      console.error(`✗ ${brand} crawler failed:`, error);
      results.set(brand, []);
    }
  }

  return results;
}
