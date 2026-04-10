"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

function UserAvatar({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (src) {
    return (
      <Image
        src={src}
        alt={name || "User avatar"}
        width={size}
        height={size}
        className="rounded-full border-2 border-white/20 shrink-0"
      />
    );
  }

  return (
    <div
      className="rounded-full bg-[#e8b462] flex items-center justify-center text-[#3d2b2f] font-bold shrink-0 border-2 border-white/20"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden md:flex md:flex-col md:w-[220px] lg:w-[260px] h-screen fixed left-0 top-0 z-40 border-r border-white/[0.12] bg-[#3d2b2f]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-8 h-8 rounded-lg bg-[#e8b462] flex items-center justify-center">
          <span className="text-[#3d2b2f] font-bold text-sm">M</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          monfolio
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

      {/* User menu */}
      <div className="px-4 py-4 border-t border-white/[0.12]">
        {session?.user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={session.user.image}
                name={session.user.name}
                size={32}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/80 font-medium truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-white/40 hover:text-white transition-colors text-left"
            >
              登出
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-white/30 text-left tracking-wider">
            monfolio v0.1
          </p>
        )}
      </div>
    </aside>
  );
}

export { UserAvatar };
