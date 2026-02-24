import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, BrowserContext } from 'playwright';
import { Listing } from './types';

chromium.use(StealthPlugin());

let browser: Browser | null = null;
let context: BrowserContext | null = null;

async function getContext() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  if (!context) {
    context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
    });
  }
  return context;
}

export async function closeBrowser() {
  if (context) { await context.close(); context = null; }
  if (browser) { await browser.close(); browser = null; }
}

export async function fetchListings(complexNo: number, retries = 2): Promise<Listing[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctx = await getContext();
    const page = await ctx.newPage();

    try {
      // API 응답 인터셉트 설정
      const apiPromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/articles/complex/${complexNo}`) &&
          res.status() === 200,
        { timeout: 30000 },
      );
      // unhandled rejection 방지
      apiPromise.catch(() => {});

      // 단지 페이지 이동 (매물 목록 API가 자동 호출됨)
      await page.goto(
        `https://new.land.naver.com/complexes/${complexNo}?ms=37.5,127,16&a=APT&e=RETAIL`,
        { waitUntil: 'networkidle', timeout: 30000 },
      );

      const response = await apiPromise;
      const data = await response.json();
      // 매매(A1)만 필터 — 전세(B1), 월세(B2) 제외
      const listings = ((data.articleList ?? []) as any[])
        .filter((item) => item.tradeTypeCode === 'A1')
        .map((item) => item as Listing);
      return listings;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[naver] Failed to crawl ${complexNo} (attempt ${attempt + 1}/${retries + 1}):`, msg);
      if (attempt < retries) {
        console.log(`  ↻ Retrying in 10s...`);
        await new Promise((r) => setTimeout(r, 10000));
      }
    } finally {
      await page.close();
    }
  }

  return [];
}
