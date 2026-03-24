"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save, Loader2 } from "lucide-react";
import type { TargetAllocation } from "@/types/index";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SettingsData {
  ocrEngine: string;
  geminiApiKey: string;
  claudeApiKey: string;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  tw_stock: { label: "台股", color: "#e8b462" },
  us_stock: { label: "美股", color: "#cd7b65" },
  crypto: { label: "虛擬貨幣", color: "#f8a01d" },
  cash: { label: "現金", color: "#7bb155" },
};

const defaultAllocations = [
  { category: "tw_stock", targetPct: 30 },
  { category: "us_stock", targetPct: 30 },
  { category: "crypto", targetPct: 20 },
  { category: "cash", targetPct: 20 },
];

export default function SettingsPage() {
  const { data: targets, mutate: mutateTargets } = useSWR<TargetAllocation[]>(
    "/api/settings/targets",
    fetcher
  );
  const { data: settings, mutate: mutateSettings } = useSWR<SettingsData>(
    "/api/settings",
    fetcher
  );

  const [allocations, setAllocations] = useState<
    { category: string; targetPct: number }[]
  >(defaultAllocations);
  const [ocrEngine, setOcrEngine] = useState<string>("gemini");
  const [savingTargets, setSavingTargets] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [targetMsg, setTargetMsg] = useState<string | null>(null);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  useEffect(() => {
    if (targets && targets.length > 0) {
      setAllocations(
        targets.map((t) => ({ category: t.category, targetPct: t.targetPct }))
      );
    }
  }, [targets]);

  useEffect(() => {
    if (settings?.ocrEngine) {
      setOcrEngine(settings.ocrEngine);
    }
  }, [settings]);

  const totalPct = allocations.reduce((s, a) => s + a.targetPct, 0);
  const isValid = Math.abs(totalPct - 100) < 0.01;

  const updateAllocation = (category: string, value: number) => {
    setAllocations((prev) => {
      const lastCat = prev[prev.length - 1].category;
      // If editing the last category, do nothing (it auto-calculates)
      if (category === lastCat) return prev;
      const updated = prev.map((a) =>
        a.category === category ? { ...a, targetPct: value } : a
      );
      // Auto-adjust last category so total = 100
      const othersSum = updated
        .filter((a) => a.category !== lastCat)
        .reduce((s, a) => s + a.targetPct, 0);
      const lastValue = Math.max(0, Math.round(100 - othersSum));
      return updated.map((a) =>
        a.category === lastCat ? { ...a, targetPct: lastValue } : a
      );
    });
  };

  const handleSaveTargets = async () => {
    if (!isValid) return;
    setSavingTargets(true);
    setTargetMsg(null);
    try {
      const res = await fetch("/api/settings/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      if (!res.ok) throw new Error("Failed");
      mutateTargets();
      setTargetMsg("目標配置已儲存");
    } catch {
      setTargetMsg("儲存失敗");
    } finally {
      setSavingTargets(false);
    }
  };

  const handleSaveOcrEngine = async () => {
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ocrEngine", value: ocrEngine }),
      });
      if (!res.ok) throw new Error("Failed");
      mutateSettings();
      setSettingsMsg("OCR 設定已儲存");
    } catch {
      setSettingsMsg("儲存失敗");
    } finally {
      setSavingSettings(false);
    }
  };

  const maskKey = (key: string | undefined) => {
    if (!key) return "未設定";
    if (key.length <= 8) return "****";
    return key.slice(0, 4) + "****" + key.slice(-4);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-400" />
        設定
      </h1>

      <div className="card-premium rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          目標資產配置
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          設定各類資產的目標比例，總和需為 100%。
        </p>

        <div className="space-y-5">
          {allocations.map((a, idx) => {
            const meta = categoryLabels[a.category];
            const isLast = idx === allocations.length - 1;
            return (
              <div key={a.category}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: meta?.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {meta?.label ?? a.category}
                    {isLast && (
                      <span className="text-xs text-gray-400 ml-1">(自動計算)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={a.targetPct}
                    disabled={isLast}
                    onChange={(e) =>
                      updateAllocation(a.category, parseFloat(e.target.value))
                    }
                    className={`flex-1 h-2 rounded-full appearance-none slider-thumb-active ${isLast ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                    style={{
                      background: `linear-gradient(to right, ${meta?.color ?? "#e8b462"} 0%, ${meta?.color ?? "#e8b462"} ${a.targetPct}%, #e5e0dc ${a.targetPct}%, #e5e0dc 100%)`,
                      "--thumb-active-color": meta?.color ?? "#e8b462",
                    } as React.CSSProperties}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={a.targetPct}
                    disabled={isLast}
                    onChange={(e) =>
                      updateAllocation(
                        a.category,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className={`w-20 text-center ${isLast ? "opacity-60" : ""}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <span
              className={`text-sm font-medium ${
                isValid ? "text-[#7e706a]" : "text-[#f44336]"
              }`}
            >
              合計: {totalPct.toFixed(0)}%
            </span>
            {!isValid && (
              <span className="text-xs text-[#f44336] ml-2">
                (需為 100%)
              </span>
            )}
          </div>
          <Button
            onClick={handleSaveTargets}
            disabled={!isValid || savingTargets}
          >
            {savingTargets ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            儲存配置
          </Button>
        </div>
        {targetMsg && (
          <p
            className={`mt-2 text-sm ${
              targetMsg.includes("失敗") ? "text-[#f44336]" : "text-[#7bb155]"
            }`}
          >
            {targetMsg}
          </p>
        )}
      </div>

      <div className="card-premium rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">OCR 辨識引擎</h3>
        <p className="text-sm text-gray-500 mb-4">
          選擇用於截圖辨識的 AI 引擎。
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setOcrEngine("gemini")}
            className={`flex-1 rounded-xl border p-4 text-left transition-colors ${
              ocrEngine === "gemini"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-sm font-medium text-gray-900">Gemini Vision</p>
            <p className="text-xs text-gray-500 mt-1">Google Gemini AI</p>
          </button>
          <button
            onClick={() => setOcrEngine("claude")}
            className={`flex-1 rounded-xl border p-4 text-left transition-colors ${
              ocrEngine === "claude"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-sm font-medium text-gray-900">Claude Vision</p>
            <p className="text-xs text-gray-500 mt-1">Anthropic Claude AI</p>
          </button>
        </div>

        <Button onClick={handleSaveOcrEngine} disabled={savingSettings}>
          {savingSettings ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          儲存 OCR 設定
        </Button>
        {settingsMsg && (
          <p
            className={`mt-2 text-sm ${
              settingsMsg.includes("失敗")
                ? "text-[#f44336]"
                : "text-[#7bb155]"
            }`}
          >
            {settingsMsg}
          </p>
        )}
      </div>

      <div className="card-premium rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h3>
        <p className="text-sm text-gray-500 mb-4">
          API keys 設定於環境變數 (.env)，此處僅顯示狀態。
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
            <span className="text-sm text-gray-700">Gemini API Key</span>
            <span className="text-sm text-gray-400 font-mono">
              {maskKey(settings?.geminiApiKey)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
            <span className="text-sm text-gray-700">Claude API Key</span>
            <span className="text-sm text-gray-400 font-mono">
              {maskKey(settings?.claudeApiKey)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
