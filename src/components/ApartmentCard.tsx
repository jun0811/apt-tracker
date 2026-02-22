'use client';

import { ApartmentData } from '@/lib/types';
import PriceChart from './PriceChart';

function formatPrice(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const man = value % 10000;
    return man > 0
      ? `${eok}억 ${man.toLocaleString()}만`
      : `${eok}억`;
  }
  return `${value.toLocaleString()}만`;
}

interface ApartmentCardProps {
  data: ApartmentData;
}

export default function ApartmentCard({ data }: ApartmentCardProps) {
  if (data.snapshots.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">{data.name}</h2>
        <p className="text-gray-400">데이터 없음</p>
      </div>
    );
  }

  const latest = data.snapshots[data.snapshots.length - 1];
  const prev = data.snapshots.length > 1
    ? data.snapshots[data.snapshots.length - 2]
    : null;

  const countDiff = prev ? latest.totalCount - prev.totalCount : 0;
  const priceDiffPct = prev && prev.avgPrice > 0
    ? ((latest.avgPrice - prev.avgPrice) / prev.avgPrice) * 100
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">{data.name}</h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500">현재 매물 수</p>
          <p className="text-xl font-bold">
            {latest.totalCount}
            {prev && (
              <span
                className={`ml-1 text-sm font-medium ${
                  countDiff > 0 ? 'text-red-500' : countDiff < 0 ? 'text-green-500' : 'text-gray-400'
                }`}
              >
                {countDiff > 0 ? `+${countDiff}` : countDiff < 0 ? `${countDiff}` : '0'}
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">평균가</p>
          <p className="text-xl font-bold">
            {formatPrice(latest.avgPrice)}
            {prev && priceDiffPct !== 0 && (
              <span
                className={`ml-1 text-sm font-medium ${
                  priceDiffPct > 0 ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {priceDiffPct > 0 ? '+' : ''}{priceDiffPct.toFixed(1)}%
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">최저가</p>
          <p className="text-lg font-semibold">{formatPrice(latest.minPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">최고가</p>
          <p className="text-lg font-semibold">{formatPrice(latest.maxPrice)}</p>
        </div>
      </div>

      <PriceChart snapshots={data.snapshots} />
    </div>
  );
}
