# MoneyFlow Design System

> 版本 1.0 | 2026-03-23 | Next.js 15 + Tailwind CSS v4 + shadcn/ui

---

## 1. Color Palette

### 1.1 Core Palette (Colormind Warm Scheme)

| Token | Hex | Name | Usage |
|---|---|---|---|
| `--background` | `#F4F7F9` | Aqua Haze | Page background |
| `--foreground` | `#3D2B2F` | Woody Brown | Primary text |
| `--primary` | `#E8B462` | Porsche / Gold Amber | Brand accent, CTA, active state |
| `--accent` | `#CD7B65` | Antique Brass / Coral | Secondary accent, hover, links |
| `--muted-foreground` | `#7E706A` | Americano / Warm Gray | Subtitle, caption, muted text |
| `--border` | `#E5E0DC` | Warm border | Card border, divider, input border |
| `--card` | `#FFFFFF` | White | Card background |
| `--sidebar` | `#3D2B2F` | Woody Brown | Sidebar background |

### 1.2 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-gain` | `#7BB155` | Positive return, success |
| `--color-loss` / `--destructive` | `#F44336` | Negative return, error, danger |
| `--ring` | `#E8B462` | Focus ring |

### 1.3 Chart Colors

| Token | Hex | Mapped to |
|---|---|---|
| `--chart-1` | `#E8B462` | Gold — Taiwan Stock |
| `--chart-2` | `#CD7B65` | Coral — US Stock |
| `--chart-3` | `#7BB155` | Green — Cash |
| `--chart-4` | `#F44336` | Red — Debt |
| `--chart-5` | `#7E706A` | Warm Gray — Others |

### 1.4 Category Colors

| Category | Key | Color | Hex |
|---|---|---|---|
| Taiwan Stock | `tw_stock` | Gold Amber | `#E8B462` |
| US Stock | `us_stock` | Antique Brass | `#CD7B65` |
| Crypto | `crypto` | Warning Orange | `#F8A01D` |
| Cash | `cash` | Success Green | `#7BB155` |
| Debt | `debt` | Danger Red | `#F44336` |

### 1.5 Sidebar Colors

| Token | Value | Usage |
|---|---|---|
| `--sidebar` | `#3D2B2F` | Background |
| `--sidebar-primary` | `#E8B462` | Active nav, logo accent |
| `--sidebar-foreground` | `#E5E0DC` | Default text |
| `--sidebar-accent` | `rgba(255,255,255,0.08)` | Hover background |
| `--sidebar-border` | `rgba(255,255,255,0.12)` | Divider |

---

## 2. Typography

### 2.1 Font Stack

```css
--font-sans: Geist Sans, "PingFang TC", "PingFang SC", "Noto Sans TC",
             "Microsoft JhengHei", "Helvetica Neue", Arial, sans-serif;
--font-mono: Geist Mono, "SF Mono", "Menlo", "Monaco", monospace;
```

- **English**: Geist Sans (Google Fonts, Latin subset)
- **Chinese fallback**: PingFang TC (macOS) → Noto Sans TC (cross-platform) → Microsoft JhengHei (Windows)
- **Antialiasing**: `-webkit-font-smoothing: antialiased`

### 2.2 Type Scale

| Element | Class | Size | Weight | Color |
|---|---|---|---|---|
| Page title | `text-2xl font-bold` | 24px | 700 | `text-gray-900` |
| Card title / Section | `text-lg font-semibold` | 18px | 600 | `text-gray-900` |
| Subtitle / Description | `text-sm` | 14px | 400 | `text-gray-500` |
| Muted text | `text-xs` | 12px | 400 | `text-[#7e706a]` |
| Total Net Worth | `text-4xl md:text-5xl font-bold tabular-nums` | 36–48px | 700 | `text-gray-900` |
| Asset amount | `text-sm font-semibold tabular-nums` | 14px | 600 | `text-gray-900` |
| Quote (EN) | `text-xl md:text-2xl font-medium italic` | 20–24px | 500 | `text-[#7e706a]` |
| Quote (ZH) | `text-xs` | 12px | 400 | `text-[#7e706a]` |
| Label (uppercase) | `text-xs font-medium tracking-wider uppercase` | 12px | 500 | `text-gray-400` |

---

## 3. Spacing & Layout

### 3.1 Page Layout

```
┌──────────┬──────────────────────────────┐
│ Sidebar  │  Main Content                │
│ 220–260px│  padding: 16–32px            │
│ (fixed)  │                              │
│          │                              │
└──────────┴──────────────────────────────┘
              └── Mobile: Bottom Nav ──┘
```

| Breakpoint | Sidebar Width | Content Padding |
|---|---|---|
| `< md` (mobile) | Hidden | `p-4` (16px) |
| `md` (768px+) | `220px` | `p-6` (24px) |
| `lg` (1024px+) | `260px` | `p-8` (32px) |

### 3.2 Spacing Tokens

| Usage | Value |
|---|---|
| Section gap | `space-y-6` (24px) |
| Card inner padding | `p-5` to `p-6` (20–24px) |
| Element gap (small) | `gap-2` (8px) |
| Element gap (medium) | `gap-3` (12px) |
| Element gap (large) | `gap-4` (16px) |

### 3.3 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius` (base) | `0.75rem` (12px) | Base unit |
| `--radius-sm` | `7.2px` | Small inputs |
| `--radius-md` | `9.6px` | Buttons |
| `--radius-lg` | `12px` | Cards, dialogs |
| `--radius-xl` | `16.8px` | Large cards |
| `.card-premium` | `16px` | Main content cards |

---

## 4. Components

### 4.1 Card (`.card-premium`)

