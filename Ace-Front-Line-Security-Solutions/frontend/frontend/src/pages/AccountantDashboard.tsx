import { useState, useEffect } from "react";
import { FileText, DollarSign, BarChart3, CreditCard, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PayrollContent, { type PayrollSubTab } from "./accountant/PayrollContent";
import InvoicesContent from "./accountant/InvoicesContent";
import ReportsContent from "./accountant/ReportsContent";
import LoanApprovalsContent from "./accountant/LoanApprovalsContent";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardCard from "@/components/DashboardCard";
import ProfilePage from "@/pages/ProfilePage";

type MainTabType = "dashboard" | "payroll" | "invoices" | "reports";
type PayrollCategoryType = "admin" | "security";
type InvoicesSubTab = "invoices" | "payments" | "deductions";

export default function AccountantDashboard() {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>("dashboard");
  const [activePayrollCategory, setActivePayrollCategory] = useState<PayrollCategoryType>("admin");
  const [activePayrollTab, setActivePayrollTab] = useState<PayrollSubTab>("salary-trend");
  const [activeInvoicesTab, setActiveInvoicesTab] = useState<InvoicesSubTab>("invoices");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isProfile = location.pathname.endsWith("/profile");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  // Reset payroll tab if switching to admin category while on loan tab
  useEffect(() => {
    if (activePayrollCategory === "admin" && activePayrollTab === "loan") {
      setActivePayrollTab("salary-trend");
    }
  }, [activePayrollCategory]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  const payrollSubTabs = [
    { id: "salary-trend", label: "Salary Trend" },
    { id: "generate-payroll", label: "Generate Payroll" },
    { id: "payroll-records", label: "Payroll Records" },
    { id: "advance", label: "Advance" },
    { id: "loan", label: "Loan" },
  ];

  const quickActions = [
    {
      icon: DollarSign,
      title: "Create Payroll",
      description: "Create and submit employee payroll for director approval",
      onClick: () => navigate("/account-executive/payroll/create"),
    },
    {
      icon: DollarSign,
      title: "Bank Submission",
      description: "Send approved payrolls to bank for processing",
      onClick: () => navigate("/account-executive/payroll/bank-submission"),
    },
    {
      icon: BarChart3,
      title: "Payroll Statistics",
      description: "View historical payroll analytics and trends",
      onClick: () => setActiveMainTab("payroll"),
    },
    {
      icon: FileText,
      title: "Invoices",
      description: "Create, track, and manage client invoices",
      onClick: () => setActiveMainTab("invoices"),
    },
    {
      icon: BarChart3,
      title: "Financial Reports",
      description: "View and generate comprehensive financial reports",
      onClick: () => setActiveMainTab("reports"),
    },
  ];

  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          userName={user?.fullName || "Account Executive"}
          userRole="Account Executive"
          onLogout={handleLogout}
          userId={user?.userId || 0}
          backendRole="ACCOUNT_EXECUTIVE"
          profilePath="/account-executive/profile"
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <ProfilePage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader
        userName={user?.fullName || "Account Executive"}
        userRole="Account Executive"
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="ACCOUNT_EXECUTIVE"
        profilePath="/account-executive/profile"
      />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            <button
              onClick={() => setActiveMainTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activeMainTab === "dashboard"
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveMainTab("payroll")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activeMainTab === "payroll"
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                }`}
            >
              <DollarSign className="h-4 w-4" />
              Payroll
            </button>
            <button
              onClick={() => setActiveMainTab("invoices")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activeMainTab === "invoices"
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                }`}
            >
              <FileText className="h-4 w-4" />
              Invoices
            </button>
            <button
              onClick={() => setActiveMainTab("reports")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activeMainTab === "reports"
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                }`}
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Dashboard View */}
        {activeMainTab === "dashboard" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col gap-2 pb-4">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome, <span className="text-primary">{user?.fullName?.split(" ")[0] || "Account Executive"}</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Manage financial operations from your dashboard
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Pending Payroll", value: "12", icon: DollarSign },
                { label: "Outstanding Invoices", value: "8", icon: FileText },
                { label: "Monthly Revenue", value: "Rs. 2.4M", icon: BarChart3 },
              ].map((stat, idx) => (
                <Card key={idx} className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/20">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {quickActions.map((action, idx) => (
                  <DashboardCard
                    key={idx}
                    icon={action.icon}
                    title={action.title}
                    description={action.description}
                    buttonText="Open"
                    onClick={action.onClick}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payroll View */}
        {activeMainTab === "payroll" && (
          <div className="space-y-8">
            {/* Title */}
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-foreground mb-2">Payroll Management</h1>
              <p className="text-muted-foreground">Process and manage staff payroll, advances and loans</p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-3 border-b border-border pb-6">
              <button
                onClick={() => setActivePayrollCategory("admin")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activePayrollCategory === "admin"
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                  }`}
              >
                Admin Personnel
              </button>
              <button
                onClick={() => setActivePayrollCategory("security")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activePayrollCategory === "security"
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                  }`}
              >
                Security Force
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
              {payrollSubTabs
                .filter(tab => {
                  if (tab.id === "loan" && activePayrollCategory === "admin") return false;
                  return true;
                })
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePayrollTab(tab.id as PayrollSubTab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activePayrollTab === tab.id
                      ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>

            {/* Content */}
            <PayrollContent category={activePayrollCategory} subTab={activePayrollTab} />
          </div>
        )}

        {/* Invoices View */}
        {activeMainTab === "invoices" && (
          <div className="space-y-8">
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-foreground mb-2">Invoices</h1>
              <p className="text-muted-foreground">Create, track and manage client invoices</p>
            </div>
            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
              {[
                { id: "invoices", label: "Invoices" },
                { id: "payments", label: "Payments" },
                { id: "deductions", label: "Deductions" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveInvoicesTab(tab.id as InvoicesSubTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activeInvoicesTab === tab.id
                    ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <InvoicesContent subTab={activeInvoicesTab} />
          </div>
        )}

        {/* Reports View */}
        {activeMainTab === "reports" && (
          <div className="space-y-8">
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
              <p className="text-muted-foreground">View and generate comprehensive financial reports</p>
            </div>
            <ReportsContent />
          </div>
        )}
      </main>
    </div>
  );
}
