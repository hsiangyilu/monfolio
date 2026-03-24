"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Home,
  Settings,
  Plus,
  Save,
  Trash2,
  Edit3,
  Globe,
  Bitcoin,
  Wallet,
  CreditCard,
} from "lucide-react";

/* ───────── palette data ───────── */
const corePalette = [
  { name: "Aqua Haze", hex: "#F4F7F9", token: "--background", dark: false },
  { name: "Antique Brass", hex: "#CD7B65", token: "--accent", dark: true },
  { name: "Porsche / Gold", hex: "#E8B462", token: "--primary", dark: false },
  { name: "Americano", hex: "#7E706A", token: "--muted-foreground", dark: true },
  { name: "Woody Brown", hex: "#3D2B2F", token: "--foreground", dark: true },
];

const semanticColors = [
  { name: "Success / Gain", hex: "#7BB155", token: "--color-gain" },
  { name: "Warning", hex: "#F8A01D", token: "crypto" },
  { name: "Danger / Loss", hex: "#F44336", token: "--destructive" },
  { name: "Border", hex: "#E5E0DC", token: "--border" },
  { name: "Card", hex: "#FFFFFF", token: "--card" },
];

const chartColors = [
  { name: "Chart 1 — 台股", hex: "#E8B462" },
  { name: "Chart 2 — 美股", hex: "#CD7B65" },
  { name: "Chart 3 — 現金", hex: "#7BB155" },
  { name: "Chart 4 — 負債", hex: "#F44336" },
  { name: "Chart 5 — 其他", hex: "#7E706A" },
];

const categoryMeta = [
  { key: "tw_stock", label: "台股", color: "#E8B462", icon: TrendingUp },
  { key: "us_stock", label: "美股", color: "#CD7B65", icon: Globe },
  { key: "crypto", label: "虛擬貨幣", color: "#F8A01D", icon: Bitcoin },
  { key: "cash", label: "現金", color: "#7BB155", icon: Wallet },
  { key: "debt", label: "負債", color: "#F44336", icon: CreditCard },
];

const typeSamples = [
  { label: "Page Title", className: "text-2xl font-bold text-gray-900", text: "總覽 Overview" },
  { label: "Section Title", className: "text-lg font-semibold text-gray-900", text: "目標資產配置" },
  { label: "Net Worth", className: "text-4xl md:text-5xl font-bold tabular-nums text-gray-900", text: "NT$ 1,511,299" },
  { label: "Quote (EN)", className: "text-xl md:text-2xl font-medium italic text-[#7e706a]", text: '"In investing, what is comfortable is rarely profitable."' },
  { label: "Quote (ZH)", className: "text-xs text-[#7e706a]", text: "在投資中，舒服的東西很少能帶來利潤。" },
  { label: "Body", className: "text-sm text-gray-700", text: "設定各類資產的目標比例，總和需為 100%。" },
  { label: "Caption / Muted", className: "text-xs text-[#7e706a]", text: "MoneyFlow v0.1 · 最後更新 3 分鐘前" },
  { label: "Label (Uppercase)", className: "text-xs font-medium tracking-wider uppercase text-gray-400", text: "TOTAL NET WORTH" },
  { label: "Tabular Numbers", className: "text-sm font-semibold tabular-nums text-gray-900", text: "NT$ 936,021" },
];

const radiusScale = [
  { label: "sm", value: "7.2px", tw: "rounded-sm" },
  { label: "md", value: "9.6px", tw: "rounded-md" },
  { label: "lg (base)", value: "12px", tw: "rounded-lg" },
  { label: "xl", value: "16.8px", tw: "rounded-xl" },
  { label: "2xl", value: "19.2px", tw: "rounded-2xl" },
];

