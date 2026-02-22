import { Listing } from './types';

const HEADERS = {
  Accept: 'application/json',
  Referer: 'https://new.land.naver.com/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

export async function fetchListings(complexNo: number): Promise<Listing[]> {
  const url = `https://new.land.naver.com/api/articles/complex/${complexNo}?realEstateType=APT%3AABYG%3AJGC%3APRE&tradeType=A1&tag=%3A%3A%3A%3A%3A%3A%3A%3A&priceMin=0&priceMax=900000000&areaMin=0&areaMax=900000000&showArticle=false&sameAddressGroup=false&priceType=RETAIL&page=1&complexNo=${complexNo}&type=list&order=rank`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (!res.ok) {
      console.error(`[naver] ${complexNo} responded ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.articleList ?? []) as Listing[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'RATE_LIMITED') throw err;
    console.error(`[naver] Failed to fetch ${complexNo}:`, msg);
    return [];
  }
}

// Playwright 호환을 위한 no-op
export async function closeBrowser() {}
