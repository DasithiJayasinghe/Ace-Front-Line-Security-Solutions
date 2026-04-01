import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, CreditCard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface Officer {
    fullName: string;
    officerId: string;
}

interface Advance {
    id: number;
    officer: Officer;
    requestedDate: string;
    reason: string;
    requestedAmount: number;
    status: "PENDING" | "APPROVED" | "PROCESSING" | "PAID" | "REJECTED";
    advanceMonth?: string;
    paymentDate?: string;
    deducted?: boolean;
}

interface AdvanceRequestsProps {
    role?: string;
}

const AdvanceRequests = ({ role }: AdvanceRequestsProps) => {
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedMonth, setSelectedMonth] = useState("ALL");

    const [pendingAdvances, setPendingAdvances] = useState<Advance[]>([]);
    const [paidAdvances, setPaidAdvances] = useState<Advance[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);

    const isAreaManager = role === "Area Manager";
    const isAccountant = role === "Accountant";
    const isOfficer = role === "Security Officer";
    const currentUserId = localStorage.getItem("userId");

    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestAmount, setRequestAmount] = useState("");
    const [requestReason, setRequestReason] = useState("");
    const [requestMonth, setRequestMonth] = useState(new Date().toISOString().slice(0, 7));

    const fetchAdvances = async () => {
        setIsLoading(true);
        try {
            if (isAreaManager) {
                const pendingRes = await fetch("http://localhost:8080/api/payroll/advances?status=PENDING");
                if (pendingRes.ok) setPendingAdvances(await pendingRes.json());
            } else if (isAccountant) {
                const approvedRes = await fetch("http://localhost:8080/api/payroll/advances?status=APPROVED");
                if (approvedRes.ok) setPendingAdvances(await approvedRes.json());

                const processingRes = await fetch("http://localhost:8080/api/payroll/advances?status=PROCESSING");
                const processingData = processingRes.ok ? await processingRes.json() : [];

                const paidRes = await fetch("http://localhost:8080/api/payroll/advances?status=PAID");
                const paidData = paidRes.ok ? await paidRes.json() : [];

                setPaidAdvances([...processingData, ...paidData]);
            } else if (isOfficer) {
                // Fetch all requests for this officer
                const res = await fetch(`http://localhost:8080/api/payroll/advances`);
                if (res.ok) {
                    const all: Advance[] = await res.json();
                    const mine = all.filter(a => String(a.officer.officerId) === String(currentUserId));
                    setPendingAdvances(mine.filter(a => a.status !== "PAID" && a.status !== "PROCESSING"));
                    setPaidAdvances(mine.filter(a => a.status === "PAID" || a.status === "PROCESSING"));
                }
            }
        } catch (error) {
            console.error("Failed to fetch advances:", error);
            toast.error("Failed to fetch advance requests from the server.");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAdvances();
    }, [role]);

    const handleApprove = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:8080/api/payroll/advances/approve/${id}?reviewerId=${currentUserId}`, { method: 'POST' });
            if (res.ok) {
                toast.success(`Advance request #${id} approved successfully!`);
                fetchAdvances();
            } else {
                toast.error(`Failed to approve: ${await res.text()}`);
            }
        } catch {
            toast.error("Network error.");
        }
    };

    const handleReject = async () => {
        if (!selectedAdvanceId || !rejectionReason) return;
        try {
            const res = await fetch(`http://localhost:8080/api/payroll/advances/reject/${selectedAdvanceId}?reviewerId=${currentUserId}&reason=${encodeURIComponent(rejectionReason)}`, { method: 'POST' });
            if (res.ok) {
                toast.error(`Advance request #${selectedAdvanceId} rejected.`);
                setRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedAdvanceId(null);
                fetchAdvances();
            } else {
                toast.error(`Failed to reject: ${await res.text()}`);
            }
        } catch {
            toast.error("Network error.");
        }
    };

    const handleMarkPaid = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:8080/api/payroll/advances/pay/${id}?accountantId=${currentUserId}`, { method: 'POST' });
            if (res.ok) {
                toast.success(`Advance request #${id} marked as paid.`);
                fetchAdvances();
            } else {
                toast.error(`Failed to mark paid: ${await res.text()}`);
            }
        } catch {
            toast.error("Network error.");
        }
    };

    const handleSubmitRequest = async () => {
        if (!requestAmount || !requestReason || !requestMonth) {
            toast.error("Please fill in all fields.");
            return;
        }
        try {
            const res = await fetch("http://localhost:8080/api/payroll/advances/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUserId,
                    amount: parseFloat(requestAmount),
                    reason: requestReason,
                    forMonth: requestMonth
                })
            });
            if (res.ok) {
                toast.success("Advance request submitted successfully!");
                setRequestDialogOpen(false);
                setRequestAmount("");
                setRequestReason("");
                fetchAdvances();
            } else {
                toast.error(`Failed to submit: ${await res.text()}`);
            }
        } catch {
            toast.error("Network error.");
        }
    };

    const filteredPaidAdvances = paidAdvances.filter(
        (adv) => !selectedMonth || selectedMonth === "ALL" || (adv.advanceMonth && adv.advanceMonth.includes(selectedMonth))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src={logo}
                        alt="Ace Front Line"
                        className="h-12 w-auto object-contain"
                    />
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-800 uppercase leading-none">
                            Advance Requests
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                            {isAreaManager
                                ? "Review and approve officer salary advance requests."
                                : isAccountant
                                    ? "Manage and track officer salary advance payments."
                                    : "Submit and track your salary advance requests."}
                        </p>
                    </div>
                </div>
                {isOfficer && (
                    <Button
                        className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-primary hover:text-black transition-all"
                        onClick={() => setRequestDialogOpen(true)}
                    >
                        Request Advance
                    </Button>
                )}
            </div>

            <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
                {!isAreaManager && (
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                        <TabsTrigger value="pending">{isOfficer ? "My Requests" : "Pending Payments"}</TabsTrigger>
                        <TabsTrigger value="paid">Paid Advances</TabsTrigger>
                    </TabsList>
                )}

                <TabsContent value="pending" className="mt-6">
                    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>
                                {isAreaManager ? "Awaiting Approval" : isOfficer ? "Track My Requests" : "Awaiting Payment"}
                            </CardTitle>
                            <CardDescription>
                                {isAreaManager
                                    ? "Requests submitted by officers that require your review."
                                    : isOfficer
                                        ? "Your submitted advance requests and their current status."
                                        : "Approved requests waiting for payout."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Officer</TableHead>
                                        <TableHead>Officer ID</TableHead>
                                        <TableHead>Requested Date</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingAdvances.length > 0 ? (
                                        pendingAdvances.map((adv) => (
                                            <TableRow key={adv.id} className="group hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">{adv.officer.fullName}</TableCell>
                                                <TableCell>{adv.officer.officerId}</TableCell>
                                                <TableCell>{adv.requestedDate}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={adv.reason}>
                                                    {adv.reason}
                                                </TableCell>
                                                <TableCell className="font-bold text-neutral-900">
                                                    LKR {adv.requestedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={adv.status === "PENDING" ? "secondary" : "default"}
                                                        className={cn(
                                                            "border-none font-bold text-[9px] uppercase tracking-tighter px-2.5 py-0.5 shadow-none",
                                                            adv.status === "APPROVED" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""
                                                        )}
                                                    >
                                                        {adv.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isAreaManager && adv.status === "PENDING" && (
                                                            <>
                                                                <Button size="sm" variant="outline" className="h-8 border-green-600 text-green-600 hover:bg-green-600 hover:text-white" onClick={() => handleApprove(adv.id)}>
                                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => {
                                                                    setSelectedAdvanceId(adv.id);
                                                                    setRejectDialogOpen(true);
                                                                }}>
                                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {isAccountant && adv.status === "APPROVED" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 border-neutral-200 font-bold uppercase text-[9px] tracking-widest hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-all shadow-none"
                                                                onClick={() => handleMarkPaid(adv.id)}
                                                            >
                                                                <CreditCard className="h-4 w-4 mr-1" /> Mark Paid
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                                                No {isAreaManager ? "pending" : "approved"} requests found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {!isAreaManager && (
                    <TabsContent value="paid" className="mt-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Paid Advances</h2>
                                    <p className="text-sm text-muted-foreground">Advances already paid to officers. Filter by month to see deductions.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">Month:</span>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Months</SelectItem>
                                            <SelectItem value="2026-03">March 2026</SelectItem>
                                            <SelectItem value="2026-02">February 2026</SelectItem>
                                            <SelectItem value="2026-01">January 2026</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {isAccountant && (
                                        <Button
                                            variant="outline"
                                            disabled={selectedMonth === "ALL"}
                                            onClick={() => window.open(`http://localhost:8080/api/payroll/advances/export?month=${selectedMonth}`, '_blank')}
                                            className="ml-2 font-bold uppercase text-[10px] tracking-widest text-[#52677D] border-[#52677D] hover:bg-[#52677D] hover:text-white"
                                        >
                                            Export CSV
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/50 font-semibold">
                                            <TableRow>
                                                <TableHead className="py-4">Officer</TableHead>
                                                <TableHead>Officer ID</TableHead>
                                                <TableHead>Month</TableHead>
                                                <TableHead>Paid Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Deduction Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPaidAdvances.length > 0 ? (
                                                filteredPaidAdvances.map((adv) => (
                                                    <TableRow key={adv.id} className="hover:bg-muted/30">
                                                        <TableCell className="font-medium">{adv.officer.fullName}</TableCell>
                                                        <TableCell>{adv.officer.officerId}</TableCell>
                                                        <TableCell>{adv.advanceMonth}</TableCell>
                                                        <TableCell>{adv.paymentDate}</TableCell>
                                                        <TableCell className="font-bold">LKR {adv.requestedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "border-none font-bold text-[9px] uppercase tracking-tighter px-2.5 py-0.5 shadow-none",
                                                                    adv.status === "PROCESSING" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700 hover:bg-green-200"
                                                                )}
                                                            >
                                                                {adv.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "border-none font-bold text-[9px] uppercase tracking-tighter px-2.5 py-0.5 shadow-none",
                                                                    adv.deducted
                                                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                        : "bg-red-100 text-red-700 hover:bg-red-200"
                                                                )}
                                                            >
                                                                {adv.deducted ? "Deducted" : "To be deducted"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                                        No paid advances found for this month.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4 flex gap-3 text-sm">
                                    <Calendar className="h-5 w-5 text-primary shrink-0" />
                                    <p>
                                        <span className="font-bold">Note:</span> When you generate payroll for a month, the system automatically detects any
                                        <span className="text-primary font-bold"> Paid but not yet deducted</span> advances for the officer and adds them
                                        under <span className="font-semibold">Salary Advance</span> in deductions.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Advance Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this advance request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Input
                                id="reason"
                                placeholder="..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Reject Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="uppercase font-black text-xl">New Advance Request</DialogTitle>
                        <DialogDescription>
                            Submit a new salary advance request. Max 10% of basic salary.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount" className="font-bold">Amount (LKR)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="5000.00"
                                value={requestAmount}
                                onChange={(e) => setRequestAmount(e.target.value)}
                                className="font-bold"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="req-month" className="font-bold">For Month</Label>
                            <Input
                                id="req-month"
                                type="month"
                                value={requestMonth}
                                onChange={(e) => setRequestMonth(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="req-reason" className="font-bold">Reason</Label>
                            <Input
                                id="req-reason"
                                placeholder="Brief explanation..."
                                value={requestReason}
                                onChange={(e) => setRequestReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-neutral-800"
                            onClick={handleSubmitRequest}
                        >
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdvanceRequests;
