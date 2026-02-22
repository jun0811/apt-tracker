'use client';

import { useState } from 'react';
import { ListingsData } from '@/lib/types';
import ApartmentSummary from './ApartmentSummary';
import MarketIndicators from './MarketIndicators';
import ListingCountChart from './ListingCountChart';
import PriceChart from './PriceChart';

interface DashboardProps {
  data: ListingsData;
}

export default function Dashboard({ data }: DashboardProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedArea, setSelectedArea] = useState<number | null>(null); // null = 전체
  const [searchQuery, setSearchQuery] = useState('');
  const selected = data.apartments[selectedIdx] ?? null;

  const filteredApartments = data.apartments
    .map((apt, idx) => ({ apt, idx }))
    .filter(({ apt }) => apt.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // 아파트 변경 시 평형 선택 초기화
  const handleAptChange = (idx: number) => {
    setSelectedIdx(idx);
    setSelectedArea(null);
  };

  const activeSnapshots = selected
    ? selectedArea === null
      ? selected.snapshots
      : selected.byArea?.find((g) => g.area2 === selectedArea)?.snapshots ?? []
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">아파트 매물 추적기</h1>
          <p className="text-xs text-gray-400">
            마지막 업데이트: {data.lastUpdated}
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-56 shrink-0 border-r bg-white min-h-[calc(100vh-65px)]">
          <div className="p-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아파트 검색"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <nav className="py-1">
            {filteredApartments.map(({ apt, idx }) => (
              <button
                key={apt.complexNo}
                onClick={() => handleAptChange(idx)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  idx === selectedIdx
                    ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {apt.name}
              </button>
            ))}
            {filteredApartments.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">결과 없음</p>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8">
          {/* Select box - mobile */}
          <div className="md:hidden mb-6 space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아파트 검색"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <select
              value={selectedIdx}
              onChange={(e) => handleAptChange(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
            >
              {filteredApartments.map(({ apt, idx }) => (
                <option key={apt.complexNo} value={idx}>
                  {apt.name}
                </option>
              ))}
            </select>
          </div>

          {selected && selected.snapshots.length > 0 ? (
            <div className="space-y-6">
              <ApartmentSummary data={selected} />

              <MarketIndicators snapshots={activeSnapshots} />

              {/* 평형 탭 */}
              {selected.byArea && selected.byArea.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedArea(null)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedArea === null
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    전체
                  </button>
                  {selected.byArea.map((group) => (
                    <button
                      key={group.area2}
                      onClick={() => setSelectedArea(group.area2)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        selectedArea === group.area2
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              )}

              <section className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">매물 수 추이</h3>
                <ListingCountChart snapshots={activeSnapshots} />
              </section>

              <section className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">가격 추이</h3>
                <PriceChart snapshots={activeSnapshots} />
              </section>
            </div>
          ) : (
            <p className="text-gray-400">데이터가 없습니다.</p>
          )}
        </main>
      </div>
    </div>
  );
}
