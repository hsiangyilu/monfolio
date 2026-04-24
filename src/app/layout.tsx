import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "monfolio - 資產管理",
  description: "個人資產管理儀表板 - 追蹤台股、美股、虛擬貨幣、現金與負債",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className="font-sans antialiased bg-gradient-dark min-h-screen"
        style={
          {
            "--font-geist-sans":
              '"SF Pro Text", "PingFang TC", "PingFang SC", "Noto Sans TC", "Microsoft JhengHei", "Helvetica Neue", Arial, sans-serif',
            "--font-geist-mono":
              '"SF Mono", "Menlo", "Monaco", "Courier New", monospace',
          } as CSSProperties
        }
      >
        <Providers>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
