import { chromium } from 'playwright';
import { BaseCrawler, CrawlerResult, CrawlerConfig } from './index';

export class SevenElevenCrawler extends BaseCrawler {
  constructor(config: CrawlerConfig = {}) {
    super('seven', config);
  }

  async crawl(productName: string, region?: string): Promise<CrawlerResult[]> {
    const browser = await chromium.launch({
      headless: this.headless,
      args: this.proxy ? [`--proxy-server=${this.proxy}`] : [],
    });

    try {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();

      // 세븐일레븐 앱/웹 접속
      await page.goto('https://www.7-eleven.co.kr/product/search', {
        waitUntil: 'networkidle',
        timeout: this.timeout,
      });

      // 검색 입력
      const searchInput = page.locator('input[placeholder*="상품명"]');
      await searchInput.fill(productName);
      await searchInput.press('Enter');

      // 검색 결과 로드 대기
      await page.waitForLoadState('networkidle');

      // 제품이 있는지 확인
      const productElements = page.locator('[data-product-item]');
      const count = await productElements.count();

      if (count === 0) {
        // 제품 없음 = 모든 점포에서 품절
        return [];
      }

      // 점포별 재고 정보 추출
      const results: CrawlerResult[] = [];
      const storeElements = page.locator('[data-store-availability]');
      const storeCount = await storeElements.count();

      for (let i = 0; i < storeCount; i++) {
        const storeElement = storeElements.nth(i);
        const storeName = await storeElement
          .locator('[data-store-name]')
          .textContent();
        const storeAddress = await storeElement
          .locator('[data-store-address]')
          .textContent();
        const stockStatus = await storeElement
          .locator('[data-stock-status]')
          .getAttribute('data-stock-status');

        if (storeName && storeAddress) {
          results.push({
            brand: 'seven',
            storeName: storeName.trim(),
            address: storeAddress.trim(),
            isInStock: stockStatus === 'in_stock',
            scrapedAt: new Date(),
          });
        }
      }

      // 지역 필터링 (선택사항)
      if (region) {
        return results.filter(r => r.address.includes(region));
      }

      return results;
    } catch (error) {
      console.error('SevenElevenCrawler error:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}
