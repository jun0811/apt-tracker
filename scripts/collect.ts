import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { APARTMENTS, MAX_DAYS } from '../src/lib/apartments';
import { fetchListings } from '../src/lib/naver';
import { DailySnapshot, ListingsData } from '../src/lib/types';

const DATA_PATH = path.resolve(__dirname, '../data/listings.json');

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
  // KST = UTC + 9 hours
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return format(kst, 'yyyy-MM-dd');
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data: ListingsData = JSON.parse(raw);
  const dateStr = today();

  for (const apt of APARTMENTS) {
    console.log(`Fetching ${apt.name} (${apt.complexNo})...`);
    const listings = await fetchListings(apt.complexNo);

    const prices = listings.map((l) => parsePrice(l.dealOrWarrantPrc)).filter((p) => p > 0);

    const snapshot: DailySnapshot = {
      date: dateStr,
      totalCount: listings.length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      listings: listings.map((l) => ({
        dealOrWarrantPrc: l.dealOrWarrantPrc,
        area2: l.area2,
        floorInfo: l.floorInfo,
      })),
    };

    let aptData = data.apartments.find((a) => a.complexNo === apt.complexNo);
    if (!aptData) {
      aptData = { complexNo: apt.complexNo, name: apt.name, snapshots: [] };
      data.apartments.push(aptData);
    }

    // Replace if same date already exists
    aptData.snapshots = aptData.snapshots.filter((s) => s.date !== dateStr);
    aptData.snapshots.push(snapshot);

    // Keep only last MAX_DAYS
    if (aptData.snapshots.length > MAX_DAYS) {
      aptData.snapshots = aptData.snapshots.slice(-MAX_DAYS);
    }

    console.log(`  → ${listings.length} listings, avg ${snapshot.avgPrice}만원`);
  }

  data.lastUpdated = dateStr;
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Done. Updated ${DATA_PATH}`);
}

main().catch((err) => {
  console.error('Collect failed:', err);
  process.exit(1);
});
