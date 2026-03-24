"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-[220px] lg:w-[260px] h-screen fixed left-0 top-0 z-40 border-r border-white/[0.12] bg-[#3d2b2f]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-8 h-8 rounded-lg bg-[#e8b462] flex items-center justify-center">
          <span className="text-[#3d2b2f] font-bold text-sm">M</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          MoneyFlow
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.slug}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-[#e8b462]/15 text-[#e8b462]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isActive ? "text-[#e8b462]" : ""
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-white/[0.12]">
        <p className="text-[10px] text-white/30 text-center tracking-wider">
          MoneyFlow v0.1
        </p>
      </div>
    </aside>
  );
}
