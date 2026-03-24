"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, Loader2, X } from "lucide-react";
import { detectCategory, CATEGORY_LABELS } from "@/lib/ocr/detect-category";
import type { ParsedHolding } from "@/components/ocr/screenshot-upload";
import type { HoldingCategory } from "@/types/index";

interface CategorizedHolding extends ParsedHolding {
  category: HoldingCategory;
}

interface ExistingInfo {
  symbol: string;
  quantity: number;
  costBasis: number | null;
}

const ACCEPTED = ".xlsx,.xls,.csv,.tsv";
const CATEGORIES: HoldingCategory[] = ["tw_stock", "us_stock", "crypto"];
const CATEGORY_COLORS: Record<string, string> = {
  tw_stock: "#e8b462",
  us_stock: "#cd7b65",
  crypto: "#f8a01d",
};

export default function OverviewUpload({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<CategorizedHolding[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [existingMap, setExistingMap] = useState<
    Map<string, ExistingInfo>
  >(new Map());

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", "auto");

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "解析失敗");
      }

      const data = await res.json();
      const holdings: ParsedHolding[] = data.holdings ?? [];

      // Auto-detect category for each holding
      const categorized: CategorizedHolding[] = holdings.map((h) => ({
        ...h,
        category: detectCategory(h.symbol),
      }));

      setRows(categorized);
      setPreviewOpen(true);

      // Fetch existing holdings for all categories
      fetchExisting(categorized);

      clearFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失敗");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchExisting = async (holdings: CategorizedHolding[]) => {
    const grouped = new Map<string, string[]>();
    for (const h of holdings) {
      const list = grouped.get(h.category) ?? [];
      list.push(h.symbol);
      grouped.set(h.category, list);
    }

    const map = new Map<string, ExistingInfo>();
    for (const [cat, symbols] of grouped) {
      try {
        const res = await fetch("/api/holdings/batch", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: cat, symbols }),
        });
        const data = await res.json();
        for (const item of data.existing ?? []) {
          map.set(`${cat}:${item.symbol}`, item);
        }
      } catch {
        // ignore
      }
    }
    setExistingMap(map);
  };

  const updateRow = (
    index: number,
    field: keyof CategorizedHolding,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        if (field === "quantity") return { ...r, quantity: parseFloat(value) || 0 };
        if (field === "costBasis")
          return { ...r, costBasis: value ? parseFloat(value) : null };
        if (field === "category")
          return { ...r, category: value as HoldingCategory };
        return { ...r, [field]: value };
      })
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      // Group by category and save each batch
      const grouped = new Map<string, CategorizedHolding[]>();
      for (const row of rows) {
        const list = grouped.get(row.category) ?? [];
        list.push(row);
        grouped.set(row.category, list);
      }

      for (const [cat, holdings] of grouped) {
        const res = await fetch("/api/holdings/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: cat,
            holdings: holdings.map((h) => ({
              symbol: h.symbol,
              name: h.name,
              quantity: h.quantity,
              costBasis: h.costBasis,
            })),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `儲存${CATEGORY_LABELS[cat as HoldingCategory]}失敗`);
        }
      }

      await fetch("/api/snapshots", { method: "POST" }).catch(() => {});
      onConfirm();
      setPreviewOpen(false);
      setRows([]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  // Count stats per category
  const stats = CATEGORIES.map((cat) => {
    const catRows = rows.filter((r) => r.category === cat);
    const updateCount = catRows.filter((r) =>
      existingMap.has(`${cat}:${r.symbol}`)
    ).length;
    return {
      category: cat,
      total: catRows.length,
      updateCount,
      createCount: catRows.length - updateCount,
    };
  }).filter((s) => s.total > 0);

  return (
    <>
      <div className="card-premium rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          綜合匯入
        </h3>
        <p className="text-xs text-[#7e706a]/60 mb-4">
          上傳包含台股、美股、虛擬貨幣的試算表，系統自動辨識分類並更新至各頁面
        </p>

        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
              dragActive
                ? "border-[#e8b462] bg-[#e8b462]/5"
                : "border-gray-300 hover:border-[#e8b462]/60"
            }`}
          >
            <Upload className="w-7 h-7 text-[#7e706a]" />
            <p className="text-sm text-[#7e706a]">
              拖放試算表到此處，或點擊上傳
            </p>
            <p className="text-xs text-[#7e706a]/60">
              支援 Excel (.xlsx)、CSV — 自動辨識台股 / 美股 / 虛擬貨幣
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#7bb155]/10">
                <FileSpreadsheet className="w-5 h-5 text-[#7bb155]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-[#7e706a]">
                  試算表 · {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-[#3d2b2f] text-white hover:bg-[#3d2b2f]/90 border-none"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  解析中...
                </>
              ) : (
                "解析試算表"
              )}
            </Button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-[#f44336]">{error}</p>}
      </div>

      {/* Multi-category preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>綜合匯入確認</DialogTitle>
            <DialogDescription>
              <span className="flex flex-wrap gap-2 mt-1">
                {stats.map((s) => (
                  <span key={s.category} className="inline-flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[s.category] }}
                    />
                    <span className="text-gray-600">
                      {CATEGORY_LABELS[s.category]}
                    </span>
                    {s.updateCount > 0 && (
                      <span className="text-[#e8b462] font-medium">
                        {s.updateCount} 更新
                      </span>
                    )}
                    {s.updateCount > 0 && s.createCount > 0 && " · "}
                    {s.createCount > 0 && (
                      <span className="text-[#7bb155] font-medium">
                        {s.createCount} 新增
                      </span>
                    )}
                  </span>
                ))}
              </span>
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
                    <TableHead className="text-gray-500 w-20">分類</TableHead>
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
                    const key = `${row.category}:${row.symbol}`;
                    const isUpdate = existingMap.has(key);
                    const existing = existingMap.get(key);
                    return (
                      <TableRow key={i} className="border-gray-100">
                        <TableCell>
                          <Select
                            value={row.category}
                            onValueChange={(v) => updateRow(i, "category", v)}
                          >
                            <SelectTrigger className="h-7 w-[80px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{
                                        backgroundColor: CATEGORY_COLORS[cat],
                                      }}
                                    />
                                    {CATEGORY_LABELS[cat]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              isUpdate
                                ? "bg-[#e8b462]/10 text-[#e8b462]"
                                : "bg-[#7bb155]/10 text-[#7bb155]"
                            }`}
                          >
                            {isUpdate ? "更新" : "新增"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.symbol}
                            onChange={(e) =>
                              updateRow(i, "symbol", e.target.value)
                            }
                            className="h-7 w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) =>
                              updateRow(i, "name", e.target.value)
                            }
                            className="h-7 w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <Input
                              type="number"
                              value={row.quantity}
                              onChange={(e) =>
                                updateRow(i, "quantity", e.target.value)
                              }
                              className="h-7 w-24"
                            />
                            {isUpdate &&
                              existing &&
                              existing.quantity !== row.quantity && (
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
                              onChange={(e) =>
                                updateRow(i, "costBasis", e.target.value)
                              }
                              className="h-7 w-28"
                              placeholder="-"
                            />
                            {isUpdate &&
                              existing?.costBasis != null &&
                              existing.costBasis !== row.costBasis && (
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
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
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

          {saveError && (
            <p className="text-sm text-[#f44336]">{saveError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
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
    </>
  );
}
