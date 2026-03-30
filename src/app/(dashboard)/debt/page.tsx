"use client";

import { useState } from "react";
import useSWR from "swr";
import SummaryCard from "@/components/cards/summary-card";
import DebtProgress from "@/components/charts/debt-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatTWD } from "@/lib/format";
import { autoCalcDebt } from "@/lib/debt-calc";
import { CreditCard, Plus, Zap } from "lucide-react";
import type { Debt } from "@/types/index";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DebtForm {
  name: string;
  principalTotal: string;
  remainingBalance: string;
  interestRate: string;
  remainingTerms: string;
  monthlyPayment: string;
  paymentDay: string;
  startDate: string;
}

const emptyForm: DebtForm = {
  name: "",
  principalTotal: "",
  remainingBalance: "",
  interestRate: "",
  remainingTerms: "",
  monthlyPayment: "",
  paymentDay: "",
  startDate: "",
};

export default function DebtPage() {
  const { data: debts, mutate } = useSWR<Debt[]>("/api/debt", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DebtForm>(emptyForm);

  const totalDebt = Array.isArray(debts) ? debts.reduce((s, d) => s + d.remainingBalance, 0) : 0;
  const totalMonthly = Array.isArray(debts) ? debts.reduce((s, d) => s + d.monthlyPayment, 0) : 0;

  // When paymentDay + startDate are both set, remaining balance/terms are auto-calculated
  const isAutoCalc = !!form.paymentDay && !!form.startDate;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d: Debt) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      principalTotal: String(d.principalTotal),
      remainingBalance: String(d.remainingBalance),
      interestRate: String(d.interestRate * 100),
      remainingTerms: String(d.remainingTerms),
      monthlyPayment: String(d.monthlyPayment),
      paymentDay: d.paymentDay != null ? String(d.paymentDay) : "",
      startDate: d.startDate ? d.startDate.slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.remainingBalance) return;

    // Auto-calc remaining balance/terms from paymentDay + startDate if possible
    let remainingBalance = parseFloat(form.remainingBalance) || 0;
    let remainingTerms = parseInt(form.remainingTerms) || 0;
    const paymentDay = form.paymentDay ? parseInt(form.paymentDay) : null;

    if (paymentDay && form.startDate && form.principalTotal && form.monthlyPayment) {
      const calc = autoCalcDebt({
        principalTotal: parseFloat(form.principalTotal) || 0,
        monthlyPayment: parseFloat(form.monthlyPayment) || 0,
        paymentDay,
        startDate: form.startDate,
      });
      if (calc) {
        remainingBalance = calc.remainingBalance;
        remainingTerms = calc.remainingTerms;
      }
    }

    const body = {
      id: editingId || undefined,
      name: form.name,
      principalTotal: parseFloat(form.principalTotal) || 0,
      remainingBalance,
      interestRate: (parseFloat(form.interestRate) || 0) / 100,
      remainingTerms,
      monthlyPayment: parseFloat(form.monthlyPayment) || 0,
      paymentDay,
      startDate: form.startDate || null,
    };
    await fetch("/api/debt", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    mutate();
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/debt/${id}`, { method: "DELETE" });
    mutate();
  };

  if (!Array.isArray(debts)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#f44336]" />
          負債管理
        </h1>
        <div className="card-premium rounded-xl p-5 animate-pulse">
          <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-[#f44336]" />
        負債管理
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          title="負債總額"
          value={formatTWD(totalDebt)}
          changeType="negative"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <SummaryCard
          title="每月還款總額"
          value={formatTWD(totalMonthly)}
          icon={<CreditCard className="w-5 h-5" />}
        />
      </div>

      {debts.map((d) => {
        const calc = autoCalcDebt(d);
        return (
          <DebtProgress
            key={d.id}
            name={d.name}
            principalTotal={d.principalTotal}
            remainingBalance={calc ? calc.remainingBalance : d.remainingBalance}
            interestRate={d.interestRate}
            remainingTerms={calc ? calc.remainingTerms : d.remainingTerms}
            monthlyPayment={d.monthlyPayment}
            paymentDay={d.paymentDay}
            nextPaymentDate={calc?.nextPaymentDate ?? null}
            isAutoCalc={!!calc}
            onEdit={() => openEdit(d)}
            onDelete={() => handleDelete(d.id)}
          />
        );
      })}

      {debts.length === 0 && (
        <div className="card-premium rounded-xl p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f44336]/8 flex items-center justify-center mb-4">
            <CreditCard className="w-6 h-6 text-[#f44336]/50" />
          </div>
          <p className="text-sm text-gray-500">尚無負債資料</p>
          <p className="text-xs text-gray-400 mt-1">點擊「新增負債」以開始追蹤還款進度</p>
        </div>
      )}

      <Button
        size="sm"
        onClick={openAdd}
        className="bg-gray-900 text-white hover:bg-gray-800 border-none"
      >
        <Plus className="w-4 h-4 mr-1" />
        新增負債
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯負債" : "新增負債"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="debt-name" className="text-xs text-gray-500">貸款名稱</label>
              <Input
                id="debt-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 信貸, 房貸, 車貸"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="debt-principal" className="text-xs text-gray-500">貸款總額</label>
                <Input
                  id="debt-principal"
                  type="number"
                  value={form.principalTotal}
                  onChange={(e) => setForm({ ...form, principalTotal: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="debt-monthly" className="text-xs text-gray-500">每月還款</label>
                <Input
                  id="debt-monthly"
                  type="number"
                  value={form.monthlyPayment}
                  onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="debt-rate" className="text-xs text-gray-500">年利率 (%)</label>
                <Input
                  id="debt-rate"
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="debt-payment-day" className="text-xs text-gray-500">每月還款日</label>
                <Input
                  id="debt-payment-day"
                  type="number"
                  min={1}
                  max={31}
                  value={form.paymentDay}
                  onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                  placeholder="e.g. 15"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label htmlFor="debt-start" className="text-xs text-gray-500">貸款起始日</label>
              <Input
                id="debt-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Auto-calculated section */}
            {isAutoCalc && form.principalTotal && form.monthlyPayment ? (
              (() => {
                const preview = autoCalcDebt({
                  principalTotal: parseFloat(form.principalTotal) || 0,
                  monthlyPayment: parseFloat(form.monthlyPayment) || 0,
                  paymentDay: parseInt(form.paymentDay),
                  startDate: form.startDate,
                });
                return preview ? (
                  <div className="rounded-lg border border-[#e8b462]/40 bg-[#e8b462]/6 px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-[#e8b462]" />
                      <span className="text-xs font-semibold text-[#e8b462]">自動計算結果</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>已繳期數：<span className="font-semibold text-gray-900">{preview.paymentsMade} 期</span></div>
                      <div>剩餘期數：<span className="font-semibold text-gray-900">{preview.remainingTerms} 期</span></div>
                      <div className="col-span-2">剩餘金額：<span className="font-semibold text-gray-900">{formatTWD(preview.remainingBalance)}</span></div>
                    </div>
                  </div>
                ) : null;
              })()
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="debt-remaining" className="text-xs text-gray-500">
                    剩餘本金
                    <span className="ml-1 text-gray-300">(手動輸入)</span>
                  </label>
                  <Input
                    id="debt-remaining"
                    type="number"
                    value={form.remainingBalance}
                    onChange={(e) => setForm({ ...form, remainingBalance: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="debt-terms" className="text-xs text-gray-500">
                    剩餘期數
                    <span className="ml-1 text-gray-300">(手動輸入)</span>
                  </label>
                  <Input
                    id="debt-terms"
                    type="number"
                    value={form.remainingTerms}
                    onChange={(e) => setForm({ ...form, remainingTerms: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>
              {editingId ? "儲存變更" : "確認新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
