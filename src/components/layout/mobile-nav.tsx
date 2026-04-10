"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { mobileNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/layout/sidebar";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

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
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] justify-center",
                isActive
                  ? "text-[#3d2b2f]"
                  : "text-gray-400"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-[#3d2b2f]" : "text-gray-400"
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e8b462]" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none mt-0.5",
                isActive ? "font-semibold" : ""
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* User avatar */}
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] min-h-[44px] justify-center"
            >
              <UserAvatar
                src={session.user.image}
                name={session.user.name}
                size={24}
              />
              <span className="text-[10px] font-medium leading-none mt-0.5 text-gray-400">
                我的
              </span>
            </button>

            {/* Popover menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[180px]">
                  <p className="text-sm font-medium text-[#3d2b2f] truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-[#7e706a] truncate mt-0.5">
                    {session.user.email}
                  </p>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-sm text-[#f44336] hover:text-[#f44336]/80 transition-colors"
                  >
                    登出
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
