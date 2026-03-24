"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatTWD } from "@/lib/format";

interface AllocationItem {
  name: string;
  value: number;
  color: string;
}

interface TargetItem {
  name: string;
  targetPct: number;
}

interface AllocationPieProps {
  data: AllocationItem[];
  targets?: TargetItem[];
}

export default function AllocationPie({ data, targets }: AllocationPieProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  const targetMap = useMemo(() => {
    const map = new Map<string, number>();
    targets?.forEach((t) => map.set(t.name, t.targetPct));
    return map;
  }, [targets]);

  return (
    <div className="card-premium rounded-xl p-6">
      <h3 className="mb-5 text-sm font-semibold text-gray-900">資產配比</h3>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          尚無資料
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="relative h-64 w-64 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-400">總淨值</span>
              <span className="text-xl font-bold text-gray-900 mt-1">
                {formatTWD(total)}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            {data.map((item) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              const target = targetMap.get(item.name);
              const deviation =
                target !== undefined ? pct - target : undefined;

              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    {target !== undefined && deviation !== undefined && (
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-gray-400">
                          目標 {target.toFixed(1)}%
                        </span>
                        <span
                          className={
                            Math.abs(deviation) < 1
                              ? "text-gray-400"
                              : deviation > 0
                                ? "text-[#f8a01d]"
                                : "text-[#7e706a]"
                          }
                        >
                          {deviation >= 0 ? "+" : ""}
                          {deviation.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
