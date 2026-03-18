import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import LoginRedirect from "./pages/LoginRedirect";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import ClientLogin from "./pages/ClientLogin";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardLayout from "./components/DashboardLayout";
import PlaceholderPage from "./components/PlaceholderPage";
import Careers from "./pages/Careers";
import Inquiries from "./pages/Inquiries";
import AreaManagerDashboard from "./pages/AreaManagerDashboard";
import ExecutiveOfficerDashboard from "./pages/ExecutiveOfficerDashboard";
import OperationalManagerDashboard from "./pages/OperationalManagerDashboard";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import EditProfile from "./pages/editProfile";
import AccountantDashboard from "./pages/AccountantDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";
import ChairmanDashboard from "./pages/ChairmanDashboard";
import LoanApproval from "./pages/LoanApproval";
import LoanDeductions from "./pages/LoanDeduction";
import DeductionSchedule from "./pages/DeductionSchedule";
import admin_PayrollPage from "./pages/admin_PayrollPage";
import admin_PayrollApprovalPage from "./pages/admin_PayrollApprovalPage";
import admin_PayrollListPage from "./pages/admin_PayrollListPage";

const queryClient = new QueryClient();

const clientItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Feedback", path: "feedback" },
  { label: "Projects", path: "projects" },
  { label: "Inquiries", path: "inquiries" },
  { label: "Shift Schedule", path: "shift-schedule" },
  { label: "Payments", path: "payments" },
];

function renderDashboardRoutes(items: { label: string; path: string }[]) {
  return (
    <>
      <Route index element={<PlaceholderPage title="Dashboard" />} />
      {items.map((item) => (
        <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />
      ))}
      <Route path="profile" element={<ProfilePage />} />
    </>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="ace-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth-redirect" element={<LoginRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/client-login" element={<ClientLogin />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/change-password" element={<ProtectedRoute requiredRoles={[]}><ChangePasswordPage /></ProtectedRoute>} />

            {/* Payroll Routes */}
            <Route path="/account-executive/payroll/create" element={<ProtectedRoute requiredRoles={['ACCOUNT_EXECUTIVE']}><admin_PayrollPage /></ProtectedRoute>} />
            <Route path="/account-executive/payroll/bank-submission" element={<ProtectedRoute requiredRoles={['ACCOUNT_EXECUTIVE']}><admin_PayrollListPage /></ProtectedRoute>} />
            <Route path="/director/payroll/approvals" element={<ProtectedRoute requiredRoles={['DIRECTOR']}><admin_PayrollApprovalPage /></ProtectedRoute>} />

            {/* Protected Area Manager Dashboard */}
            <Route path="/area-manager/*" element={<ProtectedRoute requiredRoles={['AREA_MANAGER']}><AreaManagerDashboard /></ProtectedRoute>} />

            {/* Protected Accountant Dashboard */}
            <Route path="/account-executive" element={<ProtectedRoute requiredRoles={['ACCOUNT_EXECUTIVE', 'ACCOUNTANT']}><AccountantDashboard /></ProtectedRoute>} />
            <Route path="/account-executive/*" element={<ProtectedRoute requiredRoles={['ACCOUNT_EXECUTIVE', 'ACCOUNTANT']}><AccountantDashboard /></ProtectedRoute>} />

            {/* Protected Operational Manager Dashboard */}
            <Route path="/operational-manager" element={<ProtectedRoute requiredRoles={['OPERATION_MANAGER', 'OPERATIONAL_MANAGER']}><OperationalManagerDashboard /></ProtectedRoute>} />
            <Route path="/operational-manager/*" element={<ProtectedRoute requiredRoles={['OPERATION_MANAGER', 'OPERATIONAL_MANAGER']}><OperationalManagerDashboard /></ProtectedRoute>} />

            {/* Protected Executive Officer Dashboard */}
            <Route path="/executive-officer/*" element={<ProtectedRoute requiredRoles={['EXECUTIVE_OFFICER']}><ExecutiveOfficerDashboard /></ProtectedRoute>} />

            {/* Protected Chairman Dashboard */}
            <Route path="/chairman" element={<ProtectedRoute requiredRoles={['CHAIRMAN']}><ChairmanDashboard /></ProtectedRoute>} />
            <Route path="/chairman/*" element={<ProtectedRoute requiredRoles={['CHAIRMAN']}><ChairmanDashboard /></ProtectedRoute>} />

            {/* Protected Director Dashboard */}
            <Route path="/director" element={<ProtectedRoute requiredRoles={['DIRECTOR']}><DirectorDashboard /></ProtectedRoute>} />
            <Route path="/director/*" element={<ProtectedRoute requiredRoles={['DIRECTOR']}><DirectorDashboard /></ProtectedRoute>} />

            {/* Protected Security Officer */}
            <Route path="/security-officer" element={<ProtectedRoute requiredRoles={['SECURITY_OFFICER']}><ProfilePage /></ProtectedRoute>} />
            <Route path="/security-officer/deductions" element={<ProtectedRoute requiredRoles={['SECURITY_OFFICER']}><DeductionSchedule /></ProtectedRoute>} />
            <Route path="/security-officer/*" element={<ProtectedRoute requiredRoles={['SECURITY_OFFICER']}><ProfilePage /></ProtectedRoute>} />

            <Route path="/client" element={<DashboardLayout title="Client Portal" role="Client" items={clientItems} basePath="/client" />}>
              {renderDashboardRoutes(clientItems)}
            </Route>

            <Route path="/loan-approval" element={<LoanApproval />} />
            <Route path="/loan-deductions" element={<LoanDeductions />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
