"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, X } from "lucide-react";

export interface ParsedHolding {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number | null;
}

interface ScreenshotUploadProps {
  category: string;
  onResult: (holdings: ParsedHolding[]) => void;
}

const ACCEPTED = ".xlsx,.xls,.csv,.tsv,image/*";

function isSpreadsheet(file: File): boolean {
  const name = file.name.toLowerCase();
  return [".xlsx", ".xls", ".csv", ".tsv"].some((ext) => name.endsWith(ext));
}

export default function ScreenshotUpload({
  category,
  onResult,
}: ScreenshotUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", category);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "解析失敗");
      }

      const data = await res.json();
      onResult(data.holdings ?? []);
      clearFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失敗");
    } finally {
      setAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const fileIsSpreadsheet = file ? isSpreadsheet(file) : false;

  return (
    <div className="card-premium rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">匯入持股</h3>

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
            拖放檔案到此處，或點擊上傳
          </p>
          <p className="text-xs text-[#7e706a]/60">
            支援 Excel (.xlsx)、CSV · 也支援券商截圖 (PNG, JPG)
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
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              fileIsSpreadsheet ? "bg-[#7bb155]/10" : "bg-[#e8b462]/10"
            }`}>
              <FileSpreadsheet className={`w-5 h-5 ${
                fileIsSpreadsheet ? "text-[#7bb155]" : "text-[#e8b462]"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-[#7e706a]">
                {fileIsSpreadsheet ? "試算表" : "圖片"} · {(file.size / 1024).toFixed(1)} KB
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
              fileIsSpreadsheet ? "解析試算表" : "開始分析"
            )}
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-[#f44336]">{error}</p>
      )}
    </div>
  );
}
