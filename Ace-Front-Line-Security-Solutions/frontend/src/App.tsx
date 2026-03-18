import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import ClientLogin from "./pages/ClientLogin";
import DashboardLayout from "./components/DashboardLayout";
import PlaceholderPage from "./components/PlaceholderPage";
import Careers from "./pages/Careers";
import Inquiries from "./pages/Inquiries";
import AdvanceRequests from "./pages/AdvanceRequests";
import EditPayroll from "./pages/EditPayroll";
import GeneratePayroll from "./pages/GeneratePayroll";
import MyPayslips from "./pages/MyPayslips";
import PayrollRecords from "./pages/PayrollRecords";
import PayslipDetail from "./pages/PayslipDetail";
import AccountantDashboard from "./pages/AccountantDashboard";
import SalaryTrends from "./pages/SalaryTrends";

const queryClient = new QueryClient();

const areaManagerItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Weekly Report", path: "weekly-report" },
  { label: "Monthly Report", path: "monthly-report" },
  { label: "Attendance", path: "attendance" },
  { label: "Monthly Statistics", path: "monthly-statistics" },
  { label: "Shift Schedule", path: "shift-schedule" },
  { label: "Leave Management", path: "leave-management" },
];

const accountantItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Generate Payroll", path: "generate-payroll" },
  { label: "Payroll Records", path: "payroll-records" },
  { label: "Salary Trends", path: "salary-trends" },
  { label: "Monthly Statistics", path: "monthly-statistics" },
  { label: "Advance Requests", path: "advance-requests" },
  { label: "Officers", path: "officers" },
  { label: "Invoices", path: "invoices" },
  { label: "Reports", path: "reports" },
  { label: "Payments", path: "payments" },
  { label: "Deductions", path: "deductions" },
  { label: "Loans", path: "loans" },
];

const securityOfficerItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Request Leave", path: "request-leave" },
  { label: "Request Uniform", path: "request-uniform" },
  { label: "Paysheet View", path: "paysheet-view" },
  { label: "Salary History", path: "salary-history" },
  { label: "Shift Schedule", path: "shift-schedule" },
  { label: "Officer Rosters", path: "officer-rosters" },
  { label: "Request a Loan", path: "request-loan" },
];

const operationalManagerItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Weekly Report", path: "weekly-report" },
  { label: "Client Management", path: "client-management" },
  { label: "Staff Management", path: "staff-management" },
  { label: "Inquiry Management", path: "inquiry-management" },
  { label: "Interview Management", path: "interview-management" },
  { label: "Client Feedback Review", path: "client-feedback" },
  { label: "Request a Leave", path: "request-leave" },
];

const executiveOfficerItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Uniform Distribution", path: "uniform-distribution" },
  { label: "Loan Request View", path: "loan-request-view" },
  { label: "Request a Leave", path: "request-leave" },
  { label: "Advance Requests", path: "advance-requests" },
];

const chairmanItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Monthly Report", path: "monthly-report" },
  { label: "Salary Trend", path: "salary-trend" },
  { label: "Meeting Schedule", path: "meeting-schedule" },
  { label: "Registration List", path: "registration-list" },
  { label: "Leave Approval", path: "leave-approval" },
];

const directorItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Monthly Report", path: "monthly-report" },
  { label: "Salary Trend", path: "salary-trend" },
  { label: "Meeting Schedule", path: "meeting-schedule" },
  { label: "Registration List", path: "registration-list" },
  { label: "Leave Approval", path: "leave-approval" },
];

const clientItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Feedback", path: "feedback" },
  { label: "Projects", path: "projects" },
  { label: "Inquiries", path: "inquiries" },
  { label: "Shift Schedule", path: "shift-schedule" },
  { label: "Payments", path: "payments" },
];

function renderDashboardRoutes(items: { label: string; path: string }[], role?: string) {
  return (
    <>
      <Route index element={role === "Accountant" ? <AccountantDashboard /> : <PlaceholderPage title="Dashboard" />} />
      {items.map((item) => {
        if (item.path === "dashboard" && role === "Accountant") {
          return <Route key={item.path} path={item.path} element={<AccountantDashboard />} />;
        }
        if (item.path === "advance-requests") {
          return <Route key={item.path} path={item.path} element={<AdvanceRequests role={role} />} />;
        }
        if (item.path === "generate-payroll") {
          return <Route key={item.path} path={item.path} element={<GeneratePayroll />} />;
        }
        if (item.path === "paysheet-view") {
          return <Route key={item.path} path={item.path} element={<MyPayslips mode="latest" />} />;
        }
        if (item.path === "payslip-view") {
          return <Route key={item.path} path={item.path} element={<PayslipDetail />} />;
        }
        if (item.path === "payroll-records") {
          return (
            <React.Fragment key={item.path}>
              <Route path={item.path} element={<PayrollRecords />} />
              <Route path={`${item.path}/edit/:id`} element={<EditPayroll />} />
            </React.Fragment>
          );
        }
        if (item.path === "salary-history") {
          return (
            <React.Fragment key={item.path}>
              <Route path={item.path} element={<MyPayslips mode="history" />} />
            </React.Fragment>
          );
        }
        if (item.path === "salary-trends") {
          return <Route key={item.path} path={item.path} element={<SalaryTrends />} />;
        }
        return <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />;
      })}
      <Route path="payslip/:id" element={<PayslipDetail />} />
      <Route path="profile" element={<PlaceholderPage title="Profile" />} />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/inquiries" element={<Inquiries />} />

          <Route path="/area-manager" element={<DashboardLayout title="Area Manager" role="Area Manager" items={areaManagerItems} basePath="/area-manager" />}>
            {renderDashboardRoutes(areaManagerItems, "Area Manager")}
          </Route>

          <Route path="/accountant" element={<DashboardLayout title="Accountant" role="Accountant" items={accountantItems} basePath="/accountant" />}>
            {renderDashboardRoutes(accountantItems, "Accountant")}
          </Route>

          <Route path="/operational-manager" element={<DashboardLayout title="Operational Manager" role="Operational Manager" items={operationalManagerItems} basePath="/operational-manager" />}>
            {renderDashboardRoutes(operationalManagerItems, "Operational Manager")}
          </Route>

          <Route path="/executive-officer" element={<DashboardLayout title="Executive Officer" role="Executive Officer" items={executiveOfficerItems} basePath="/executive-officer" />}>
            {renderDashboardRoutes(executiveOfficerItems, "Executive Officer")}
          </Route>

          <Route path="/chairman" element={<DashboardLayout title="Chairman" role="Chairman" items={chairmanItems} basePath="/chairman" />}>
            {renderDashboardRoutes(chairmanItems, "Chairman")}
          </Route>

          <Route path="/director" element={<DashboardLayout title="Director" role="Director" items={directorItems} basePath="/director" />}>
            {renderDashboardRoutes(directorItems, "Director")}
          </Route>

          <Route path="/security-officer" element={<DashboardLayout title="Security Officer" role="Security Officer" items={securityOfficerItems} basePath="/security-officer" />}>
            {renderDashboardRoutes(securityOfficerItems, "Security Officer")}
          </Route>

          <Route path="/client" element={<DashboardLayout title="Client Portal" role="Client" items={clientItems} basePath="/client" />}>
            {renderDashboardRoutes(clientItems, "Client")}
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
