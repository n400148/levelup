import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative max-w-[430px] min-h-screen mx-auto bg-[var(--bg)] flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 relative z-[1]">{children}</main>
      <BottomNav />
    </div>
  );
}
