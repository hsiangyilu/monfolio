"use client";

import { useMemo } from "react";

interface TopBannerProps {
  quotes: Array<{ text: string; textZh: string; author: string }>;
}

export default function TopBanner({ quotes }: TopBannerProps) {
  const quote = useMemo(() => {
    if (quotes.length === 0) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return quotes[dayOfYear % quotes.length];
  }, [quotes]);

  if (!quote) return null;

  return (
    <div className="w-full px-1 py-2">
      <p className="text-xl md:text-2xl font-medium text-[#7e706a] italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="mt-1.5 text-xs text-[#7e706a]">
        {quote.textZh}
      </p>
      <p className="mt-1 text-xs text-[#7e706a]/60">
        &mdash; {quote.author}
      </p>
    </div>
  );
}
