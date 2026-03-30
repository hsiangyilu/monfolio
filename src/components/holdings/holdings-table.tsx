"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { formatTWD, formatPercent } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { HoldingCategory } from "@/types/index";

export interface HoldingRow {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number | null;
  currentPrice: number | null;
  totalValueTwd: number;
  unrealizedPnl: number;
  pnlPercent: number;
}

interface HoldingsTableProps {
  holdings: HoldingRow[];
  category: HoldingCategory;
  onAdd?: (data: {
    symbol: string;
    name: string;
    quantity: number;
    costBasis: number | null;
  }) => void;
  onEdit?: (
    id: string,
    data: {
      symbol: string;
      name: string;
      quantity: number;
      costBasis: number | null;
    }
  ) => void;
  onDelete?: (id: string) => void;
}

interface FormState {
  symbol: string;
  name: string;
  quantity: string;
  costBasis: string;
}

const emptyForm: FormState = { symbol: "", name: "", quantity: "", costBasis: "" };

export default function HoldingsTable({
  holdings,
  category,
  onAdd,
  onEdit,
  onDelete,
}: HoldingsTableProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const handleAdd = () => {
    if (!form.symbol || !form.quantity) return;
    onAdd?.({
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      quantity: parseFloat(form.quantity),
      costBasis: form.costBasis ? parseFloat(form.costBasis) : null,
    });
    setForm(emptyForm);
    setAddOpen(false);
  };

  const handleEdit = () => {
    if (!editingId || !form.symbol || !form.quantity) return;
    onEdit?.(editingId, {
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      quantity: parseFloat(form.quantity),
      costBasis: form.costBasis ? parseFloat(form.costBasis) : null,
    });
    setForm(emptyForm);
    setEditingId(null);
    setEditOpen(false);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    onDelete?.(deletingId);
    setDeletingId(null);
    setDeleteOpen(false);
  };

  const openEdit = (h: HoldingRow) => {
    setEditingId(h.id);
    setForm({
      symbol: h.symbol,
      name: h.name,
      quantity: String(h.quantity),
      costBasis: h.costBasis != null ? String(h.costBasis) : "",
    });
    setEditOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const FormFields = (
    <div className="space-y-3">
      <div>
        <label htmlFor="holding-symbol" className="text-xs text-gray-500">代碼</label>
        <Input
          id="holding-symbol"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          placeholder="e.g. 2330, AAPL, BTC"
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="holding-name" className="text-xs text-gray-500">名稱</label>
        <Input
          id="holding-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="台積電"
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="holding-quantity" className="text-xs text-gray-500">持股數量</label>
        <Input
          id="holding-quantity"
          type="number"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          placeholder="100"
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="holding-cost" className="text-xs text-gray-500">
          成本 ({category === "us_stock" || category === "crypto" ? "USD" : "TWD"})
        </label>
        <Input
          id="holding-cost"
          type="number"
          value={form.costBasis}
          onChange={(e) => setForm({ ...form, costBasis: e.target.value })}
          placeholder="Total cost basis"
          className="mt-1"
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">持股明細</h3>
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
              <DialogTitle>新增持股</DialogTitle>
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
            <DialogTitle>編輯持股</DialogTitle>
          </DialogHeader>
          {FormFields}
          <DialogFooter>
            <Button onClick={handleEdit}>儲存變更</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            確定要刪除此持股嗎？此操作無法復原。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="overflow-x-auto -mx-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-gray-100 hover:bg-transparent">
              <TableHead className="text-gray-500">名稱</TableHead>
              <TableHead className="text-gray-500">代碼</TableHead>
              <TableHead className="text-gray-500 text-right">持股數量</TableHead>
              <TableHead className="text-gray-500 text-right">
                成本均價{category === "us_stock" || category === "crypto" ? <span className="text-gray-400 text-[10px] ml-1">(USD)</span> : null}
              </TableHead>
              <TableHead className="text-gray-500 text-right">
                即時價格{category === "us_stock" || category === "crypto" ? <span className="text-gray-400 text-[10px] ml-1">(USD)</span> : null}
              </TableHead>
              <TableHead className="text-gray-500 text-right">市值<span className="text-gray-400 text-[10px] ml-1">(TWD)</span></TableHead>
              <TableHead className="text-gray-500 text-right">未實現損益</TableHead>
              <TableHead className="text-gray-500 text-right">損益%</TableHead>
              <TableHead className="text-gray-500 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                  尚無持股資料
                </TableCell>
              </TableRow>
            ) : (
              holdings.map((h) => {
                const pnlColor =
                  h.unrealizedPnl > 0
                    ? "text-[#f44336]"
                    : h.unrealizedPnl < 0
                      ? "text-[#7bb155]"
                      : "text-gray-400";
                const avgCost =
                  h.costBasis != null && h.quantity > 0
                    ? h.costBasis / h.quantity
                    : null;

                return (
                  <TableRow
                    key={h.id}
                    className="border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="text-gray-900 font-medium">
                      {h.name}
                    </TableCell>
                    <TableCell className="text-gray-500">{h.symbol}</TableCell>
                    <TableCell className="text-gray-900 text-right">
                      {h.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-600 text-right">
                      {avgCost != null ? avgCost.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-gray-900 text-right">
                      {h.currentPrice != null ? h.currentPrice.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-gray-900 text-right">
                      {formatTWD(h.totalValueTwd)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${pnlColor}`}>
                      {formatTWD(h.unrealizedPnl)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${pnlColor}`}>
                      {formatPercent(h.pnlPercent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(h)}
                          aria-label={`編輯 ${h.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDelete(h.id)}
                          aria-label={`刪除 ${h.name}`}
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
    </div>
  );
}
