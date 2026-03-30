"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatTWD } from "@/lib/format";

interface AssetLineChartProps {
  data: Array<{ date: string; value: number }>;
  color: string;
  title: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  color: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold" style={{ color }}>
        {formatTWD(payload[0].value)}
      </p>
    </div>
  );
}

export default function AssetLineChart({
  data,
  color,
  title,
}: AssetLineChartProps) {
  return (
    <div className="card-premium rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          尚無資料
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200} className="md:!h-[240px]">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              tickFormatter={(v: number) => formatTWD(v)}
              width={100}
            />
            <Tooltip content={<CustomTooltip color={color} />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
