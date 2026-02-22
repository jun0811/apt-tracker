import { Listing } from './types';

const HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export async function fetchListings(complexNo: number): Promise<Listing[]> {
  const url = `https://new.land.naver.com/api/articles/complex/${complexNo}?realEstateType=APT&tradeType=A1&page=1&sameAddressGroup=true&type=list&order=rank`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.error(`[naver] ${complexNo} responded ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.articleList ?? []) as Listing[];
  } catch (err) {
    console.error(`[naver] Failed to fetch ${complexNo}:`, err);
    return [];
  }
}
