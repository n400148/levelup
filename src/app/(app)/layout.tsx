import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative max-w-[430px] min-h-screen mx-auto bg-black flex flex-col">
      <div className="fixed inset-0 max-w-[430px] mx-auto app-grid-bg pointer-events-none" />
      <Header />
      <main className="flex-1 overflow-y-auto px-3.5 pt-3.5 pb-24 relative z-[1]">{children}</main>
      <BottomNav />
    </div>
  );
}
