import { useState, useEffect } from "react";
import { DollarSign, MapPin, Calendar, CheckCircle2, TrendingUp, Shield, FileText, Clock, Users, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { advanceService } from "@/services/advanceService";
import { dashboardService } from "@/services/dashboardService";
import { addNotification } from "@/lib/notifications";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardCard from "@/components/DashboardCard";
import ProfilePage from "@/pages/ProfilePage";

type MainTabType =
  | "dashboard"
  | "security-officers"
  | "weekly-report"
  | "monthly-report"
  | "attendance"
  | "monthly-statistics"
  | "shift-schedule"
  | "leave-management"
  | "advance-approval";

export default function AreaManagerDashboard() {
  const [activeTab, setActiveTab] = useState<MainTabType>("dashboard");
  const [user, setUser] = useState<any>(null);
  const [advances, setAdvances] = useState<any[]>([]);
  const [advancesLoading, setAdvancesLoading] = useState(false);
  const [securityOfficers, setSecurityOfficers] = useState<any[]>([]);
  const [officersLoading, setOfficersLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isProfile = location.pathname.endsWith("/profile");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  // Load advances and security officers when component mounts or area changes
  useEffect(() => {
    if (user?.assignedArea) {
      loadAdvances();
      loadSecurityOfficers();
      // clear notifications when load
    }
  }, [user?.assignedArea]);

  const loadSecurityOfficers = async () => {
    if (!user?.assignedArea) return;
    setOfficersLoading(true);
    try {
      const data = await dashboardService.getAreaManagerDashboard();
      setSecurityOfficers(data.areaOfficers || []);
    } catch (error: any) {
      console.error("Failed to load security officers:", error);
      addNotification(
        user.userId,
        error.message || 'Failed to load security officers'
      );
    } finally {
      setOfficersLoading(false);
    }
  };

  const loadAdvances = async () => {
    if (!user?.assignedArea) return;
    setAdvancesLoading(true);
    try {
      // Backend auto-filters by Area Manager's assigned area
      const data = await advanceService.getPendingAdvances();
      setAdvances(data);
    } catch (error: any) {
      addNotification(
        user.userId,
        error.message || 'Failed to load advances'
      );
    } finally {
      setAdvancesLoading(false);
    }
  };

  const handleApproveAdvance = async (advanceId: number) => {
    const advanceToApprove = advances.find(a => a.id === advanceId);
    try {
      await advanceService.areaManagerReview(advanceId, { approved: true });
      setAdvances(advances.filter(a => a.id !== advanceId));
      // Notify the security officer who submitted the advance
      addNotification(
        advanceToApprove?.user?.id || 0,
        `Your advance request of Rs. ${advanceToApprove?.amount?.toLocaleString()} has been APPROVED.`
      );
      // Broadcast to Account Executive
      addNotification(
        -1,
        `ADVANCE APPROVED: ${advanceToApprove?.user?.fullName} – Rs. ${advanceToApprove?.amount?.toLocaleString()} for ${advanceToApprove?.forMonth}.`
      );
    } catch (error: any) {
      addNotification(
        user.userId,
        error.message || 'Failed to approve advance'
      );
    }
  };

  const handleRejectAdvance = async (advanceId: number) => {
    if (!rejectReason.trim()) {
      addNotification(
        user.userId,
        'Please provide a rejection reason'
      );
      return;
    }

    const advanceToReject = advances.find(a => a.id === advanceId);
    setRejectingId(advanceId);
    try {
      await advanceService.areaManagerReview(advanceId, { approved: false, rejectionReason: rejectReason });
      setAdvances(advances.map(a => 
        a.id === advanceId ? { ...a, status: 'REJECTED', rejectionReason: rejectReason } : a
      ));
      setShowRejectDialog(null);
      setRejectReason("");
      // Notify the security officer who submitted the advance
      addNotification(
        advanceToReject?.user?.id || 0,
        `Your advance request of Rs. ${advanceToReject?.amount?.toLocaleString()} has been REJECTED. Reason: ${rejectReason}`
      );
      // Broadcast to Account Executive
      addNotification(
        -1,
        `ADVANCE REJECTED: ${advanceToReject?.user?.fullName} – Rs. ${advanceToReject?.amount?.toLocaleString()} for ${advanceToReject?.forMonth}. Reason: ${rejectReason}`
      );
    } catch (error: any) {
      addNotification(
        user.userId,
        error.message || 'Failed to reject advance'
      );
    } finally {
      setRejectingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  const menuItems = [
    { icon: Users, label: "Security Officers", id: "security-officers" },
    { icon: Calendar, label: "Weekly Report", id: "weekly-report" },
    { icon: FileText, label: "Monthly Report", id: "monthly-report" },
    { icon: CheckCircle2, label: "Attendance", id: "attendance" },
    { icon: TrendingUp, label: "Monthly Stats", id: "monthly-statistics" },
    { icon: Clock, label: "Shift Schedule", id: "shift-schedule" },
    { icon: Users, label: "Leave Management", id: "leave-management" },
    { icon: DollarSign, label: "Advance Approval", id: "advance-approval" },
  ];

  // Quick action cards for dashboard view
  const quickActions = [
    {
      icon: Users,
      title: "Security Officers",
      description: "View registered security officers in your area",
      onClick: () => setActiveTab("security-officers"),
    },
    {
      icon: Calendar,
      title: "Weekly Report",
      description: "View and manage weekly operational reports",
      onClick: () => setActiveTab("weekly-report"),
    },
    {
      icon: FileText,
      title: "Monthly Report",
      description: "Generate and review monthly performance reports",
      onClick: () => setActiveTab("monthly-report"),
    },
    {
      icon: CheckCircle2,
      title: "Attendance",
      description: "Track and manage officer attendance records",
      onClick: () => setActiveTab("attendance"),
    },
    {
      icon: TrendingUp,
      title: "Monthly Statistics",
      description: "View comprehensive monthly performance metrics",
      onClick: () => setActiveTab("monthly-statistics"),
    },
    {
      icon: Clock,
      title: "Shift Schedule",
      description: "Manage and assign officer shift schedules",
      onClick: () => setActiveTab("shift-schedule"),
    },
    {
      icon: Users,
      title: "Leave Management",
      description: "Process and approve leave applications",
      onClick: () => setActiveTab("leave-management"),
    },
    {
      icon: DollarSign,
      title: "Advance Approval",
      description: "Review and approve advance payment requests",
      onClick: () => setActiveTab("advance-approval"),
    },
  ];

  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          userName={user?.fullName || "Area Manager"}
          userRole={user?.assignedArea || "Area Manager"}
          onLogout={handleLogout}
          userId={user?.userId || 0}
          backendRole="AREA_MANAGER"
          profilePath="/area-manager/profile"
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
        userName={user?.fullName || "Area Manager"}
        userRole={user?.assignedArea || "Area Manager"}
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="AREA_MANAGER"
        profilePath="/area-manager/profile"
      />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
              }`}
            >
              Dashboard
            </button>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as MainTabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col gap-2 pb-4">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome, <span className="text-primary">{user?.fullName?.split(" ")[0] || "Manager"}</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Manage your area operations from this dashboard
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const pending = advances.filter(a => a.status === 'PENDING');
                const approved = advances.filter(a => a.status === 'APPROVED_BY_AREA_MANAGER');
                return [
                  { label: "Pending Advances", value: pending.length, icon: DollarSign },
                  { label: "Approved Advances", value: approved.length, icon: CheckCircle2 },
                  { label: "Total Requests", value: advances.length, icon: TrendingUp },
                ];
              })().map((stat, idx) => (
                <Card key={idx} className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/15">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions Grid */}
            <div className="pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

        {/* Other Tab Views */}
        {activeTab !== "dashboard" && activeTab !== "advance-approval" && activeTab !== "security-officers" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-foreground capitalize">
                {activeTab.replace(/-/g, " ")}
              </h1>
            </div>
            <Card className="bg-card border-primary/20">
              <CardContent className="p-8 text-center">
                <MapPin className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Content for {activeTab.replace(/-/g, " ")} will be displayed here.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Officers Tab */}
        {activeTab === "security-officers" && (
          <div className="space-y-6">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Security Officers</h1>
                <p className="text-muted-foreground text-sm">Registered security officers in {user?.assignedArea}</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Officers</p>
                      <p className="text-3xl font-bold text-primary mt-2">{securityOfficers.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="text-xl font-bold text-primary mt-2 line-clamp-1">{user?.assignedArea || '-'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/20">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Status</p>
                      <p className="text-3xl font-bold text-green-500 mt-2">
                        {securityOfficers.filter(o => o.active).length}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-500/20">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Officers Table */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-foreground">Officer Directory</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {officersLoading ? "Loading..." : `${securityOfficers.length} officer(s) registered`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {officersLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground">Loading security officers...</p>
                  </div>
                ) : securityOfficers.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-primary/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No security officers registered in your area yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-primary">ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Designation</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Assigned Company</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Phone</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityOfficers.map((officer, idx) => (
                          <tr key={officer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-sm text-muted-foreground">#{officer.id}</td>
                            <td className="py-3 px-4 text-foreground font-medium">{officer.fullName || '-'}</td>
                            <td className="py-3 px-4 text-foreground">
                              {officer.designation ? officer.designation.replace(/_/g, ' ') : '-'}
                            </td>
                            <td className="py-3 px-4 text-foreground">{officer.assignedCompany || '-'}</td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">{officer.email || '-'}</td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">{officer.mobileNumber || '-'}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  officer.active
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                                }`}
                              >
                                {officer.active ? '✓ Active' : '✕ Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "advance-approval" && (
          <div className="space-y-6">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Advance Approval</h1>
                <p className="text-muted-foreground text-sm">Review and approve staff advance requests for {user?.assignedArea}</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const pending = advances.filter(a => a.status === 'PENDING');
                const approved = advances.filter(a => a.status === 'APPROVED_BY_AREA_MANAGER');
                const totalAmount = pending.reduce((sum, a) => sum + (a.amount || 0), 0);
                return [
                  { label: "Pending Requests", value: pending.length, icon: DollarSign },
                  { label: "Approved", value: approved.length, icon: CheckCircle2 },
                  { label: "Pending Amount", value: `Rs. ${totalAmount.toFixed(2)}`, icon: TrendingUp },
                ];
              })().map((stat, idx) => (
                <Card key={idx} className="bg-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-primary mt-2">{stat.value}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/20">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Advances Table */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-foreground">Advance Requests</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {advancesLoading ? "Loading..." : `${advances.length} request(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {advancesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading advances...</p>
                  </div>
                ) : advances.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No advance requests for your area</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Employee</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Reason</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Month</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-primary">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advances.map((advance) => (
                          <tr key={advance.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-foreground font-medium">
                              {advance.user?.fullName || 'Unknown Officer'}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              Rs. {advance.amount?.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {advance.reason || '-'}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {advance.forMonth}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  advance.status === 'PENDING'
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : advance.status === 'APPROVED_BY_AREA_MANAGER'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {advance.status === 'APPROVED_BY_AREA_MANAGER'
                                  ? 'Approved'
                                  : advance.status === 'REJECTED'
                                  ? 'Rejected'
                                  : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {advance.status === 'PENDING' ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => handleApproveAdvance(advance.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-primary/30 text-primary hover:bg-primary/10"
                                    onClick={() => setShowRejectDialog(advance.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {advance.status === 'REJECTED' && advance.rejectionReason && (
                                    <div className="line-clamp-1" title={advance.rejectionReason}>
                                      {advance.rejectionReason}
                                    </div>
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reject Dialog */}
            {showRejectDialog !== null && (
              <Card className="bg-card border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-400">Reject Advance Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rejection Reason
                    </label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={3}
                      disabled={rejectingId === showRejectDialog}
                      className="resize-none bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleRejectAdvance(showRejectDialog)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={rejectingId === showRejectDialog}
                    >
                      {rejectingId === showRejectDialog ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectDialog(null);
                        setRejectReason("");
                      }}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      disabled={rejectingId === showRejectDialog}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
