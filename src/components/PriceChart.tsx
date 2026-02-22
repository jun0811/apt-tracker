'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DailySnapshot } from '@/lib/types';

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

interface PriceChartProps {
  snapshots: DailySnapshot[];
}

export default function PriceChart({ snapshots }: PriceChartProps) {
  const chartData = snapshots.map((s) => ({
    date: s.date,
    totalCount: s.totalCount,
    avgPrice: s.avgPrice,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(parseISO(v), 'MM/dd')}
          fontSize={12}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          fontSize={12}
          label={{ value: '매물 수', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          fontSize={12}
          tickFormatter={(v: number) => formatPrice(v)}
          label={{ value: '평균가', angle: 90, position: 'insideRight', fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, name) => {
            const v = Number(value);
            if (name === 'avgPrice') return [formatPrice(v), '평균가'];
            return [v, '매물 수'];
          }}
          labelFormatter={(label) => format(parseISO(String(label)), 'yyyy-MM-dd')}
        />
        <Bar
          yAxisId="left"
          dataKey="totalCount"
          fill="#8884d8"
          name="totalCount"
          barSize={20}
          radius={[2, 2, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgPrice"
          stroke="#ff7300"
          name="avgPrice"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
