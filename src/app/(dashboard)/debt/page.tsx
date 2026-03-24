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
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react";
import type { Debt } from "@/types/index";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DebtForm {
  name: string;
  principalTotal: string;
  remainingBalance: string;
  interestRate: string;
  remainingTerms: string;
  monthlyPayment: string;
}

const emptyForm: DebtForm = {
  name: "",
  principalTotal: "",
  remainingBalance: "",
  interestRate: "",
  remainingTerms: "",
  monthlyPayment: "",
};

export default function DebtPage() {
  const { data: debts, mutate } = useSWR<Debt[]>("/api/debt", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DebtForm>(emptyForm);

  const totalDebt = debts?.reduce((s, d) => s + d.remainingBalance, 0) ?? 0;
  const totalMonthly = debts?.reduce((s, d) => s + d.monthlyPayment, 0) ?? 0;

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
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.remainingBalance) return;
    const body = {
      id: editingId || undefined,
      name: form.name,
      principalTotal: parseFloat(form.principalTotal) || 0,
      remainingBalance: parseFloat(form.remainingBalance) || 0,
      interestRate: (parseFloat(form.interestRate) || 0) / 100,
      remainingTerms: parseInt(form.remainingTerms) || 0,
      monthlyPayment: parseFloat(form.monthlyPayment) || 0,
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
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    mutate();
  };

  if (!debts) {
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

      {debts.map((d) => (
        <div key={d.id} className="relative">
          <DebtProgress
            principalTotal={d.principalTotal}
            remainingBalance={d.remainingBalance}
            interestRate={d.interestRate}
            remainingTerms={d.remainingTerms}
            monthlyPayment={d.monthlyPayment}
          />
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <span className="text-sm text-gray-500 mr-2">{d.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(d)}
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(d.id)}
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </div>
        </div>
      ))}

      {debts.length === 0 && (
        <div className="card-premium rounded-xl p-8 text-center text-gray-400">
          尚無負債資料
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
              <label className="text-xs text-gray-500">貸款名稱</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 信貸, 房貸, 車貸"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">貸款總額</label>
                <Input
                  type="number"
                  value={form.principalTotal}
                  onChange={(e) => setForm({ ...form, principalTotal: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">剩餘本金</label>
                <Input
                  type="number"
                  value={form.remainingBalance}
                  onChange={(e) => setForm({ ...form, remainingBalance: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">年利率 (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">剩餘期數 (月)</label>
                <Input
                  type="number"
                  value={form.remainingTerms}
                  onChange={(e) => setForm({ ...form, remainingTerms: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">每月還款</label>
              <Input
                type="number"
                value={form.monthlyPayment}
                onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
                className="mt-1"
              />
            </div>
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
