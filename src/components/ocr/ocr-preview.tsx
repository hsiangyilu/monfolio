"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import type { ParsedHolding } from "@/components/ocr/screenshot-upload";

interface OcrPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdings: ParsedHolding[];
  category: string;
  onConfirm: () => void | Promise<void>;
}

interface ExistingInfo {
  symbol: string;
  quantity: number;
  costBasis: number | null;
}

export default function OcrPreview({
  open,
  onOpenChange,
  holdings: initialHoldings,
  category,
  onConfirm,
}: OcrPreviewProps) {
  const [rows, setRows] = useState<ParsedHolding[]>(initialHoldings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingMap, setExistingMap] = useState<Map<string, ExistingInfo>>(new Map());

  // Sync rows when initialHoldings change
  if (
    initialHoldings.length > 0 &&
    JSON.stringify(initialHoldings) !== JSON.stringify(rows) &&
    !saving
  ) {
    setRows(initialHoldings);
  }

  // Fetch existing holdings to determine update vs create
  useEffect(() => {
    if (!open || rows.length === 0) return;

    const symbols = rows.map((r) => r.symbol).filter(Boolean);
    if (symbols.length === 0) return;

    fetch("/api/holdings/batch", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, symbols }),
    })
      .then((res) => res.json())
      .then((data) => {
        const map = new Map<string, ExistingInfo>();
        for (const item of data.existing ?? []) {
          map.set(item.symbol, item);
        }
        setExistingMap(map);
      })
      .catch(() => {});
  }, [open, rows, category]);

  const updateRow = (index: number, field: keyof ParsedHolding, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        if (field === "quantity") return { ...r, quantity: parseFloat(value) || 0 };
        if (field === "costBasis")
          return { ...r, costBasis: value ? parseFloat(value) : null };
        return { ...r, [field]: value };
      })
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/holdings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          holdings: rows.map((r) => ({
            symbol: r.symbol,
            name: r.name,
            quantity: r.quantity,
            costBasis: r.costBasis,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "儲存持股失敗");
      }

      await fetch("/api/snapshots", { method: "POST" }).catch(() => {});

      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const updateCount = rows.filter((r) => existingMap.has(r.symbol)).length;
  const createCount = rows.length - updateCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>匯入確認</DialogTitle>
          <DialogDescription>
            請確認以下資料。
            {updateCount > 0 && createCount > 0 && (
              <span className="ml-1">
                <span className="text-[#e8b462] font-medium">{updateCount} 筆更新</span>
                {" · "}
                <span className="text-[#7bb155] font-medium">{createCount} 筆新增</span>
              </span>
            )}
            {updateCount > 0 && createCount === 0 && (
              <span className="ml-1 text-[#e8b462] font-medium">全部 {updateCount} 筆為更新既有持股</span>
            )}
            {updateCount === 0 && createCount > 0 && (
              <span className="ml-1 text-[#7bb155] font-medium">全部 {createCount} 筆為新增持股</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            未找到任何持股資料
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableHead className="text-gray-500 w-14">狀態</TableHead>
                  <TableHead className="text-gray-500">代碼</TableHead>
                  <TableHead className="text-gray-500">名稱</TableHead>
                  <TableHead className="text-gray-500">數量</TableHead>
                  <TableHead className="text-gray-500">成本</TableHead>
                  <TableHead className="text-gray-500 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => {
                  const isUpdate = existingMap.has(row.symbol);
                  const existing = existingMap.get(row.symbol);
                  return (
                    <TableRow key={i} className="border-gray-100">
                      <TableCell>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isUpdate
                            ? "bg-[#e8b462]/10 text-[#e8b462]"
                            : "bg-[#7bb155]/10 text-[#7bb155]"
                        }`}>
                          {isUpdate ? "更新" : "新增"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.symbol}
                          onChange={(e) => updateRow(i, "symbol", e.target.value)}
                          className="h-7 w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.name}
                          onChange={(e) => updateRow(i, "name", e.target.value)}
                          className="h-7 w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <Input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => updateRow(i, "quantity", e.target.value)}
                            className="h-7 w-24"
                          />
                          {isUpdate && existing && existing.quantity !== row.quantity && (
                            <span className="text-[10px] text-[#7e706a] mt-0.5 block">
                              現有: {existing.quantity.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Input
                            type="number"
                            value={row.costBasis ?? ""}
                            onChange={(e) => updateRow(i, "costBasis", e.target.value)}
                            className="h-7 w-28"
                            placeholder="-"
                          />
                          {isUpdate && existing?.costBasis != null && existing.costBasis !== row.costBasis && (
                            <span className="text-[10px] text-[#7e706a] mt-0.5 block">
                              現有: {existing.costBasis.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeRow(i)}
                          className="text-gray-400 hover:text-[#f44336]"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {error && <p className="text-sm text-[#f44336]">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || rows.length === 0}
            className="bg-[#3d2b2f] text-white hover:bg-[#3d2b2f]/90 border-none"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                儲存中...
              </>
            ) : (
              `確認匯入 (${rows.length} 筆)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
