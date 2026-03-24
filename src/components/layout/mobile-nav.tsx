"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {mobileNavItems.map((item) => {
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
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-gray-900"
                  : "text-gray-400"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive && "text-gray-900"
                )}
              />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
