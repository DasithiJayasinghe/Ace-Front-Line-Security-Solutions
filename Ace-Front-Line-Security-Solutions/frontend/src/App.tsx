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

import JsoSchedulePage from "./pages/shift-schedule/JsoSchedulePage";
import AreaManagerSchedulePage from "./pages/shift-schedule/AreaManagerSchedulePage";
import OfficerSchedulePage from "./pages/shift-schedule/OfficerSchedulePage";
import ExecutiveSchedulePage from "./pages/shift-schedule/ExecutiveSchedulePage";
import ClientSchedulePage from "./pages/shift-schedule/ClientSchedulePage";

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

import MyLeaveRequests from "./pages/leave-requests/MyLeaveRequests";
import AreaManagerLeaveApprovals from "./pages/leave-requests/AreaManagerLeaveApprovals";

function renderDashboardRoutes(items: { label: string; path: string }[]) {
  return (
    <>
      <Route index element={<PlaceholderPage title="Dashboard" />} />
      {items.map((item) => {
        if (item.path === 'shift-schedule' || item.path === 'request-leave' || item.path === 'leave-management') return null;
        return <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />;
      })}
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
            <Route path="shift-schedule" element={<AreaManagerSchedulePage />} />
            <Route path="leave-management" element={<AreaManagerLeaveApprovals />} />
            {renderDashboardRoutes(areaManagerItems)}
          </Route>

          <Route path="/accountant" element={<DashboardLayout title="Accountant" role="Accountant" items={accountantItems} basePath="/accountant" />}>
            {renderDashboardRoutes(accountantItems)}
          </Route>

          <Route path="/operational-manager" element={<DashboardLayout title="Operational Manager" role="Operational Manager" items={operationalManagerItems} basePath="/operational-manager" />}>
            <Route path="request-leave" element={<MyLeaveRequests />} />
            {renderDashboardRoutes(operationalManagerItems)}
          </Route>

          <Route path="/executive-officer" element={<DashboardLayout title="Executive Officer" role="Executive Officer" items={executiveOfficerItems} basePath="/executive-officer" />}>
            <Route path="shift-schedule" element={<ExecutiveSchedulePage />} />
            <Route path="request-leave" element={<MyLeaveRequests />} />
            {renderDashboardRoutes(executiveOfficerItems)}
          </Route>

          <Route path="/chairman" element={<DashboardLayout title="Chairman" role="Chairman" items={chairmanItems} basePath="/chairman" />}>
            {renderDashboardRoutes(chairmanItems)}
          </Route>

          <Route path="/director" element={<DashboardLayout title="Director" role="Director" items={directorItems} basePath="/director" />}>
            {renderDashboardRoutes(directorItems)}
          </Route>

          <Route path="/security-officer" element={<DashboardLayout title="Security Officer" role="Security Officer" items={securityOfficerItems} basePath="/security-officer" />}>
            <Route path="shift-schedule" element={<JsoSchedulePage />} />
            <Route path="officer-shifts" element={<OfficerSchedulePage />} />
            <Route path="request-leave" element={<MyLeaveRequests />} />
            {renderDashboardRoutes(securityOfficerItems)}
          </Route>

          <Route path="/client" element={<DashboardLayout title="Client Portal" role="Client" items={clientItems} basePath="/client" />}>
            <Route path="shift-schedule" element={<ClientSchedulePage />} />
            {renderDashboardRoutes(clientItems)}
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
