import { MainNav } from "@/components/main-nav";
import { Header } from "@/components/header";

export function DashboardShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-white">
          <MainNav />
        </aside>
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
