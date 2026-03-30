"use client";

import { useMemo } from "react";
import { formatTWD } from "@/lib/format";
import { Zap, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DebtProgressProps {
  name: string;
  principalTotal: number;
  remainingBalance: number;
  interestRate: number;
  remainingTerms: number;
  monthlyPayment: number;
  paymentDay: number | null;
  nextPaymentDate: Date | null;
  isAutoCalc: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DebtProgress({
  name,
  principalTotal,
  remainingBalance,
  interestRate,
  remainingTerms,
  monthlyPayment,
  paymentDay,
  nextPaymentDate,
  isAutoCalc,
  onEdit,
  onDelete,
}: DebtProgressProps) {
  const paidAmount = principalTotal - remainingBalance;
  const progressPct =
    principalTotal > 0 ? (paidAmount / principalTotal) * 100 : 0;

  const estimatedPayoffDate = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() + remainingTerms);
    return now.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
    });
  }, [remainingTerms]);

  const nextPaymentStr = useMemo(() => {
    if (!nextPaymentDate) return null;
    return nextPaymentDate.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [nextPaymentDate]);

  return (
    <div className="card-premium rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
        {isAutoCalc && (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#e8b462]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#c49440]">
            <Zap className="w-2.5 h-2.5" />
            自動計算
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              aria-label={`編輯 ${name}`}
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              aria-label={`刪除 ${name}`}
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          )}
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs text-gray-400">已還款</span>
        <span className="text-sm font-bold tabular-nums text-gray-900">
          {progressPct.toFixed(1)}%
        </span>
      </div>
      <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(progressPct, 100)}%`,
            background: "linear-gradient(90deg, #cd7b65, #e8b462)",
          }}
        />
      </div>

      <div className="mb-6 flex justify-between text-sm">
        <div>
          <span className="text-gray-400 text-xs">已還</span>
          <span className="ml-2 font-semibold text-[#f44336]">
            {formatTWD(paidAmount)}
          </span>
        </div>
        <div>
          <span className="text-gray-400 text-xs">剩餘</span>
          <span className="ml-2 font-semibold text-[#7bb155]">
            {formatTWD(remainingBalance)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
        <div>
          <p className="text-xs text-gray-400">利率</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
            {(interestRate * 100).toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">剩餘期數</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
            {remainingTerms} 個月
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">每月還款</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
            {formatTWD(monthlyPayment)}
          </p>
        </div>
        {paymentDay && nextPaymentStr ? (
          <div>
            <p className="text-xs text-gray-400">下次還款日</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {nextPaymentStr}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-400">預計還清</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {estimatedPayoffDate}
            </p>
          </div>
        )}
        {paymentDay && (
          <div>
            <p className="text-xs text-gray-400">每月還款日</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              每月 {paymentDay} 日
            </p>
          </div>
        )}
        {paymentDay && (
          <div>
            <p className="text-xs text-gray-400">預計還清</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {estimatedPayoffDate}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
