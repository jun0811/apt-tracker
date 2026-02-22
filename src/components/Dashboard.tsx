'use client';

import { ListingsData } from '@/lib/types';
import ApartmentCard from './ApartmentCard';

interface DashboardProps {
  data: ListingsData;
}

export default function Dashboard({ data }: DashboardProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">아파트 매물 추적기</h1>
        <p className="text-sm text-gray-500 mt-1">
          마지막 업데이트: {data.lastUpdated}
        </p>
      </header>

      {data.apartments.length === 0 ? (
        <p className="text-gray-400">등록된 아파트 데이터가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.apartments.map((apt) => (
            <ApartmentCard key={apt.complexNo} data={apt} />
          ))}
        </div>
      )}
    </div>
  );
}
