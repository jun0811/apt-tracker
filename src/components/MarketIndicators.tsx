'use client';

import { DailySnapshot } from '@/lib/types';
import { computeIndicators } from '@/lib/indicators';

interface MarketIndicatorsProps {
  snapshots: DailySnapshot[];
}

export default function MarketIndicators({ snapshots }: MarketIndicatorsProps) {
  const indicators = computeIndicators(snapshots);

  if (!indicators.hasEnoughData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">특이사항</h3>
        <p className="text-sm text-gray-400">
          데이터가 2일 이상 수집되어야 지표가 표시됩니다.
        </p>
      </div>
    );
  }

  const netChange = indicators.newCount - indicators.removedCount;
  const netLabel = netChange > 0 ? `+${netChange}` : `${netChange}`;

  const dropPct =
    indicators.totalTracked > 0
      ? Math.round((indicators.priceDropCount / indicators.totalTracked) * 100)
      : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">특이사항</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 호가 변동 */}
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">호가 하락</p>
          <p className="text-lg font-bold text-red-600">
            {indicators.priceDropCount}건
            <span className="text-sm font-normal text-gray-400 ml-1">
              ({dropPct}%)
            </span>
          </p>
          {indicators.priceRiseCount > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              상승 {indicators.priceRiseCount}건
            </p>
          )}
        </div>

        {/* 신규/소멸 */}
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">신규 / 소멸</p>
          <p className="text-lg font-bold">
            <span className="text-blue-600">+{indicators.newCount}</span>
            {' / '}
            <span className="text-gray-600">-{indicators.removedCount}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            순증감{' '}
            <span
              className={
                netChange > 0
                  ? 'text-blue-600'
                  : netChange < 0
                    ? 'text-red-600'
                    : 'text-gray-500'
              }
            >
              {netLabel}
            </span>
          </p>
        </div>

        {/* 평균 체류 */}
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">평균 체류</p>
          <p className="text-lg font-bold text-gray-800">
            {indicators.avgDaysOnMarket}일
          </p>
        </div>
      </div>
    </div>
  );
}
