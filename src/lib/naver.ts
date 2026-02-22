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

export async function fetchListings(complexNo: number): Promise<Listing[]> {
  const ctx = await getContext();
  const page = await ctx.newPage();

  let listings: Listing[] = [];

  try {
    // API 응답 인터셉트 설정
    const apiPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/articles/complex/${complexNo}`) &&
        res.status() === 200,
      { timeout: 20000 },
    );

    // 단지 페이지 이동 (매물 목록 API가 자동 호출됨)
    await page.goto(
      `https://new.land.naver.com/complexes/${complexNo}?ms=37.5,127,16&a=APT&e=RETAIL`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    const response = await apiPromise;
    const data = await response.json();
    // 매매(A1)만 필터 — 전세(B1), 월세(B2) 제외
    listings = ((data.articleList ?? []) as any[])
      .filter((item) => item.tradeTypeCode === 'A1')
      .map((item) => item as Listing);
  } catch (err) {
    console.error(`[naver] Failed to crawl ${complexNo}:`, err instanceof Error ? err.message : err);
  } finally {
    await page.close();
  }

  return listings;
}
