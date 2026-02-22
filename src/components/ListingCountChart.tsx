'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DailySnapshot } from '@/lib/types';

interface Props {
  snapshots: DailySnapshot[];
}

export default function ListingCountChart({ snapshots }: Props) {
  const chartData = snapshots.map((s) => ({
    date: s.date,
    totalCount: s.totalCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(parseISO(v), 'MM/dd')}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <Tooltip
          formatter={(value) => [`${Number(value)}건`, '매물 수']}
          labelFormatter={(label) => format(parseISO(String(label)), 'yyyy-MM-dd')}
        />
        <Bar
          dataKey="totalCount"
          fill="#6366f1"
          name="매물 수"
          barSize={24}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
