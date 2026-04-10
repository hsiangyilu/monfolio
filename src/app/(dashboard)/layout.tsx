import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="md:ml-[220px] lg:ml-[260px] min-h-screen pb-20 md:pb-0">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
      <MobileNav />
    </>
  );
}
