import { Link, Outlet, useLocation } from "react-router-dom";
import { LogOut, User } from "lucide-react";
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
  const isClientView = basePath.startsWith("/client");
  const userLabel = isClientView
    ? (localStorage.getItem("companyName") || localStorage.getItem("username") || role)
    : (localStorage.getItem("email") || role);
  const userInitials = userLabel
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("companyName");
    localStorage.removeItem("clientId");
    localStorage.removeItem("username");
    localStorage.removeItem("isFirstLogin");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal text-charcoal-foreground flex flex-col shrink-0">
        <div className="p-6 border-b border-charcoal-foreground/10">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Ace Front Line Security Logo" className="h-8 w-8" />
            <div className="leading-none">
              <p className="font-extrabold text-sm uppercase tracking-tight">Ace Front Line</p>
              <p className="text-[9px] tracking-[0.2em] text-charcoal-foreground/50 uppercase mt-0.5">{role}</p>
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
                    ? "bg-primary text-primary-foreground"
                    : "text-charcoal-foreground/70 hover:bg-charcoal-foreground/5 hover:text-charcoal-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-charcoal-foreground/10 space-y-2">
          <Link to={`${basePath}/profile`} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-charcoal-foreground/70 hover:bg-charcoal-foreground/5 hover:text-charcoal-foreground transition-all">
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link
            to="/"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main id="dashboard-main" className="flex-1 bg-background overflow-y-auto">
        <header className="h-16 border-b bg-card px-8 flex items-center justify-between">
          <h1 className="text-base font-extrabold uppercase tracking-tight text-foreground">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{userLabel}</p>
              <p className="text-[10px] text-muted-foreground">Logged in</p>
            </div>
            <Link to={`${basePath}/profile`}>
              <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
