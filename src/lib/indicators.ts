import { DailySnapshot, MarketIndicators } from './types';

/** "5억 2,000" → 52000, "3억" → 30000, "9,500" → 9500 */
function parsePrice(raw: string): number {
  const str = raw.replace(/,/g, '').trim();
  const match = str.match(/^(\d+)억\s*(\d+)?$/);
  if (match) {
    const eok = Number(match[1]) * 10000;
    const rest = match[2] ? Number(match[2]) : 0;
    return eok + rest;
  }
  return Number(str) || 0;
}

export function computeIndicators(snapshots: DailySnapshot[]): MarketIndicators {
  const noData: MarketIndicators = {
    hasEnoughData: false,
    priceDropCount: 0,
    priceRiseCount: 0,
    totalTracked: 0,
    newCount: 0,
    removedCount: 0,
    avgDaysOnMarket: 0,
  };

  if (snapshots.length < 2) return noData;

  // 날짜순 정렬
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // articleNo가 있는 스냅샷만 사용
  const withArticle = sorted.filter((s) =>
    s.listings.some((l) => l.articleNo),
  );
  if (withArticle.length < 2) return noData;

  const today = withArticle[withArticle.length - 1];
  const yesterday = withArticle[withArticle.length - 2];

  // articleNo → price 맵 생성
  const todayMap = new Map<string, number>();
  for (const l of today.listings) {
    if (l.articleNo) todayMap.set(l.articleNo, parsePrice(l.dealOrWarrantPrc));
  }

  const yesterdayMap = new Map<string, number>();
  for (const l of yesterday.listings) {
    if (l.articleNo) yesterdayMap.set(l.articleNo, parsePrice(l.dealOrWarrantPrc));
  }

  // 호가 변동: 양일 모두 존재하는 매물의 가격 비교
  let priceDropCount = 0;
  let priceRiseCount = 0;
  let totalTracked = 0;

  for (const [articleNo, todayPrice] of Array.from(todayMap.entries())) {
    const yesterdayPrice = yesterdayMap.get(articleNo);
    if (yesterdayPrice !== undefined) {
      totalTracked++;
      if (todayPrice < yesterdayPrice) priceDropCount++;
      else if (todayPrice > yesterdayPrice) priceRiseCount++;
    }
  }

  // 신규/소멸
  const todayIds = Array.from(todayMap.keys());
  const yesterdayIds = Array.from(yesterdayMap.keys());
  const yesterdayIdSet = new Set(yesterdayIds);
  const todayIdSet = new Set(todayIds);

  let newCount = 0;
  for (const id of todayIds) {
    if (!yesterdayIdSet.has(id)) newCount++;
  }

  let removedCount = 0;
  for (const id of yesterdayIds) {
    if (!todayIdSet.has(id)) removedCount++;
  }

  // 체류일수: 각 articleNo가 연속으로 몇 일 출현했는지 역추적
  const daysOnMarket: number[] = [];
  for (const articleNo of todayIds) {
    let days = 1;
    for (let i = withArticle.length - 2; i >= 0; i--) {
      const snap = withArticle[i];
      if (snap.listings.some((l) => l.articleNo === articleNo)) {
        days++;
      } else {
        break;
      }
    }
    daysOnMarket.push(days);
  }

  const avgDaysOnMarket =
    daysOnMarket.length > 0
      ? Math.round(
          (daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length) * 10,
        ) / 10
      : 0;

  return {
    hasEnoughData: true,
    priceDropCount,
    priceRiseCount,
    totalTracked,
    newCount,
    removedCount,
    avgDaysOnMarket,
  };
}
