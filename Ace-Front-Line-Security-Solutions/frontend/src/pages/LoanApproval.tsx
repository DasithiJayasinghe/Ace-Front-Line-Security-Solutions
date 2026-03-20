import { useState, useEffect } from "react";
import { loanService } from "@/services/loanService";
import type { LoanRequest } from "@/services/loanService";
import { loanDeductionService } from "@/services/loanDeductionService";
import { addNotification } from "@/lib/notifications";
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { getUserRole } from "@/lib/roleUtils";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";

type TabType = "pending" | "approved" | "rejected";

const LoanApproval = () => {
  const navigate = useNavigate();
  const { user } = useAuthenticatedUser();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [pendingLoans, setPendingLoans] = useState<LoanRequest[]>([]);
  const [approvedLoans, setApprovedLoans] = useState<LoanRequest[]>([]);
  const [rejectedLoans, setRejectedLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingLoanId, setRejectingLoanId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const userRole = getUserRole();
  const canViewAllLoans = ["DIRECTOR", "CHAIRMAN", "OPERATION_MANAGER", "ACCOUNT_EXECUTIVE"].includes(userRole);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/staff-login");
  };

  const fetchLoans = async () => {
    setLoading(true);
    setAccessError(null);

    const showError = (err: any) => {
      const message =
        err?.message === "Access denied"
          ? "You do not have permission to view loan information. Please check your role or contact an administrator."
          : err?.message || "Could not connect to server. Check that the backend is running.";

      // only show the toast once per fetch cycle
      setAccessError(message);
      toast({
        title: "Failed to Load Loans",
        description: message,
        variant: "destructive",
      });
    };

    try {
      const pending = await loanService.getPendingLoans();
      setPendingLoans(pending);
    } catch (err: any) {
      console.error("Failed to load pending loans", err);
      showError(err);
    }

    if (canViewAllLoans) {
      try {
        const approved = await loanService.getApprovedLoans();
        setApprovedLoans(approved);
      } catch (err: any) {
        console.error("Failed to load approved loans", err);
        showError(err);
      }

      try {
        const allLoans = await loanService.getAllLoans();
        const rejected = allLoans.filter((loan) => loan.status === "REJECTED");
        setRejectedLoans(rejected);
      } catch (err: any) {
        console.error("Failed to load rejected loans", err);
        showError(err);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleApprove = async (id: number) => {
    const loan = pendingLoans.find((l) => l.id === id);
    try {
      await loanService.reviewLoan(id, { approved: true });

      // Generate deduction schedule so the accountant can see it immediately
      try {
        await loanDeductionService.generateSchedule(id);
      } catch (deductionErr) {
        console.warn("Failed to generate deduction schedule:", deductionErr);
      }

      setPendingLoans(prev => prev.filter(l => l.id !== id));
      if (loan) {
        setApprovedLoans(prev => [...prev, { ...loan, status: "APPROVED", reviewedAt: new Date().toISOString() }]);
      }
      addNotification(
        loan?.user?.id || 0,
        `Your loan request for LKR ${Math.round(loan?.amount || 0).toLocaleString()} has been APPROVED by the Executive Officer.`
      );
      addNotification(
        -1,
        `LOAN APPROVED: ${loan?.user?.fullName} — LKR ${Math.round(loan?.amount || 0).toLocaleString()} for ${loan?.repaymentMonths} months.`
      );
      toast({ title: "Loan Approved", description: `${loan?.user?.fullName}'s loan approved successfully.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to approve loan", variant: "destructive" });
    }
  };

  const openRejectDialog = (id: number) => {
    setRejectingLoanId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingLoanId || !rejectReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    const loan = pendingLoans.find((l) => l.id === rejectingLoanId);
    setProcessing(true);
    try {
      await loanService.reviewLoan(rejectingLoanId, { approved: false, rejectionReason: rejectReason.trim() });
      setPendingLoans(prev => prev.filter(l => l.id !== rejectingLoanId));
      if (loan) {
        setRejectedLoans(prev => [...prev, { ...loan, status: "REJECTED", rejectionReason: rejectReason.trim(), reviewedAt: new Date().toISOString() }]);
      }
      addNotification(
        loan?.user?.id || 0,
        `Your loan request for LKR ${Math.round(loan?.amount || 0).toLocaleString()} has been REJECTED. Reason: ${rejectReason.trim()}`
      );
      toast({ title: "Loan Rejected", description: `${loan?.user?.fullName}'s loan has been rejected.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to reject loan", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
    setRejectDialogOpen(false);
    setRejectingLoanId(null);
    setRejectReason("");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user?.fullName || "Executive Officer"}
        userRole="Executive Officer"
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="EXECUTIVE_OFFICER"
        profilePath="/executive-officer/profile"
      />
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => navigate("/executive-officer")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Loan Approval
            </h1>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border/60 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                    <p className="text-3xl font-bold text-primary">{pendingLoans.length}</p>
                  </div>
                  <Clock className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/60 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-3xl font-bold text-primary">{approvedLoans.length}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/60 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-3xl font-bold text-primary">{rejectedLoans.length}</p>
                  </div>
                  <XCircle className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === "pending"
                  ? "border-b-primary text-foreground"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending ({pendingLoans.length})
            </button>

            {canViewAllLoans && (
              <>
                <button
                  onClick={() => setActiveTab("approved")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeTab === "approved"
                      ? "border-b-primary text-foreground"
                      : "border-b-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approved ({approvedLoans.length})
                </button>
                <button
                  onClick={() => setActiveTab("rejected")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeTab === "rejected"
                      ? "border-b-primary text-foreground"
                      : "border-b-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Rejected ({rejectedLoans.length})
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {accessError && (
              <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
                {accessError}
              </div>
            )}
            {loading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Pending Tab */}
                {activeTab === "pending" && (
                  <div>
                    <div className="px-5 py-4 border-b border-border bg-primary/5">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Pending Loan Requests
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Awaiting approval decision</p>
                    </div>
                    {pendingLoans.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No pending loan requests</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Officer</TableHead>
                            <TableHead>Amount (LKR)</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingLoans.map((loan) => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-mono text-foreground">#{loan.id}</TableCell>
                              <TableCell className="font-medium text-foreground">
                                {loan.user?.fullName}
                                <span className="text-xs text-muted-foreground block">@{loan.user?.username}</span>
                              </TableCell>
                              <TableCell className="font-mono font-semibold text-primary">
                                {Math.round(loan.amount).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-foreground">{loan.repaymentMonths} months</TableCell>
                              <TableCell className="max-w-[200px] truncate text-muted-foreground" title={loan.reason}>
                                {loan.reason}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" className="bg-green-700 text-white hover:bg-green-800" onClick={() => handleApprove(loan.id)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => openRejectDialog(loan.id)}>
                                    <XCircle className="w-3 h-3 mr-1" />Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {/* Approved Tab */}
                {canViewAllLoans && activeTab === "approved" && (
                  <div>
                    <div className="px-5 py-4 border-b border-border bg-primary/5">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Approved Loans
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Total amount approved: LKR {approvedLoans.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}</p>
                    </div>
                    {approvedLoans.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No approved loans yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Officer</TableHead>
                            <TableHead>Amount (LKR)</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Approved On</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedLoans.map((loan) => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-mono text-foreground">#{loan.id}</TableCell>
                              <TableCell className="font-medium text-foreground">
                                {loan.user?.fullName}
                                <span className="text-xs text-muted-foreground block">@{loan.user?.username}</span>
                              </TableCell>
                              <TableCell className="font-mono font-semibold text-primary">
                                {Math.round(loan.amount).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-foreground">{loan.repaymentMonths} months</TableCell>
                              <TableCell className="max-w-[200px] truncate text-muted-foreground" title={loan.reason}>
                                {loan.reason}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {loan.reviewedAt ? new Date(loan.reviewedAt).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-700/20 text-green-600 border-green-700/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {/* Rejected Tab */}
                {canViewAllLoans && activeTab === "rejected" && (
                  <div>
                    <div className="px-5 py-4 border-b border-border bg-primary/5">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-destructive" />
                        Rejected Loans
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Loans that were not approved</p>
                    </div>
                    {rejectedLoans.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <XCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No rejected loans</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Officer</TableHead>
                            <TableHead>Amount (LKR)</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Rejection Reason</TableHead>
                            <TableHead>Rejected On</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rejectedLoans.map((loan) => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-mono text-foreground">#{loan.id}</TableCell>
                              <TableCell className="font-medium text-foreground">
                                {loan.user?.fullName}
                                <span className="text-xs text-muted-foreground block">@{loan.user?.username}</span>
                              </TableCell>
                              <TableCell className="font-mono font-semibold text-muted-foreground">
                                {Math.round(loan.amount).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-foreground">{loan.repaymentMonths} months</TableCell>
                              <TableCell className="max-w-[150px] truncate text-muted-foreground" title={loan.reason}>
                                {loan.reason}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-destructive/80 text-sm" title={loan.rejectionReason}>
                                {loan.rejectionReason || "No reason provided"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {loan.reviewedAt ? new Date(loan.reviewedAt).toLocaleDateString() : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Reject Loan Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for Rejection</Label>
            <Textarea
              placeholder="Please provide a reason for rejecting this loan request..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={processing}>
              {processing
                ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                : <XCircle className="w-3 h-3 mr-1" />
              }
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanApproval;
