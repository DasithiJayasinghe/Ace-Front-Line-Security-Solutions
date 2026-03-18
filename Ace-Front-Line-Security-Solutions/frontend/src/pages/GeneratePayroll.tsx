import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
    Plus,
    Trash2,
    FileText,
    X,
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { format, setMonth as setDateMonth, setYear, startOfMonth, endOfMonth } from "date-fns";
import logo from "@/assets/logo.png";

interface Officer {
    id: number;
    officerId: string;
    fullName: string;
    position: string;
    officeLocation: string;
    basicSalary: number;
    otRate: number;
    accountNumber: string;
    bankName: string;
    branchName: string;
}

interface Allowance {
    name: string;
    amount: number;
}

interface Deduction {
    name: string;
    amount: number;
}

const GeneratePayroll = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

    const [officers, setOfficers] = useState<Officer[]>([]);
    const [selectedOfficerId, setSelectedOfficerId] = useState("");
    const [officer, setOfficer] = useState<Officer | null>(null);
    const [totalShifts, setTotalShifts] = useState<string>("");
    const [allowances, setAllowances] = useState<Allowance[]>([]);
    const [deductions, setDeductions] = useState<Deduction[]>([]);
    const [advanceWarning, setAdvanceWarning] = useState<string | null>(null);

    const [newAllowance, setNewAllowance] = useState({ name: "", amount: "" });
    const [newDeduction, setNewDeduction] = useState({ name: "", amount: "" });

    const monthStr = format(selectedDate, "yyyy-MM");

    // Fetch officers on mount
    useEffect(() => {
        const fetchOfficers = async () => {
            console.log("Fetching officers from backend...");
            try {
                const response = await fetch("http://localhost:8080/api/officers/list");
                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched officers data:", data);

                    if (data.length === 0) {
                        toast.info("No security officers found in the database. Please ensure users have the 'SECURITY_OFFICER' role.");
                    }

                    // Transform backend 'User' to frontend 'Officer'
                    const transformed = data.map((u: any) => ({
                        id: u.id,
                        officerId: u.id.toString(),
                        fullName: u.fullName || "N/A",
                        position: u.role || "N/A",
                        officeLocation: u.assignedCompany || "N/A",
                        basicSalary: u.basicSalary || 0,
                        otRate: u.otRate || 500,
                        accountNumber: u.bankAccountNumber || "N/A",
                        bankName: u.bankName || "N/A",
                        branchName: u.bankBranch || "N/A"
                    }));
                    setOfficers(transformed);
                } else {
                    console.error("Fetch failed with status:", response.status);
                    toast.error(`Backend returned error ${response.status}. Please check backend logs.`);
                }
            } catch (error) {
                console.error("Network error while fetching officers:", error);
                toast.error("Process failed: Could not connect to backend server. Ensure Spring Boot is running on port 8080.");
            }
        };
        fetchOfficers();
    }, []);

    // Handle officer selection
    useEffect(() => {
        if (selectedOfficerId) {
            const found = officers.find(o => o.officerId === selectedOfficerId);
            if (found) {
                setOfficer(found);
            }
        } else {
            setOfficer(null);
        }
    }, [selectedOfficerId, officers]);

    // Fetch actual paid advances
    useEffect(() => {
        const fetchOfficerAdvances = async () => {
            if (selectedOfficerId && monthStr) {
                // Find internal DB ID mapping for the officer
                const selectedOfficerDbId = officers.find(o => o.officerId === selectedOfficerId)?.id;

                if (selectedOfficerDbId) {
                    try {
                        const res = await fetch(`http://localhost:8080/api/payroll/officer/advances/${selectedOfficerDbId}?month=${monthStr}`);
                        if (res.ok) {
                            const advances = await res.json();
                            if (advances && advances.length > 0) {
                                const totalAdvance = advances.reduce((sum: number, adv: any) => sum + (adv.requestedAmount || 0), 0);
                                setAdvanceWarning(`This officer has ${advances.length} paid advance(s) totaling LKR ${totalAdvance.toLocaleString('en-US', { minimumFractionDigits: 2 })} for ${format(selectedDate, "MMMM yyyy")} that have not been deducted yet.`);

                                const label = `Salary Advance`;
                                setDeductions(prev => {
                                    // Remove any existing automatic salary advance deduction to prevent duplicates if toggling
                                    const filtered = prev.filter(d => !d.name.includes('Salary Advance'));
                                    return [...filtered, { name: label, amount: totalAdvance }];
                                });
                            } else {
                                setAdvanceWarning(null);
                                // Remove automatic advance deduction if they no longer have advances for this month
                                setDeductions(prev => prev.filter(d => !d.name.includes('Salary Advance')));
                            }
                        }
                    } catch (error) {
                        console.error("Failed to fetch officer advances", error);
                    }
                }
            } else {
                setAdvanceWarning(null);
            }
        };

        fetchOfficerAdvances();
    }, [selectedOfficerId, monthStr, selectedDate, officers]);

    const overtimeAmount = officer ? (parseInt(totalShifts) || 0) * officer.otRate : 0;
    const epfAmount = officer ? officer.basicSalary * 0.08 : 0;

    const totalAllowances = officer ? officer.basicSalary + overtimeAmount + allowances.reduce((acc, curr) => acc + curr.amount, 0) : 0;
    const totalDeductions = officer ? epfAmount + deductions.reduce((acc, curr) => acc + curr.amount, 0) : 0;
    const netSalary = totalAllowances - totalDeductions;

    const addAllowance = () => {
        if (!newAllowance.name || !newAllowance.amount) return;
        setAllowances([...allowances, { name: newAllowance.name, amount: parseFloat(newAllowance.amount) }]);
        setNewAllowance({ name: "", amount: "" });
    };

    const addDeduction = () => {
        if (!newDeduction.name || !newDeduction.amount) return;
        setDeductions([...deductions, { name: newDeduction.name, amount: parseFloat(newDeduction.amount) }]);
        setNewDeduction({ name: "", amount: "" });
    };

    const removeAllowance = (index: number) => {
        setAllowances(allowances.filter((_, i) => i !== index));
    };

    const removeDeduction = (index: number) => {
        setDeductions(deductions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedOfficerId) {
            toast.error("Please select an officer.");
            return;
        }

        const payload = {
            officerId: parseInt(selectedOfficerId),
            month: format(selectedDate, "yyyy-MM"),
            payPeriodStart: format(startOfMonth(selectedDate), "yyyy-MM-dd"),
            payPeriodEnd: format(endOfMonth(selectedDate), "yyyy-MM-dd"),
            totalShifts: parseInt(totalShifts) || 0,
            basicSalary: officer?.basicSalary || 0,
            overtimeAmount: overtimeAmount,
            allowances: allowances.map(a => ({ name: a.name, amount: a.amount })),
            deductions: deductions.map(d => ({ name: d.name, amount: d.amount }))
        };

        try {
            const response = await fetch("http://localhost:8080/api/payroll/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("Payroll generated successfully!");
                navigate("/accountant/payroll-records");
            } else {
                const errorMsg = await response.text();
                toast.error(`Failed to generate payroll: ${errorMsg}`);
            }
        } catch (error) {
            console.error("Error generating payroll:", error);
            toast.error("System error while connecting to backend.");
        }
    };

    const formatCurrency = (val: number) => {
        return "LKR " + val.toLocaleString("en-US", { minimumFractionDigits: 0 });
    };

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const handleMonthSelect = (mIdx: number) => {
        setSelectedDate(prev => setDateMonth(prev, mIdx));
        setIsMonthPickerOpen(false);
    };

    const handleYearChange = (offset: number) => {
        setSelectedDate(prev => setYear(prev, prev.getFullYear() + offset));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <img src={logo} alt="Project Logo" className="h-12 w-auto object-contain" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-800 uppercase">Generate Payroll</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Payroll Administration Module</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-bold text-neutral-600 uppercase">Financial Center</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(), "EEEE, do MMMM yyyy")}</span>
                </div>
            </div>

            <Card className="shadow-2xl border-none">
                <CardContent className="p-8 space-y-10">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Top Grid: Information Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                            {/* Left Column: Officer General Information */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="month" className="text-xs font-bold text-neutral-500 uppercase">Month *</Label>
                                    <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="month"
                                                variant={"outline"}
                                                className={`w-full justify-start text-left font-medium h-11 border-neutral-300 ${!selectedDate && "text-muted-foreground"}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                                {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>Pick a month</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3 bg-white border border-neutral-200 shadow-xl rounded-xl">
                                            <div className="flex items-center justify-between px-2 pb-2 border-b border-neutral-100 mb-2">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleYearChange(-1)}>
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-sm font-bold">{format(selectedDate, "yyyy")}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleYearChange(1)}>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {months.map((m, idx) => (
                                                    <Button
                                                        key={m}
                                                        variant={selectedDate.getMonth() === idx ? "default" : "ghost"}
                                                        className={`h-9 px-0 text-xs font-medium ${selectedDate.getMonth() === idx ? "bg-primary text-black hover:bg-primary/90" : "hover:bg-neutral-50"}`}
                                                        onClick={() => handleMonthSelect(idx)}
                                                    >
                                                        {m}
                                                    </Button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="officerId" className="text-xs font-bold text-neutral-500 uppercase">Officer ID *</Label>
                                    <Select value={selectedOfficerId} onValueChange={setSelectedOfficerId} required>
                                        <SelectTrigger id="officerId" className="h-11 border-neutral-300 bg-neutral-50/50">
                                            <SelectValue placeholder="-- Select Officer ID --" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {officers.map(o => (
                                                <SelectItem key={o.officerId} value={o.officerId}>{o.officerId} - {o.fullName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase">Name</Label>
                                    <Input value={officer?.fullName || ""} readOnly className="h-11 bg-neutral-100 border-neutral-200 text-neutral-600 font-medium" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase">Position</Label>
                                    <Input value={officer?.position || ""} readOnly className="h-11 bg-neutral-100 border-neutral-200 text-neutral-600 font-medium" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="totalShifts" className="text-xs font-bold text-neutral-500 uppercase">Total Shifts *</Label>
                                    <Input
                                        id="totalShifts"
                                        type="number"
                                        min="0"
                                        value={totalShifts}
                                        onChange={(e) => setTotalShifts(e.target.value)}
                                        required
                                        placeholder="Enter total shifts"
                                        className="h-11 border-neutral-300 focus:ring-primary focus:border-primary font-bold text-neutral-800"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase">Office</Label>
                                    <Input value={officer?.officeLocation || ""} readOnly className="h-11 bg-neutral-100 border-neutral-200 text-neutral-600 font-medium" />
                                </div>
                            </div>

                            {/* Right Column: Bank Details and Detection Banner */}
                            <div className="space-y-6">
                                <div className="bg-white border-2 border-primary rounded-2xl p-6 shadow-sm ring-4 ring-primary/5">
                                    <h3 className="text-sm font-bold text-primary tracking-wide mb-3 flex items-center gap-2">
                                        <Wallet className="h-4 w-4" /> Bank Details
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Auto-filled from officer profile after selecting Officer ID.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase">Account Number</Label>
                                        <Input value={officer?.accountNumber || ""} readOnly className="h-11 bg-neutral-50 border-neutral-200 text-neutral-700 font-mono font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase">Bank</Label>
                                        <Input value={officer?.bankName || ""} readOnly className="h-11 bg-neutral-50 border-neutral-200 text-neutral-700 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase">Branch</Label>
                                        <Input value={officer?.branchName || ""} readOnly className="h-11 bg-neutral-50 border-neutral-200 text-neutral-700 font-bold" />
                                    </div>
                                </div>

                                {advanceWarning && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-in slide-in-from-top-2 duration-300">
                                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-amber-800 uppercase tracking-tighter">Advance Notification</p>
                                            <p className="text-[11px] text-amber-700 leading-normal">
                                                {advanceWarning} This has been added to the deductions.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator className="bg-neutral-100" />

                        {/* Calculations Zone */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Earnings (Allowances) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" /> Allowances
                                    </h4>
                                    <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full uppercase">Credits</span>
                                </div>

                                <div className="bg-neutral-50/50 border border-neutral-100 rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium text-neutral-600">
                                        <span>Basic Salary</span>
                                        <span className="font-bold text-neutral-900">{formatCurrency(officer?.basicSalary || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium text-neutral-600">
                                        <span>Overtime (OT)</span>
                                        <span className="font-bold text-primary">{formatCurrency(overtimeAmount)}</span>
                                    </div>

                                    {allowances.map((al, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm group">
                                            <span className="text-neutral-500 font-medium">{al.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-neutral-900">{formatCurrency(al.amount)}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => removeAllowance(idx)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 mt-2 border-t border-dashed border-neutral-200 flex gap-2">
                                        <Input placeholder="Extra Allowance Name" value={newAllowance.name} onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })} className="h-9 text-xs bg-white border-neutral-200" />
                                        <Input type="number" placeholder="Amount" value={newAllowance.amount} onChange={(e) => setNewAllowance({ ...newAllowance, amount: e.target.value })} className="h-9 text-xs bg-white border-neutral-200 w-24" />
                                        <Button type="button" size="sm" className="h-9 bg-green-600 hover:bg-green-700 text-white" onClick={addAllowance}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center px-6 py-4 bg-green-50 border border-green-100 rounded-2xl shadow-sm">
                                    <span className="text-xs font-black text-green-700 uppercase">Gross Earnings</span>
                                    <span className="text-xl font-black text-green-600">{formatCurrency(totalAllowances)}</span>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4" /> Deductions
                                    </h4>
                                    <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full uppercase">Debits</span>
                                </div>

                                <div className="bg-neutral-50/50 border border-neutral-100 rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium text-neutral-600">
                                        <span>EPF (8%)</span>
                                        <span className="font-bold text-neutral-900">{formatCurrency(epfAmount)}</span>
                                    </div>

                                    {deductions.map((de, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm group">
                                            <span className="text-neutral-500 font-medium">{de.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-neutral-900">{formatCurrency(de.amount)}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => removeDeduction(idx)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 mt-2 border-t border-dashed border-neutral-200 flex gap-2">
                                        <Input placeholder="Extra Deduction Name" value={newDeduction.name} onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })} className="h-9 text-xs bg-white border-neutral-200" />
                                        <Input type="number" placeholder="Amount" value={newDeduction.amount} onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })} className="h-9 text-xs bg-white border-neutral-200 w-24" />
                                        <Button type="button" size="sm" className="h-9 bg-red-600 hover:bg-red-700 text-white" onClick={addDeduction}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center px-6 py-4 bg-red-50 border border-red-100 rounded-2xl shadow-sm">
                                    <span className="text-xs font-black text-red-700 uppercase">Total Liabilites</span>
                                    <span className="text-xl font-black text-red-600">{formatCurrency(totalDeductions)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Salary Summary Card */}
                        <div className="relative group overflow-hidden rounded-3xl">
                            <div className="absolute inset-0 bg-primary opacity-5 group-hover:opacity-10 transition-opacity"></div>
                            <div className="relative bg-neutral-50 border border-neutral-200 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-6 ring-4 ring-neutral-50/50 shadow-inner">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">NET PAYABLE AMOUNT</p>
                                    </div>
                                    <p className="text-3xl font-black text-neutral-900 mt-1 filter drop-shadow-sm">{formatCurrency(netSalary)}</p>
                                    <p className="text-[10px] font-bold text-primary bg-primary/10 inline-block px-3 py-0.5 rounded-full mt-2 uppercase tracking-tighter shadow-sm border border-primary/20">
                                        {format(selectedDate, "MMMM yyyy")} Payroll
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                    <Button type="submit" className="h-12 px-8 text-sm font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                        <FileText className="h-4 w-4 mr-2" /> Process Payroll
                                    </Button>
                                    <Button type="button" variant="outline" className="h-12 px-6 border-neutral-300 font-extrabold hover:bg-neutral-100 uppercase tracking-widest text-[13px] text-neutral-500" onClick={() => navigate(-1)}>
                                        DISCARD
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default GeneratePayroll;
