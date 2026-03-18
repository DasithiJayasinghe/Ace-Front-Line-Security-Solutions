import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  CalendarOff,
  DollarSign,
  Users,
  Loader,
  CheckCircle2,
  XCircle,
  Clock,
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
  | "leave-approval"
  | "loan-advance"
  | "registration-list";

export default function DirectorDashboard() {
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
    { icon: CalendarOff, label: "Leave Approval", id: "leave-approval" as TabType },
    { icon: DollarSign, label: "Loan & Advance", id: "loan-advance" as TabType },
    { icon: Users, label: "Registration List", id: "registration-list" as TabType },
  ];

  // Helper: status badge styling
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
  const pendingLoans = loans.filter((l) => l.status === "PENDING").length;
  const totalAdvances = advances.length;
  const approvedAdvances = advances.filter((a) => a.status === "APPROVED").length;
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING" || l.status === "APPROVED_BY_AREA_MANAGER").length;
  const totalPaysheets = paysheets.length;

  // Monthly salary aggregation for trend
  const salaryByMonth = paysheets.reduce<Record<string, { total: number; count: number }>>((acc, p) => {
    if (!acc[p.month]) acc[p.month] = { total: 0, count: 0 };
    acc[p.month].total += p.netSalary;
    acc[p.month].count += 1;
    return acc;
  }, {});
  const sortedMonths = Object.keys(salaryByMonth).sort();

  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          userName={user?.fullName || "Director"}
          userRole="Director"
          onLogout={handleLogout}
          userId={user?.userId || 0}
          backendRole="DIRECTOR"
          profilePath="/director/profile"
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
        userName={user?.fullName || "Director"}
        userRole="Director"
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="DIRECTOR"
        profilePath="/director/profile"
      />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
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
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Director Dashboard
              </h1>
              <p className="text-muted-foreground">Overview of company operations and finances</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Total Loans</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalLoans}</p>
                  <p className="text-xs text-green-400 mt-1">{approvedLoans} approved</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Total Advances</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalAdvances}</p>
                  <p className="text-xs text-green-400 mt-1">{approvedAdvances} approved</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-primary/20">
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
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Paysheets Issued</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalPaysheets}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <DashboardCard
                icon={CheckCircle2}
                title="Payroll Approvals"
                description="Review and approve pending payroll submissions from account executives."
                buttonText="View Pending"
                onClick={() => navigate("/director/payroll/approvals")}
              />
              <DashboardCard
                icon={CalendarOff}
                title="Leave Requests"
                description="Review and approve pending leave requests from staff."
                buttonText="View Leaves"
                onClick={() => setActiveTab("leave-approval")}
              />
              <DashboardCard
                icon={DollarSign}
                title="Loan & Advance Overview"
                description="Monitor all loan and advance requests across the organisation."
                buttonText="View Details"
                onClick={() => setActiveTab("loan-advance")}
              />
              <DashboardCard
                icon={TrendingUp}
                title="Salary Trends"
                description="Analyse payroll trends and monthly salary distributions."
                buttonText="View Trends"
                onClick={() => setActiveTab("salary-trend")}
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
                {/* Simple bar chart representation */}
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

        {/* ─── Loan & Advance Overview Tab ─── */}
        {!loading && activeTab === "loan-advance" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Loan & Advance Overview
            </h2>
            <p className="text-muted-foreground mb-8">All loan and advance requests across the organisation</p>

            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-primary/20 bg-muted p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalLoans}</p>
                <p className="text-xs text-muted-foreground">Total Loans</p>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-muted p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{approvedLoans}</p>
                <p className="text-xs text-muted-foreground">Approved Loans</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-muted p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalAdvances}</p>
                <p className="text-xs text-muted-foreground">Total Advances</p>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-muted p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{approvedAdvances}</p>
                <p className="text-xs text-muted-foreground">Approved Advances</p>
              </div>
            </div>

            {/* Loans Table */}
            <h3 className="text-lg font-semibold text-foreground mb-3">Loan Requests</h3>
            {loans.length === 0 ? (
              <p className="text-muted-foreground mb-8">No loan requests.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border mb-8">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-primary">Employee</TableHead>
                      <TableHead className="text-primary">Amount</TableHead>
                      <TableHead className="text-primary">Months</TableHead>
                      <TableHead className="text-primary">Reason</TableHead>
                      <TableHead className="text-primary">Status</TableHead>
                      <TableHead className="text-primary">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((l) => (
                      <TableRow key={l.id} className="border-border/50">
                        <TableCell className="text-foreground font-medium">{l.user?.fullName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {l.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{l.repaymentMonths}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[180px] truncate">{l.reason}</TableCell>
                        <TableCell>{statusBadge(l.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Advances Table */}
            <h3 className="text-lg font-semibold text-foreground mb-3">Advance Requests</h3>
            {advances.length === 0 ? (
              <p className="text-muted-foreground">No advance requests.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-primary">Employee</TableHead>
                      <TableHead className="text-primary">Amount</TableHead>
                      <TableHead className="text-primary">Month</TableHead>
                      <TableHead className="text-primary">Reason</TableHead>
                      <TableHead className="text-primary">Status</TableHead>
                      <TableHead className="text-primary">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advances.map((a) => (
                      <TableRow key={a.id} className="border-border/50">
                        <TableCell className="text-foreground font-medium">{a.user?.fullName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">Rs. {a.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{a.forMonth}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[180px] truncate">{a.reason}</TableCell>
                        <TableCell>{statusBadge(a.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
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
            <p className="text-muted-foreground mb-8">Overview of registered personnel (data loaded from paysheet records)</p>

            {paysheets.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No registration records available.</p>
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
                    {/* Deduplicate by user ID */}
                    {Array.from(new Map(paysheets.filter((p) => p.user).map((p) => [p.user.id, p.user])).values()).map(
                      (u) => (
                        <TableRow key={u.id} className="border-border/50">
                          <TableCell className="text-muted-foreground">{u.id}</TableCell>
                          <TableCell className="text-foreground font-medium">{u.fullName}</TableCell>
                          <TableCell className="text-muted-foreground">{u.username}</TableCell>
                          <TableCell className="text-muted-foreground">{u.role?.replace(/_/g, " ") || "—"}</TableCell>
                        </TableRow>
                      )
                    )}
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