/* ───────── section wrapper ───────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b border-[#e5e0dc] pb-2">{title}</h2>
      {children}
    </section>
  );
}

function ColorSwatch({ hex, name, token, large, dark }: { hex: string; name: string; token?: string; large?: boolean; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`${large ? "w-24 h-24" : "w-16 h-16"} rounded-2xl border border-[#e5e0dc] shadow-sm flex items-center justify-center`}
        style={{ backgroundColor: hex }}
      >
        <span className={`text-[10px] font-mono font-medium ${dark ? "text-white" : "text-gray-800"}`}>{hex}</span>
      </div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{name}</span>
      {token && <span className="text-[10px] font-mono text-[#7e706a]">{token}</span>}
    </div>
  );
}

/* ───────── page ───────── */
export default function DesignSystemPage() {
  const [sliderVal, setSliderVal] = useState(40);

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">MoneyFlow Design System</h1>
        <p className="text-sm text-[#7e706a]">v1.0 · Visual Reference · Colormind Warm Palette</p>
      </div>

      {/* ━━━ 1. CORE PALETTE ━━━ */}
      <Section title="1. Core Palette">
        <div className="flex flex-wrap gap-4">
          {corePalette.map((c) => (
            <ColorSwatch key={c.hex} hex={c.hex} name={c.name} token={c.token} large dark={c.dark} />
          ))}
        </div>
        {/* Gradient bar */}
        <div className="h-10 rounded-xl overflow-hidden flex mt-2">
          {corePalette.map((c) => (
            <div key={c.hex} className="flex-1" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      </Section>

      {/* ━━━ 2. SEMANTIC COLORS ━━━ */}
      <Section title="2. Semantic Colors">
        <div className="flex flex-wrap gap-4">
          {semanticColors.map((c) => (
            <ColorSwatch key={c.hex} hex={c.hex} name={c.name} token={c.token} dark={c.hex !== "#FFFFFF" && c.hex !== "#E5E0DC"} />
          ))}
        </div>
      </Section>

      {/* ━━━ 3. CHART / CATEGORY COLORS ━━━ */}
      <Section title="3. Chart &amp; Category Colors">
        <div className="grid grid-cols-5 gap-3">
          {chartColors.map((c) => (
            <div key={c.hex} className="flex flex-col items-center gap-2">
              <div className="w-full h-8 rounded-lg" style={{ backgroundColor: c.hex }} />
              <span className="text-xs text-gray-600 text-center">{c.name}</span>
              <span className="text-[10px] font-mono text-[#7e706a]">{c.hex}</span>
            </div>
          ))}
        </div>
        {/* Category icons */}
        <div className="flex flex-wrap gap-3 mt-4">
          {categoryMeta.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="card-premium rounded-xl p-3 flex items-center gap-3 min-w-[140px]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + "15" }}>
                  <Icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{cat.label}</div>
                  <div className="text-[10px] font-mono text-[#7e706a]">{cat.color}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ━━━ 4. TYPOGRAPHY ━━━ */}
      <Section title="4. Typography">
        <div className="card-premium rounded-2xl p-6 space-y-5">
          <div className="space-y-1 mb-4">
            <p className="text-xs font-mono text-[#7e706a]">Font Stack</p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">English:</span> Geist Sans &nbsp;|&nbsp;
              <span className="font-semibold">中文 Fallback:</span> PingFang TC → Noto Sans TC → Microsoft JhengHei
            </p>
          </div>
          {typeSamples.map((t, i) => (
            <div key={i} className="flex flex-col gap-1 pb-4 border-b border-[#e5e0dc] last:border-none last:pb-0">
              <span className="text-[10px] font-mono text-[#cd7b65] uppercase tracking-wider">{t.label}</span>
              <p className={t.className}>{t.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ━━━ 5. BORDER RADIUS ━━━ */}
      <Section title="5. Border Radius">
        <div className="flex flex-wrap items-end gap-4">
          {radiusScale.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-1.5">
              <div
                className="w-16 h-16 bg-[#e8b462]/15 border-2 border-[#e8b462]"
                style={{ borderRadius: r.value }}
              />
              <span className="text-xs font-semibold text-gray-700">{r.label}</span>
              <span className="text-[10px] font-mono text-[#7e706a]">{r.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ━━━ 6. SHADOWS ━━━ */}
      <Section title="6. Elevation / Shadows">
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-20 rounded-2xl bg-white border border-[#e5e0dc]" style={{ boxShadow: "none" }} />
            <span className="text-xs text-gray-600">Flat (no shadow)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="card-premium w-32 h-20" />
            <span className="text-xs text-gray-600">.card-premium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-20 rounded-2xl bg-white border border-[#e5e0dc]" style={{ boxShadow: "0 4px 20px rgba(61,43,47,0.1)" }} />
            <span className="text-xs text-gray-600">Elevated</span>
          </div>
        </div>
      </Section>

      {/* ━━━ 7. COMPONENTS ━━━ */}
      <Section title="7. Components">

        {/* 7.1 Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.1 Buttons</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800 border-none">
              <Plus className="w-4 h-4 mr-1" />新增
            </Button>
            <Button className="bg-[#e8b462] text-[#3d2b2f] hover:bg-[#daa74e]">
              <Save className="w-4 h-4 mr-2" />儲存配置
            </Button>
            <Button variant="outline" size="sm">
              <Edit3 className="w-4 h-4 mr-1" />編輯
            </Button>
            <Button variant="ghost" size="sm" className="text-[#f44336] hover:bg-[#f44336]/10">
              <Trash2 className="w-4 h-4 mr-1" />刪除
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Disabled
            </Button>
          </div>
        </div>

        {/* 7.2 Inputs */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.2 Inputs</h3>
          <div className="flex flex-wrap items-center gap-3 max-w-md">
            <Input placeholder="輸入股票代號..." className="flex-1" />
            <Input type="number" value={30} className="w-20 text-center" readOnly />
          </div>
        </div>

        {/* 7.3 Range Slider */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.3 Range Slider</h3>
          <div className="max-w-md flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderVal}
              onChange={(e) => setSliderVal(parseInt(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer slider-thumb-active"
              style={{
                background: `linear-gradient(to right, #e8b462 0%, #e8b462 ${sliderVal}%, #e5e0dc ${sliderVal}%, #e5e0dc 100%)`,
                "--thumb-active-color": "#e8b462",
              } as React.CSSProperties}
            />
            <span className="text-sm font-semibold tabular-nums text-gray-900 w-10 text-right">{sliderVal}%</span>
          </div>
          <p className="text-xs text-[#7e706a]">Thumb: white circle + border → hover/active border matches category color with 20% glow ring</p>
        </div>

        {/* 7.4 Badges */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.4 Badges (Gain / Loss)</h3>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f44336]/10 text-[#f44336]">
              <TrendingUp className="w-3.5 h-3.5" /> +2.35%
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#7bb155]/10 text-[#7bb155]">
              <TrendingDown className="w-3.5 h-3.5" /> -1.65%
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              +0.00%
            </span>
          </div>
        </div>

        {/* 7.5 Card */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.5 Card (.card-premium)</h3>
          <div className="card-premium rounded-2xl p-5 max-w-sm">
            <p className="text-xs font-medium tracking-wider uppercase text-gray-400 mb-1">TOTAL NET WORTH</p>
            <p className="text-3xl font-bold tabular-nums text-gray-900">NT$ 1,511,299</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f44336]/10 text-[#f44336]">
                <TrendingDown className="w-3 h-3" /> -2.29%
              </span>
              <span className="text-xs text-gray-400">NT$ -35,387 today</span>
            </div>
          </div>
        </div>

        {/* 7.6 Category Row */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.6 Category Row</h3>
          <div className="space-y-2 max-w-md">
            {[
              { label: "台股", pct: "61.9%", amount: "NT$ 936,021", color: "#E8B462", Icon: TrendingUp, w: "62%" },
              { label: "美股", pct: "28.2%", amount: "NT$ 426,098", color: "#CD7B65", Icon: Globe, w: "28%" },
              { label: "現金", pct: "6.6%", amount: "NT$ 100,000", color: "#7BB155", Icon: Wallet, w: "7%" },
            ].map((r) => (
              <div key={r.label} className="card-premium rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: r.color + "15" }}>
                      <r.Icon className="w-4 h-4" style={{ color: r.color }} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{r.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{r.pct}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">{r.amount}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: r.w, backgroundColor: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7.7 Sidebar Preview */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.7 Sidebar</h3>
          <div className="glass-card rounded-2xl p-4 w-56 space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#e8b462] flex items-center justify-center">
                <span className="text-[#3d2b2f] font-bold text-sm">M</span>
              </div>
              <span className="text-white font-semibold text-sm">MoneyFlow</span>
            </div>
            {[
              { label: "Overview", icon: Home, active: true },
              { label: "台股", icon: TrendingUp, active: false },
              { label: "美股", icon: Globe, active: false },
              { label: "Settings", icon: Settings, active: false },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    item.active
                      ? "bg-[#e8b462]/15 text-[#e8b462] font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* 7.8 Quote Banner */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.8 Quote Banner</h3>
          <div className="py-2">
            <p className="text-xl md:text-2xl font-medium text-[#7e706a] italic leading-relaxed">
              &ldquo;In investing, what is comfortable is rarely profitable.&rdquo;
            </p>
            <p className="mt-1.5 text-xs text-[#7e706a]">在投資中，舒服的東西很少能帶來利潤。</p>
            <p className="mt-1 text-xs text-[#7e706a]/60">&mdash; Robert Arnott</p>
          </div>
        </div>

        {/* 7.9 Mask Toggle */}
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-[#7e706a] uppercase tracking-wider">7.9 Mask Toggle</h3>
          <div className="flex items-center gap-4">
            <div className="card-premium rounded-xl px-4 py-3 flex items-center gap-3">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-lg font-bold tabular-nums text-gray-900">NT$ 1,511,299</span>
            </div>
            <div className="card-premium rounded-xl px-4 py-3 flex items-center gap-3">
              <EyeOff className="w-4 h-4 text-gray-400" />
              <span className="text-lg font-bold tabular-nums text-gray-900">NT$ ••••</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ━━━ 8. SPACING ━━━ */}
      <Section title="8. Spacing &amp; Layout">
        <div className="card-premium rounded-2xl p-5 space-y-4">
          <div className="text-xs font-mono text-[#7e706a] space-y-2">
            <p><span className="text-gray-900 font-semibold">Sidebar:</span> 220px (md) / 260px (lg)</p>
            <p><span className="text-gray-900 font-semibold">Content padding:</span> p-4 (mobile) → p-6 (tablet) → p-8 (desktop)</p>
            <p><span className="text-gray-900 font-semibold">Section gap:</span> space-y-6 (24px)</p>
            <p><span className="text-gray-900 font-semibold">Card padding:</span> p-5 ~ p-6 (20–24px)</p>
          </div>
          {/* Visual spacing demo */}
          <div className="flex items-end gap-2 mt-2">
            {[4, 8, 12, 16, 20, 24, 32].map((px) => (
              <div key={px} className="flex flex-col items-center gap-1">
                <div className="bg-[#e8b462]/20 border border-[#e8b462]/40" style={{ width: px, height: px }} />
                <span className="text-[9px] font-mono text-[#7e706a]">{px}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ 9. SCROLLBAR ━━━ */}
      <Section title="9. Scrollbar">
        <div className="flex items-center gap-4">
          <div className="w-2 h-20 rounded-full bg-[#d5ccc8]" />
          <div className="space-y-1">
            <p className="text-xs text-gray-700">Thumb: <span className="font-mono">#D5CCC8</span></p>
            <p className="text-xs text-gray-700">Hover: <span className="font-mono">#7E706A</span></p>
            <p className="text-xs text-gray-700">Width: 6px, border-radius: 3px</p>
          </div>
        </div>
      </Section>

      {/* ━━━ 10. NUMBER FORMAT ━━━ */}
      <Section title="10. Number Formatting">
        <div className="card-premium rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-[#7e706a] uppercase tracking-wider">Context</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#7e706a] uppercase tracking-wider">Format</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#7e706a] uppercase tracking-wider">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e0dc]">
              {[
                ["Total Net Worth", "NT$ X,XXX,XXX", "NT$ 1,511,299"],
                ["Asset Amount", "NT$ X,XXX,XXX", "NT$ 936,021"],
                ["Masked", "NT$ ••••", "NT$ ••••"],
                ["Percentage", "±X.XX%", "-2.29%"],
                ["Currency Rate", "XX.XX", "31.00"],
              ].map(([ctx, fmt, ex], i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-700">{ctx}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[#7e706a]">{fmt}</td>
                  <td className="px-4 py-2.5 font-semibold tabular-nums text-gray-900">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ━━━ 11. TECH STACK ━━━ */}
      <Section title="11. Tech Stack">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Framework", value: "Next.js 15" },
            { label: "Language", value: "TypeScript" },
            { label: "Styling", value: "Tailwind CSS v4" },
            { label: "Components", value: "shadcn/ui" },
            { label: "Charts", value: "Recharts" },
            { label: "Data Fetching", value: "SWR" },
            { label: "Database", value: "Prisma + SQLite" },
            { label: "Icons", value: "Lucide React" },
          ].map((t) => (
            <div key={t.label} className="card-premium rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#7e706a] mb-0.5">{t.label}</p>
              <p className="text-sm font-semibold text-gray-900">{t.value}</p>
            </div>
          ))}
        </div>
      </Section>

      <p className="text-xs text-[#7e706a] text-center pb-8">MoneyFlow Design System v1.0 · Generated 2026-03-23</p>
    </div>
  );
}
