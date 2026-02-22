import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { APARTMENTS, MAX_DAYS } from '../src/lib/apartments';
import { closeBrowser, fetchListings } from '../src/lib/naver';
import { AreaGroup, DailySnapshot, ListingsData } from '../src/lib/types';

const DATA_PATH = path.resolve(__dirname, '../data/listings.json');
const BACKUP_DIR = path.resolve(__dirname, '../data/backups');
const MAX_BACKUPS = 7;

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

function today(): string {
  // Intl로 KST 기준 날짜 산출 (로컬 TZ 무관)
  const now = new Date();
  const kstStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }); // YYYY-MM-DD
  return kstStr;
}

function backup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const dateStr = today();
  fs.writeFileSync(path.join(BACKUP_DIR, `listings-${dateStr}.json`), raw, 'utf-8');
  console.log(`Backup saved: listings-${dateStr}.json`);

  // 오래된 백업 정리
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('listings-') && f.endsWith('.json'))
    .sort();
  if (files.length > MAX_BACKUPS) {
    for (const old of files.slice(0, files.length - MAX_BACKUPS)) {
      fs.unlinkSync(path.join(BACKUP_DIR, old));
      console.log(`Removed old backup: ${old}`);
    }
  }
}

async function main() {
  backup();
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data: ListingsData = JSON.parse(raw);
  const dateStr = today();

  for (let i = 0; i < APARTMENTS.length; i++) {
    const apt = APARTMENTS[i];
    if (i > 0) await new Promise((r) => setTimeout(r, 5000));
    console.log(`Fetching ${apt.name} (${apt.complexNo})...`);

    let listings = await fetchListings(apt.complexNo).catch(async (err) => {
      if (err?.message === 'RATE_LIMITED') {
        console.log(`  ⏳ Rate limited. Waiting 60s before retry...`);
        await new Promise((r) => setTimeout(r, 60000));
        return fetchListings(apt.complexNo).catch(() => [] as any[]);
      }
      return [] as any[];
    });

    const prices = listings.map((l) => parsePrice(l.dealOrWarrantPrc)).filter((p) => p > 0);

    // 전체 합산 snapshot
    const snapshot: DailySnapshot = {
      date: dateStr,
      totalCount: listings.length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      listings: listings.map((l) => ({
        dealOrWarrantPrc: l.dealOrWarrantPrc,
        area1: l.area1,
        area2: l.area2,
        floorInfo: l.floorInfo,
      })),
    };

    // 평형별 그룹핑
    const areaMap = new Map<number, typeof listings>();
    for (const l of listings) {
      const key = l.area2;
      if (!areaMap.has(key)) areaMap.set(key, []);
      areaMap.get(key)!.push(l);
    }

    const areaSnapshots: { area1: number; area2: number; label: string; snapshot: DailySnapshot }[] = [];
    for (const [area2, areaListings] of Array.from(areaMap.entries())) {
      const areaPrices = areaListings.map((l) => parsePrice(l.dealOrWarrantPrc)).filter((p) => p > 0);
      const area1 = areaListings[0].area1;
      areaSnapshots.push({
        area1,
        area2,
        label: `${area1}/${area2}㎡`,
        snapshot: {
          date: dateStr,
          totalCount: areaListings.length,
          minPrice: areaPrices.length ? Math.min(...areaPrices) : 0,
          maxPrice: areaPrices.length ? Math.max(...areaPrices) : 0,
          avgPrice: areaPrices.length ? Math.round(areaPrices.reduce((a, b) => a + b, 0) / areaPrices.length) : 0,
          listings: areaListings.map((l) => ({
            dealOrWarrantPrc: l.dealOrWarrantPrc,
            area1: l.area1,
            area2: l.area2,
            floorInfo: l.floorInfo,
          })),
        },
      });
    }

    let aptData = data.apartments.find((a) => a.complexNo === apt.complexNo);
    if (!aptData) {
      aptData = { complexNo: apt.complexNo, name: apt.name, snapshots: [], byArea: [] };
      data.apartments.push(aptData);
    }
    if (!aptData.byArea) aptData.byArea = [];

    // 전체 합산 업데이트
    aptData.snapshots = aptData.snapshots.filter((s) => s.date !== dateStr);
    aptData.snapshots.push(snapshot);
    if (aptData.snapshots.length > MAX_DAYS) {
      aptData.snapshots = aptData.snapshots.slice(-MAX_DAYS);
    }

    // 평형별 업데이트
    for (const { area1, area2, label, snapshot: areaSnap } of areaSnapshots) {
      let group = aptData.byArea.find((g) => g.area2 === area2);
      if (!group) {
        group = { area1, area2, label, snapshots: [] };
        aptData.byArea.push(group);
      }
      group.area1 = area1;
      group.label = label;
      group.snapshots = group.snapshots.filter((s) => s.date !== dateStr);
      group.snapshots.push(areaSnap);
      if (group.snapshots.length > MAX_DAYS) {
        group.snapshots = group.snapshots.slice(-MAX_DAYS);
      }
    }
    // area2 기준 오름차순 정렬
    aptData.byArea.sort((a, b) => a.area2 - b.area2);

    console.log(`  → ${listings.length} listings, avg ${snapshot.avgPrice}만원 (${areaSnapshots.length} area groups)`);
  }

  await closeBrowser();

  data.lastUpdated = dateStr;
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Done. Updated ${DATA_PATH}`);
}

main().catch((err) => {
  console.error('Collect failed:', err);
  process.exit(1);
});
