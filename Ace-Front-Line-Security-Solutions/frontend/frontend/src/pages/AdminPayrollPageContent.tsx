import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader, DollarSign, Check, AlertCircle } from "lucide-react";
import { admin_payrollService, type AdminPayrollRequest, type PayrollResponse } from "@/services/admin_payrollService";
import { authService, type UserProfile } from "@/services/authService";
import { loanDeductionService, type LoanDeduction } from "@/services/loanDeductionService";

const ALLOWANCE_TYPES = [
  { id: "housing", label: "Housing Allowance" },
  { id: "transport", label: "Transport Allowance" },
  { id: "food", label: "Food Allowance" },
  { id: "medical", label: "Medical Allowance" },
  { id: "bonus", label: "Bonus" },
  { id: "other", label: "Other Allowance" },
];

export default function AdminPayrollPageContent() {
  const [user, setUser] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [otAmount, setOtAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [allowancesDetail, setAllowancesDetail] = useState<Record<string, number>>(
    Object.fromEntries(ALLOWANCE_TYPES.map((a) => [a.id, 0]))
  );
  const [loanDeduction, setLoanDeduction] = useState(0);
  const [advanceDeduction, setAdvanceDeduction] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [createdPayrolls, setCreatedPayrolls] = useState<PayrollResponse[]>([]);
  const [loanDeductions, setLoanDeductions] = useState<LoanDeduction[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const searchEmployee = async () => {
    if (!employeeId.trim()) {
      toast.error("Please enter an Employee ID");
      return;
    }

    const trimmedId = employeeId.trim();

    setLoading(true);
    try {
      const profile = await authService.getUserById(trimmedId);
      setEmployee(profile);
      
      // Fetch loan deductions for this employee's current month
      setLoadingLoans(true);
      try {
        const deductions = await loanDeductionService.getDeductionsForMonth(payMonth);
        // Filter for current employee only
        const employeeDeductions = deductions.filter(d => d.user.id === profile.id);
        setLoanDeductions(employeeDeductions);
        
        // Auto-fill loan deduction if found for this month
        if (employeeDeductions.length > 0) {
          const totalLoanDeduction = employeeDeductions.reduce((sum, d) => sum + d.amount, 0);
          setLoanDeduction(totalLoanDeduction);
        } else {
          setLoanDeduction(0);
        }
      } catch (loanError) {
        console.warn("Failed to fetch loan deductions:", loanError);
        setLoanDeductions([]);
      } finally {
        setLoadingLoans(false);
      }
      
      toast.success("Employee found - Database connection verified ✓");
    } catch (error) {
      toast.error("Employee not found in database");
      setEmployee(null);
      setLoanDeductions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAllowanceChange = (id: string, value: number) => {
    setAllowancesDetail((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const createPayroll = async () => {
    if (!employee) {
      toast.error("Please select an employee first");
      return;
    }

    setCreating(true);
    try {
      const totalAllowances = Object.values(allowancesDetail).reduce((sum, val) => sum + val, 0);
      const request: AdminPayrollRequest = {
        employeeId: parseInt(employeeId.trim(), 10),
        payMonth,
        basicSalary: employee.basicSalary || 0,
        otAmount,
        allowances: totalAllowances,
        allowancesDetail,
        loanDeduction,
        advanceDeduction,
        otherDeductions,
        remarks: remarks || undefined,
      };

      const response = await admin_payrollService.createPayroll(request);
      
      // Submit for director approval immediately after creation
      await admin_payrollService.submitForApproval(response.id);
      
      setCreatedPayrolls((prev) => [...prev, response]);
      toast.success("Payroll created and submitted to director for approval!");

      // Reset form
      setEmployeeId("");
      setEmployee(null);
      setOtAmount(0);
      setRemarks("");
      setAllowancesDetail(Object.fromEntries(ALLOWANCE_TYPES.map((a) => [a.id, 0])));
      setLoanDeduction(0);
      setLoanDeductions([]);
      setAdvanceDeduction(0);
      setOtherDeductions(0);
    } catch (error) {
      toast.error("Failed to create payroll");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const basicSalary = employee?.basicSalary || 0;
  const totalAllowances = Object.values(allowancesDetail).reduce((sum, val) => sum + val, 0);
  const grossSalary = basicSalary + totalAllowances + otAmount;
  const totalDeductions = loanDeduction + advanceDeduction + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  return (
    <div className="space-y-8">
      {/* Title Section */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
          <DollarSign className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Generate Admin Payroll
          </h2>
          <p className="text-sm text-muted-foreground">Create payroll for admin personnel</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Search */}
          <Card className="bg-card border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-sm mb-2 block">Employee ID</Label>
                  <Input
                    placeholder="Enter Employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={searchEmployee}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 mt-6"
                >
                  {loading ? <Loader className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {employee && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium">{employee.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    <span className="font-medium">{employee.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Basic Salary:</span>
                    <span className="font-medium">LKR {(employee.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  {employee.bankName && (
                    <>
                      <div className="border-t border-border/40 pt-2 mt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bank Details</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bank Name:</span>
                          <span className="font-medium">{employee.bankName}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Account Number:</span>
                          <span className="font-medium">{employee.bankAccountNumber}</span>
                        </div>
                        {employee.bankBranch && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-muted-foreground">Branch:</span>
                            <span className="font-medium">{employee.bankBranch}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary Components */}
          {employee && (
            <>
              <Card className="bg-card border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Salary Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Pay Month</Label>
                    <Input type="month" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} />
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">OT Amount (LKR)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={otAmount}
                      onChange={(e) => setOtAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Allowances */}
              <Card className="bg-card border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Allowances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ALLOWANCE_TYPES.map((allowance) => (
                    <div key={allowance.id} className="flex items-center gap-3">
                      <Checkbox id={allowance.id} />
                      <Label htmlFor={allowance.id} className="flex-1 cursor-pointer">
                        {allowance.label}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-24"
                        value={allowancesDetail[allowance.id] || 0}
                        onChange={(e) => handleAllowanceChange(allowance.id, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Deductions */}
              <Card className="bg-card border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Deductions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Loan Deduction with Schedule */}
                  <div>
                    <Label className="text-sm mb-2 block">Loan Deduction (LKR)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={loanDeduction}
                        onChange={(e) => setLoanDeduction(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                      {loadingLoans && <Loader className="h-4 w-4 animate-spin" />}
                    </div>
                    
                    {/* Loan Deduction Schedule Display */}
                    {loanDeductions.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-2">Active Loan Deductions Schedule</p>
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Loan Amount</TableHead>
                              <TableHead className="text-xs">Monthly</TableHead>
                              <TableHead className="text-xs">Month</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loanDeductions.map((deduction) => (
                              <TableRow key={deduction.id} className="text-xs">
                                <TableCell>LKR {deduction.loanRequest.amount.toLocaleString()}</TableCell>
                                <TableCell>LKR {deduction.amount.toLocaleString()}</TableCell>
                                <TableCell>{deduction.deductionMonth}</TableCell>
                                <TableCell>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      deduction.status === "PAID"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {deduction.status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Advance Deduction (LKR)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={advanceDeduction}
                      onChange={(e) => setAdvanceDeduction(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Other Deductions (LKR)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Remarks */}
              <Card className="bg-card border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Remarks (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add any special notes or remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="min-h-20"
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Right Side - Summary */}
        {employee && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Payroll Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-medium">LKR {basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">OT Amount</span>
                    <span className="font-medium">LKR {otAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Allowances</span>
                    <span className="font-medium">LKR {totalAllowances.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Gross Salary</span>
                    <span className="font-bold text-primary">LKR {grossSalary.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Loan Deduction</span>
                    <span className="font-medium">LKR {loanDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Advance Deduction</span>
                    <span className="font-medium">LKR {advanceDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Other Deductions</span>
                    <span className="font-medium">LKR {otherDeductions.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Net Salary</span>
                    <span className="font-bold text-green-600 text-lg">LKR {netSalary.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={createPayroll}
                  disabled={creating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white mt-6 font-semibold"
                >
                  {creating ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {creating ? "Creating..." : "Create Payroll"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Recently Created Payrolls */}
      {createdPayrolls.length > 0 && (
        <Card className="bg-card border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Recently Created Payrolls</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {createdPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                    <TableCell>{payroll.payMonth}</TableCell>
                    <TableCell className="font-semibold">LKR {(payroll.netSalary || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Pending Approval</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
