'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DailySnapshot } from '@/lib/types';

function formatPrice(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const man = value % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  return `${value.toLocaleString()}만`;
}

interface Props {
  snapshots: DailySnapshot[];
}

export default function PriceChart({ snapshots }: Props) {
  const chartData = snapshots.map((s) => ({
    date: s.date,
    avgPrice: s.avgPrice,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(parseISO(v), 'MM/dd')}
          fontSize={12}
        />
        <YAxis
          fontSize={12}
          tickFormatter={(v: number) => formatPrice(v)}
        />
        <Tooltip
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              avgPrice: '평균가',
              minPrice: '최저가',
              maxPrice: '최고가',
            };
            return [formatPrice(Number(value)), labels[String(name)] ?? name];
          }}
          labelFormatter={(label) => format(parseISO(String(label)), 'yyyy-MM-dd')}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              avgPrice: '평균가',
              minPrice: '최저가',
              maxPrice: '최고가',
            };
            return labels[value] ?? value;
          }}
        />
        <Line type="monotone" dataKey="maxPrice" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="maxPrice" />
        <Line type="monotone" dataKey="avgPrice" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="avgPrice" />
        <Line type="monotone" dataKey="minPrice" stroke="#22c55e" strokeWidth={1.5} dot={{ r: 2 }} name="minPrice" />
      </LineChart>
    </ResponsiveContainer>
  );
}
