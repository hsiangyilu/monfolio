"use client";

import React from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export default function SummaryCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: SummaryCardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-[#f44336]"
      : changeType === "negative"
        ? "text-[#7bb155]"
        : "text-gray-500";

  return (
    <div className="card-premium rounded-xl p-5 transition-colors duration-200">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-400">
            {icon}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">
        {value}
      </p>
      {change && (
        <span
          className={`mt-2 inline-flex items-center text-xs font-medium ${changeColor}`}
        >
          {change}
        </span>
      )}
    </div>
  );
}
