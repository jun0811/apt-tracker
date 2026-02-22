'use client';

import { ApartmentData } from '@/lib/types';

function formatPrice(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const man = value % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  return `${value.toLocaleString()}만`;
}

interface Props {
  data: ApartmentData;
}

export default function ApartmentSummary({ data }: Props) {
  const latest = data.snapshots[data.snapshots.length - 1];
  const prev = data.snapshots.length > 1
    ? data.snapshots[data.snapshots.length - 2]
    : null;

  const countDiff = prev ? latest.totalCount - prev.totalCount : 0;
  const priceDiffPct =
    prev && prev.avgPrice > 0
      ? ((latest.avgPrice - prev.avgPrice) / prev.avgPrice) * 100
      : 0;

  const stats = [
    {
      label: '현재 매물 수',
      value: `${latest.totalCount}건`,
      diff: prev ? (countDiff > 0 ? `+${countDiff}` : `${countDiff}`) : null,
      diffColor: countDiff > 0 ? 'text-red-500' : countDiff < 0 ? 'text-green-500' : 'text-gray-400',
    },
    {
      label: '평균가',
      value: formatPrice(latest.avgPrice),
      diff: prev && priceDiffPct !== 0 ? `${priceDiffPct > 0 ? '+' : ''}${priceDiffPct.toFixed(1)}%` : null,
      diffColor: priceDiffPct > 0 ? 'text-red-500' : 'text-green-500',
    },
    { label: '최저가', value: formatPrice(latest.minPrice), diff: null, diffColor: '' },
    { label: '최고가', value: formatPrice(latest.maxPrice), diff: null, diffColor: '' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold">{data.name}</h2>
        <a
          href={`https://new.land.naver.com/complexes/${data.complexNo}?ms=37.5,127,16&a=APT&e=RETAIL`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
        >
          매물 보기 &rarr;
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold mt-0.5">
              {s.value}
              {s.diff && (
                <span className={`ml-1 text-sm font-medium ${s.diffColor}`}>
                  {s.diff}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
