import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  CalendarOff,
  DollarSign,
  Users,
  Loader,
  CalendarClock,
  Building2,
  PieChart,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardCard from "@/components/DashboardCard";
import ProfilePage from "@/pages/ProfilePage";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loanService, type LoanRequest } from "@/services/loanService";
import { advanceService, type AdvanceRequest } from "@/services/advanceService";
import { leaveService, type LeaveRequest } from "@/services/leaveService";
import { paysheetService, type Paysheet } from "@/services/paysheetService";
import { dashboardService } from "@/services/dashboardService";

type TabType =
  | "dashboard"
  | "monthly-report"
  | "salary-trend"
  | "meeting-schedule"
  | "financial-summary"
  | "company-overview"
  | "leave-approval"
  | "registration-list";

export default function ChairmanDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isProfile = location.pathname.endsWith("/profile");

  // Data states
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [advances, setAdvances] = useState<AdvanceRequest[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [paysheets, setPaysheets] = useState<Paysheet[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  // Fetch overview data
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.allSettled([
      dashboardService.getExecutiveDashboard(),
      loanService.getAllLoans(),
      advanceService.getAllAdvances(),
      leaveService.getAllLeaves(),
      paysheetService.getAllPaysheets(),
    ])
      .then(([dashRes, loansRes, advRes, leaveRes, payRes]) => {
        if (dashRes.status === "fulfilled") setDashboardData(dashRes.value);
        if (loansRes.status === "fulfilled") setLoans(loansRes.value);
        if (advRes.status === "fulfilled") setAdvances(advRes.value);
        if (leaveRes.status === "fulfilled") setLeaves(leaveRes.value);
        if (payRes.status === "fulfilled") setPaysheets(payRes.value);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  const tabItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" as TabType },
    { icon: FileText, label: "Monthly Report", id: "monthly-report" as TabType },
    { icon: TrendingUp, label: "Salary Trend", id: "salary-trend" as TabType },
    { icon: CalendarClock, label: "Meeting Schedule", id: "meeting-schedule" as TabType },
    { icon: PieChart, label: "Financial Summary", id: "financial-summary" as TabType },
    { icon: Building2, label: "Company Overview", id: "company-overview" as TabType },
    { icon: CalendarOff, label: "Leave Approval", id: "leave-approval" as TabType },
    { icon: Users, label: "Registration List", id: "registration-list" as TabType },
  ];

  // Helper: status badge
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: "bg-green-500/20 text-green-400",
      REJECTED: "bg-red-500/20 text-red-400",
      PENDING: "bg-yellow-500/20 text-yellow-400",
      APPROVED_BY_AREA_MANAGER: "bg-blue-500/20 text-blue-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-500/20 text-gray-400"}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  // Summary stats
  const totalLoans = loans.length;
  const approvedLoans = loans.filter((l) => l.status === "APPROVED").length;
  const rejectedLoans = loans.filter((l) => l.status === "REJECTED").length;
  const totalAdvances = advances.length;
  const approvedAdvances = advances.filter((a) => a.status === "APPROVED").length;
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING" || l.status === "APPROVED_BY_AREA_MANAGER").length;
  const totalPaysheets = paysheets.length;

  // Monthly salary aggregation for trend / financial summary
  const salaryByMonth = paysheets.reduce<Record<string, { total: number; count: number; deductions: number; allowances: number; loanDed: number; advDed: number }>>((acc, p) => {
    if (!acc[p.month]) acc[p.month] = { total: 0, count: 0, deductions: 0, allowances: 0, loanDed: 0, advDed: 0 };
    acc[p.month].total += p.netSalary;
    acc[p.month].count += 1;
    acc[p.month].deductions += p.deductions;
    acc[p.month].allowances += p.allowances;
    acc[p.month].loanDed += p.loanDeduction || 0;
    acc[p.month].advDed += p.advanceDeduction || 0;
    return acc;
  }, {});
  const sortedMonths = Object.keys(salaryByMonth).sort();

  // Unique users from paysheets
  const uniqueUsers = Array.from(new Map(paysheets.filter((p) => p.user).map((p) => [p.user.id, p.user])).values());

  // Financial totals
  const grandTotalSalary = paysheets.reduce((s, p) => s + p.netSalary, 0);
  const grandTotalLoans = loans.filter((l) => l.status === "APPROVED").reduce((s, l) => s + l.amount, 0);
  const grandTotalAdvances = advances.filter((a) => a.status === "APPROVED").reduce((s, a) => s + a.amount, 0);

  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          userName={user?.fullName || "Chairman"}
          userRole="Chairman"
          onLogout={handleLogout}
          userId={user?.userId || 0}
          backendRole="CHAIRMAN"
          profilePath="/chairman/profile"
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
        userName={user?.fullName || "Chairman"}
        userRole="Chairman"
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="CHAIRMAN"
        profilePath="/chairman/profile"
      />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* ─── Dashboard Tab ─── */}
        {!loading && activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Chairman Dashboard
              </h1>
              <p className="text-muted-foreground">Full oversight of company operations</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Total Loans</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalLoans}</p>
                  <p className="text-xs text-green-400 mt-1">{approvedLoans} approved · {rejectedLoans} rejected</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Total Advances</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalAdvances}</p>
                  <p className="text-xs text-green-400 mt-1">{approvedAdvances} approved</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarOff className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Pending Leaves</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{pendingLeaves}</p>
                  <p className="text-xs text-primary mt-1">awaiting review</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Registered Staff</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{uniqueUsers.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">from paysheet records</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <DashboardCard
                icon={TrendingUp}
                title="Payroll Statistics"
                description="View detailed payroll analytics, trends, and historical data."
                buttonText="View Analytics"
                onClick={() => navigate("/payroll-statistics")}
              />
              <DashboardCard
                icon={PieChart}
                title="Financial Summary"
                description="View overall financial health, total payroll expenditure, and deduction breakdowns."
                buttonText="View Summary"
                onClick={() => setActiveTab("financial-summary")}
              />
              <DashboardCard
                icon={CalendarClock}
                title="Meeting Schedule"
                description="Manage and track upcoming board and team meeting schedules."
                buttonText="View Meetings"
                onClick={() => setActiveTab("meeting-schedule")}
              />
              <DashboardCard
                icon={Building2}
                title="Company Overview"
                description="High-level view of company structure, staff count, and role distribution."
                buttonText="View Overview"
                onClick={() => setActiveTab("company-overview")}
              />
            </div>
          </div>
        )}

        {/* ─── Monthly Report Tab ─── */}
        {!loading && activeTab === "monthly-report" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Monthly Report
            </h2>
            <p className="text-muted-foreground mb-8">Financial summary by month</p>

            {sortedMonths.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No paysheet data available yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-primary">Month</TableHead>
                      <TableHead className="text-primary">Paysheets</TableHead>
                      <TableHead className="text-primary">Total Net Salary</TableHead>
                      <TableHead className="text-primary">Avg. Net Salary</TableHead>
                      <TableHead className="text-primary">Total Deductions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMonths.map((m) => (
                      <TableRow key={m} className="border-border/50">
                        <TableCell className="text-foreground font-medium">{m}</TableCell>
                        <TableCell className="text-muted-foreground">{salaryByMonth[m].count}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {salaryByMonth[m].total.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">
                          Rs. {Math.round(salaryByMonth[m].total / salaryByMonth[m].count).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">Rs. {salaryByMonth[m].deductions.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ─── Salary Trend Tab ─── */}
        {!loading && activeTab === "salary-trend" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Salary Trend
            </h2>
            <p className="text-muted-foreground mb-8">Monthly salary progression overview</p>

            {sortedMonths.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No paysheet data available yet.</p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const maxTotal = Math.max(...sortedMonths.map((m) => salaryByMonth[m].total), 1);
                  return sortedMonths.map((m) => {
                    const pct = (salaryByMonth[m].total / maxTotal) * 100;
                    return (
                      <div key={m} className="flex items-center gap-4">
                        <span className="w-20 text-sm text-muted-foreground shrink-0">{m}</span>
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full flex items-center justify-end pr-2 text-[11px] font-semibold text-primary-foreground transition-all"
                            style={{ width: `${Math.max(pct, 5)}%` }}
                          >
                            Rs. {salaryByMonth[m].total.toLocaleString()}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">{salaryByMonth[m].count} sheets</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* ─── Meeting Schedule Tab ─── */}
        {!loading && activeTab === "meeting-schedule" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Meeting Schedule
            </h2>
            <p className="text-muted-foreground mb-8">Upcoming board and team meetings</p>

            {/* Placeholder – can be wired to a meeting API later */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground font-semibold">Board Meeting</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">Monthly board review session</p>
                  <p className="text-muted-foreground/60 text-xs">Schedule: First Monday of every month</p>
                  <p className="text-primary text-xs mt-3 font-medium">Next: To be scheduled</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground font-semibold">Operations Review</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">Weekly operations sync with directors and managers</p>
                  <p className="text-muted-foreground/60 text-xs">Schedule: Every Wednesday, 10:00 AM</p>
                  <p className="text-primary text-xs mt-3 font-medium">Next: To be scheduled</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground font-semibold">Finance Review</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">Monthly financial performance review</p>
                  <p className="text-muted-foreground/60 text-xs">Schedule: Last Friday of every month</p>
                  <p className="text-primary text-xs mt-3 font-medium">Next: To be scheduled</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground font-semibold">HR & Compliance</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">Quarterly HR policy and compliance review</p>
                  <p className="text-muted-foreground/60 text-xs">Schedule: Quarterly</p>
                  <p className="text-primary text-xs mt-3 font-medium">Next: To be scheduled</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ─── Financial Summary Tab ─── */}
        {!loading && activeTab === "financial-summary" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Financial Summary
            </h2>
            <p className="text-muted-foreground mb-8">Overall financial health of the organisation</p>

            {/* Key figures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-1">Total Payroll</p>
                  <p className="text-2xl font-bold text-foreground">Rs. {grandTotalSalary.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-1">Approved Loans</p>
                  <p className="text-2xl font-bold text-foreground">Rs. {grandTotalLoans.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-1">Approved Advances</p>
                  <p className="text-2xl font-bold text-foreground">Rs. {grandTotalAdvances.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-1">Total Paysheets</p>
                  <p className="text-2xl font-bold text-foreground">{totalPaysheets}</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly breakdown with deductions */}
            {sortedMonths.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-primary">Month</TableHead>
                      <TableHead className="text-primary">Staff</TableHead>
                      <TableHead className="text-primary">Net Salary</TableHead>
                      <TableHead className="text-primary">Allowances</TableHead>
                      <TableHead className="text-primary">Deductions</TableHead>
                      <TableHead className="text-primary">Loan Ded.</TableHead>
                      <TableHead className="text-primary">Advance Ded.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMonths.map((m) => (
                      <TableRow key={m} className="border-border/50">
                        <TableCell className="text-foreground font-medium">{m}</TableCell>
                        <TableCell className="text-muted-foreground">{salaryByMonth[m].count}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {salaryByMonth[m].total.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {salaryByMonth[m].allowances.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {salaryByMonth[m].deductions.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {salaryByMonth[m].loanDed.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {salaryByMonth[m].advDed.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ─── Company Overview Tab ─── */}
        {!loading && activeTab === "company-overview" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Company Overview
            </h2>
            <p className="text-muted-foreground mb-8">Ace Frontline Security Solutions at a glance</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <Building2 className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-foreground font-semibold text-lg mb-2">Organisation</h3>
                  <p className="text-muted-foreground text-sm">
                    Ace Frontline Security Solutions provides comprehensive security services including
                    property guarding, event security, and industrial security officer deployments.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-foreground font-semibold text-lg mb-2">Staff Summary</h3>
                  <p className="text-muted-foreground text-sm mb-3">Total registered staff (from paysheet records):</p>
                  <p className="text-3xl font-bold text-primary">{uniqueUsers.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Role distribution */}
            <h3 className="text-lg font-semibold text-foreground mb-4">Role Distribution</h3>
            {uniqueUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No staff data available.</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const roleCount: Record<string, number> = {};
                  uniqueUsers.forEach((u) => {
                    const role = u.role || "UNKNOWN";
                    roleCount[role] = (roleCount[role] || 0) + 1;
                  });
                  const maxCount = Math.max(...Object.values(roleCount), 1);
                  return Object.entries(roleCount)
                    .sort(([, a], [, b]) => b - a)
                    .map(([role, count]) => (
                      <div key={role} className="flex items-center gap-4">
                        <span className="w-40 text-sm text-muted-foreground shrink-0">{role.replace(/_/g, " ")}</span>
                        <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full flex items-center justify-end pr-2 text-[11px] font-semibold text-primary-foreground"
                            style={{ width: `${Math.max((count / maxCount) * 100, 8)}%` }}
                          >
                            {count}
                          </div>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* ─── Leave Approval Tab ─── */}
        {!loading && activeTab === "leave-approval" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Leave Approval
            </h2>
            <p className="text-muted-foreground mb-8">Review all leave requests</p>

            {leaves.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No leave requests found.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-primary">Employee</TableHead>
                      <TableHead className="text-primary">Type</TableHead>
                      <TableHead className="text-primary">From</TableHead>
                      <TableHead className="text-primary">To</TableHead>
                      <TableHead className="text-primary">Reason</TableHead>
                      <TableHead className="text-primary">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((l) => (
                      <TableRow key={l.id} className="border-border/50">
                        <TableCell className="text-foreground font-medium">{l.user?.fullName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{l.leaveType}</TableCell>
                        <TableCell className="text-muted-foreground">{l.fromDate}</TableCell>
                        <TableCell className="text-muted-foreground">{l.toDate}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{l.reason}</TableCell>
                        <TableCell>{statusBadge(l.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ─── Registration List Tab ─── */}
        {!loading && activeTab === "registration-list" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Registration List
            </h2>
            <p className="text-muted-foreground mb-8">All registered personnel</p>

            {uniqueUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No records available.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-primary">ID</TableHead>
                      <TableHead className="text-primary">Full Name</TableHead>
                      <TableHead className="text-primary">Username</TableHead>
                      <TableHead className="text-primary">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueUsers.map((u) => (
                      <TableRow key={u.id} className="border-border/50">
                        <TableCell className="text-muted-foreground">{u.id}</TableCell>
                        <TableCell className="text-foreground font-medium">{u.fullName}</TableCell>
                        <TableCell className="text-muted-foreground">{u.username}</TableCell>
                        <TableCell className="text-muted-foreground">{u.role?.replace(/_/g, " ") || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
