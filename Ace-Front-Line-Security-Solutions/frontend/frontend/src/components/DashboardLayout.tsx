import { Link, Outlet, useLocation } from "react-router-dom";
import { Shield, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarItem {
  label: string;
  path: string;
}

interface DashboardLayoutProps {
  title: string;
  role: string;
  items: SidebarItem[];
  basePath: string;
}

const DashboardLayout = ({ title, role, items, basePath }: DashboardLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1B] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-[#FFD700]/30">
          <Link to="/" className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-[#FFD700]" />
            <div className="leading-none">
              <p className="font-extrabold text-sm uppercase tracking-tight text-white">Ace Front Line</p>
              <p className="text-[9px] tracking-[0.2em] text-white/50 uppercase mt-0.5">{role}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const fullPath = `${basePath}/${item.path}`;
            const isActive = location.pathname === fullPath || (item.path === "dashboard" && location.pathname === basePath);
            return (
              <Link
                key={item.path}
                to={fullPath}
                className={cn(
                  "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#FFD700] text-[#1A1A1B] font-bold"
                    : "text-white/70 hover:bg-[#FFD700]/15 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link to={`${basePath}/profile`} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-[#FFD700]/15 hover:text-white transition-all">
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link to="/" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="h-4 w-4" /> Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-background">
        <header className="h-16 border-b bg-[#1A1A1B] px-8 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#FFD700]">{role}</p>
              <p className="text-[10px] text-white/50">Logged in</p>
            </div>
            <Link to={`${basePath}/profile`}>
              <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-[#FFD700] transition-all">
                <AvatarFallback className="bg-[#FFD700]/20 text-[#FFD700] font-bold text-sm">
                  {role.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
