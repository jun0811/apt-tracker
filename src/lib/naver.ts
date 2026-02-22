import https from 'https';
import { Listing } from './types';

const HEADERS: Record<string, string> = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Referer': 'https://new.land.naver.com/complexes/',
  'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

function httpsGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: HEADERS }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

export async function fetchListings(complexNo: number): Promise<Listing[]> {
  const url = `https://new.land.naver.com/api/articles/complex/${complexNo}?realEstateType=APT%3AABYG%3AJGC%3APRE&tradeType=A1&tag=%3A%3A%3A%3A%3A%3A%3A%3A&priceMin=0&priceMax=900000000&areaMin=0&areaMax=900000000&showArticle=false&sameAddressGroup=false&priceType=RETAIL&page=1&complexNo=${complexNo}&type=list&order=rank`;

  try {
    const { status, body } = await httpsGet(url);
    if (status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (status !== 200) {
      console.error(`[naver] ${complexNo} responded ${status}: ${body.slice(0, 200)}`);
      return [];
    }
    const data = JSON.parse(body);
    return (data.articleList ?? []) as Listing[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'RATE_LIMITED') throw err;
    console.error(`[naver] Failed to fetch ${complexNo}:`, msg);
    return [];
  }
}

export async function closeBrowser() {}