```css
.card-premium {
  background: #ffffff;
  border: 1px solid #e5e0dc;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(61, 43, 47, 0.04),
              0 4px 12px rgba(61, 43, 47, 0.03);
}
```

- White background, warm gray border
- Subtle dual-layer shadow using Woody Brown alpha
- 16px border-radius

### 4.2 Sidebar (`.glass-card`)

```css
.glass-card {
  background: #3d2b2f;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

| State | Style |
|---|---|
| Default nav item | `text-white/60` |
| Hover | `text-white hover:bg-white/[0.06]` |
| Active | `bg-[#e8b462]/15 text-[#e8b462]` |
| Logo badge | `bg-[#e8b462]` with `text-[#3d2b2f]` |

### 4.3 Buttons

| Variant | Style |
|---|---|
| Primary (Add) | `bg-gray-900 text-white hover:bg-gray-800 border-none size="sm"` |
| Save / CTA | `bg-[#e8b462] text-[#3d2b2f]` (default shadcn Button) |
| Destructive | `text-[#f44336]` |

### 4.4 Input

- Border: `border-input` (`#e5e0dc`)
- Focus: `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`
- Focus ring color: `#e8b462` (gold) at 50% opacity

### 4.5 Range Slider

```css
/* Thumb: white circle + warm border */
input[type="range"]::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #e5e0dc;
  box-shadow: 0 1px 3px rgba(61, 43, 47, 0.12);
}

/* Active: border matches category color via CSS variable */
input[type="range"]::-webkit-slider-thumb:hover,
input[type="range"]::-webkit-slider-thumb:active {
  border-color: var(--thumb-active-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--thumb-active-color) 20%, transparent);
}
```

- Track uses `linear-gradient` with category color
- Active glow uses `color-mix()` for 20% opacity ring

### 4.6 Badge (Gain/Loss)

| State | Background | Text |
|---|---|---|
| Positive | `bg-[#7bb155]/10` | `text-[#7bb155]` |
| Negative | `bg-[#f44336]/10` | `text-[#f44336]` |
| Neutral | `bg-gray-100` | `text-gray-500` |

### 4.7 Category Row (Asset List)

```
┌─ Icon (40px, rounded, category bg/10) ─┬─ Name ──────────┬─ Amount (NT$ format) ─ > ┐
│  📈                                     │  台股            │  NT$ 936,021             │
│                                         │  61.9%           │                          │
├─────────────────────────────────────────┴──────────────────┴──────────────────────────┤
│  ████████████████████░░░░░░░░  (progress bar, category color)                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.8 Quote Banner (Top Banner)

```
"In investing, what is comfortable is rarely profitable."
在投資中，舒服的東西很少能帶來利潤。
— Robert Arnott
```

- No card wrapper (no white background)
- English: `text-xl md:text-2xl font-medium italic text-[#7e706a]`
- Chinese: `text-xs text-[#7e706a]`
- Author: `text-xs text-[#7e706a]/60`

### 4.9 Mobile Bottom Nav

| Property | Value |
|---|---|
| Background | `bg-white` |
| Border | `border-t border-gray-200` |
| Text default | `text-gray-400` |
| Text active | `text-gray-900` |
| Safe area | `pb-[env(safe-area-inset-bottom)]` |

---

## 5. Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d5ccc8; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #7e706a; }
```

---

## 6. Number Formatting

| Context | Format | Example |
|---|---|---|
| Total Net Worth | `NT$ X,XXX,XXX` | NT$ 1,511,299 |
| Asset amounts | `NT$ X,XXX,XXX` | NT$ 936,021 |
| Masked mode | `NT$ ••••` | NT$ •••• |
| Percentage | `X.XX%` | -2.29% |
| Currency rate | `XX.XX` | 31.00 |

---

## 7. Interaction States

| Element | State | Effect |
|---|---|---|
| Card | Hover | — (static) |
| Category row | Hover | `hover:bg-gray-50` |
| Nav item | Hover | `bg-white/[0.06]` |
| Nav item | Active | `bg-[#e8b462]/15 text-[#e8b462]` |
| Button | Hover | Background darkens (gray-800) |
| Slider thumb | Hover/Active | Border = category color + glow ring |
| Focus ring | All inputs | `ring-3 ring-[#e8b462]/50` |

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline`) |
| Components | shadcn/ui (Dialog, Button, Input, Table, Tooltip) |
| Charts | Recharts (AreaChart, PieChart, LineChart) |
| Data fetching | SWR |
| Database | Prisma + SQLite (Turso) |
| Icons | Lucide React |
| Fonts | Google Fonts (Geist Sans / Geist Mono) |

---

## 9. File Structure (Design-related)

```
src/
├── app/
│   ├── globals.css              ← Design tokens, utility classes
│   ├── layout.tsx               ← Root layout, font loading
│   └── (dashboard)/
│       ├── cash/page.tsx
│       ├── debt/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx          ← Dark sidebar navigation
│   │   ├── mobile-nav.tsx       ← Bottom mobile nav
│   │   └── top-banner.tsx       ← Quote banner
│   ├── cards/
│   │   └── summary-card.tsx     ← Reusable stat card
│   ├── charts/
│   │   ├── net-worth-chart.tsx  ← Area chart
│   │   ├── allocation-pie.tsx   ← Pie chart
│   │   ├── asset-line-chart.tsx ← Line chart
│   │   └── debt-progress.tsx    ← Progress bar
│   ├── pages/
│   │   ├── home-page.tsx        ← Overview dashboard
│   │   └── category-detail-page.tsx
│   ├── holdings/
│   │   └── holdings-table.tsx   ← Data table with CRUD
│   └── ocr/
│       ├── screenshot-upload.tsx
│       └── ocr-preview.tsx
```
