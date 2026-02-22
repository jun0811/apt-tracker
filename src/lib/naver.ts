import { chromium, type Browser } from 'playwright';
import { Listing } from './types';

let browser: Browser | null = null;

export async function launchBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Playwright 브라우저 컨텍스트에서 네이버 부동산 API를 호출.
 * 네이버 도메인에 먼저 접속해 쿠키를 받은 뒤 same-origin fetch로 호출.
 */
export async function fetchListings(complexNo: number): Promise<Listing[]> {
  const b = await launchBrowser();
  const context = await b.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // 1) 네이버 부동산 도메인 접속 (쿠키 확보 + same-origin)
    await page.goto(`https://new.land.naver.com/complexes/${complexNo}?ms=37.5,127,16&a=APT&e=RETAIL`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // 2) same-origin fetch로 API 호출
    const apiPath = `/api/articles/complex/${complexNo}?realEstateType=APT%3AABYG%3AJGC%3APRE&tradeType=A1&tag=%3A%3A%3A%3A%3A%3A%3A%3A&priceMin=0&priceMax=900000000&areaMin=0&areaMax=900000000&showArticle=false&sameAddressGroup=false&priceType=RETAIL&page=1&complexNo=${complexNo}&type=list&order=rank`;

    const result = await page.evaluate(async (url: string) => {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      return { status: res.status, body: res.ok ? await res.json() : null };
    }, apiPath);

    if (result.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    return (result.body?.articleList ?? []) as Listing[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'RATE_LIMITED') throw err; // collect.ts에서 재시도 처리
    console.error(`[naver] Failed to crawl ${complexNo}:`, msg);
    return [];
  } finally {
    await context.close();
  }
}
