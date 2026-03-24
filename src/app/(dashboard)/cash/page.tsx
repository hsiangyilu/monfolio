"use client";

import { useState } from "react";
import useSWR from "swr";
import SummaryCard from "@/components/cards/summary-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatTWD } from "@/lib/format";
import { Wallet, Plus, Pencil, Trash2 } from "lucide-react";
import type { Holding, GroupedHoldings, FxRateData } from "@/types/index";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CashPage() {
  const { data: holdings, mutate } = useSWR<GroupedHoldings>(
    "/api/holdings",
    fetcher
  );
  const { data: fxRate } = useSWR<FxRateData>("/api/prices/fx", fetcher);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    quantity: "",
    currency: "TWD",
  });

  const usdTwd = fxRate?.usdTwd ?? 31;
  const cashHoldings = holdings?.cash ?? [];

  const totalCashTwd = cashHoldings.reduce((sum: number, h: Holding) => {
    if (h.costCurrency === "USD") {
      return sum + h.quantity * usdTwd;
    }
    return sum + h.quantity;
  }, 0);

  const resetForm = () =>
    setForm({ name: "", symbol: "", quantity: "", currency: "TWD" });

  const handleAdd = async () => {
    if (!form.quantity) return;
    await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "cash",
        symbol: form.symbol || form.currency,
        name: form.name || `${form.currency} 現金`,
        quantity: parseFloat(form.quantity),
        costCurrency: form.currency,
      }),
    });
    mutate();
    resetForm();
    setAddOpen(false);
  };

  const openEdit = (h: Holding) => {
    setEditingId(h.id);
    setForm({
      name: h.name,
      symbol: h.symbol,
      quantity: String(h.quantity),
      currency: h.costCurrency,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingId || !form.quantity) return;
    await fetch(`/api/holdings/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        symbol: form.symbol,
        quantity: parseFloat(form.quantity),
        costCurrency: form.currency,
      }),
    });
    mutate();
    resetForm();
    setEditingId(null);
    setEditOpen(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    mutate();
  };

  const FormFields = (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500">帳戶名稱</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. 台幣活存, USD Savings"
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">幣別</label>
        <select
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
          className="mt-1 w-full h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900"
        >
          <option value="TWD">TWD 新台幣</option>
          <option value="USD">USD 美元</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500">金額</label>
        <Input
          type="number"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          placeholder="100000"
          className="mt-1"
        />
      </div>
    </div>
  );

  if (!holdings) {
    return (
      <div className="space-y-6">
        <div className="card-premium rounded-2xl p-5 animate-pulse">
          <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-[#7bb155]" />
        現金
      </h1>

      <SummaryCard
        title="現金總額 (TWD)"
        value={formatTWD(totalCashTwd)}
        icon={<Wallet className="w-5 h-5" />}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">現金帳戶</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button
                size="sm"
                className="bg-gray-900 text-white hover:bg-gray-800 border-none"
              />
            }
          >
            <Plus className="w-4 h-4 mr-1" />
            新增
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>新增現金帳戶</DialogTitle>
            </DialogHeader>
            {FormFields}
            <DialogFooter>
              <Button onClick={handleAdd}>確認新增</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯現金帳戶</DialogTitle>
          </DialogHeader>
          {FormFields}
          <DialogFooter>
            <Button onClick={handleEdit}>儲存變更</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="card-premium rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 hover:bg-transparent">
              <TableHead className="text-gray-500">帳戶</TableHead>
              <TableHead className="text-gray-500">幣別</TableHead>
              <TableHead className="text-gray-500 text-right">金額</TableHead>
              <TableHead className="text-gray-500 text-right">折合台幣</TableHead>
              <TableHead className="text-gray-500 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashHoldings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-400 py-8"
                >
                  尚無現金帳戶
                </TableCell>
              </TableRow>
            ) : (
              cashHoldings.map((h: Holding) => {
                const twdValue =
                  h.costCurrency === "USD" ? h.quantity * usdTwd : h.quantity;
                return (
                  <TableRow
                    key={h.id}
                    className="border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="text-gray-900 font-medium">
                      {h.name}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {h.costCurrency}
                    </TableCell>
                    <TableCell className="text-gray-900 text-right">
                      {h.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-900 text-right">
                      {formatTWD(twdValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(h)}
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(h.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
