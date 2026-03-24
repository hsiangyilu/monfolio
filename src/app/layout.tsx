import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MoneyFlow - 資產管理",
  description: "個人資產管理儀表板 - 追蹤台股、美股、虛擬貨幣、現金與負債",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gradient-dark min-h-screen`}
      >
        <TooltipProvider>
          <Sidebar />
          <main className="md:ml-[220px] lg:ml-[260px] min-h-screen pb-20 md:pb-0">
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </main>
          <MobileNav />
        </TooltipProvider>
      </body>
    </html>
  );
}
