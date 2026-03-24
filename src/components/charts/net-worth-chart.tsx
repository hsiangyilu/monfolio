"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatTWD } from "@/lib/format";

interface NetWorthChartProps {
  data: Array<{ date: string; value: number }>;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900">
        {formatTWD(payload[0].value)}
      </p>
    </div>
  );
}

export default function NetWorthChart({ data }: NetWorthChartProps) {
  return (
    <div className="card-premium rounded-xl p-6">
      <h3 className="mb-5 text-sm font-semibold text-gray-900">淨值走勢</h3>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          尚無資料，請新增交易紀錄
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8b462" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#e8b462" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatTWD(v)}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#e8b462"
              strokeWidth={2}
              fill="url(#netWorthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
