import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import ClientLogin from "./pages/client/ClientLogin";
import DashboardLayout from "./components/DashboardLayout";
import PlaceholderPage from "./components/PlaceholderPage";
import Careers from "./pages/Careers";
import Inquiries from "./pages/Inquiries";

import ClientDashboard from "./pages/client/ClientDashboard";
import ClientInvoices from "./pages/client/ClientInvoices";
import ClientInvoiceDetail from "./pages/client/ClientInvoiceDetail";
import ClientPayments from "./pages/client/ClientPayments";
import ClientProfile from "./pages/client/ClientProfile";
import AccountantInvoices from "./pages/accountant/AccountantInvoices";
import AccountantInvoiceQueue from "./pages/accountant/AccountantInvoiceQueue";
import AccountantInvoiceReview from "./pages/accountant/AccountantInvoiceReview";
import AccountantCreateInvoice from "./pages/accountant/AccountantCreateInvoice";
import ClientManagement from "./pages/operational-manager/ClientManagement";
import ClientFeedback from "./pages/client/ClientFeedback";
import ClientUploadPaymentProof from "./pages/client/ClientUploadPaymentProof";
import AccountantPayments from "./pages/accountant/AccountantPayments";
import AccountantPaymentVerify from "./pages/accountant/AccountantPaymentVerify";
import OperationalManagerFeedback from "./pages/operational-manager/OperationalManagerFeedback";
import FeedbackAllPage from "./pages/FeedbackAllPage";

const queryClient = new QueryClient();

const areaManagerItems = [
    { label: "Dashboard",          path: "dashboard" },
    { label: "Weekly Report",      path: "weekly-report" },
    { label: "Monthly Report",     path: "monthly-report" },
    { label: "Attendance",         path: "attendance" },
    { label: "Monthly Statistics", path: "monthly-statistics" },
    { label: "Shift Schedule",     path: "shift-schedule" },
    { label: "Leave Management",   path: "leave-management" },
];

const accountantItems = [
    { label: "Dashboard",         path: "dashboard" },
    { label: "Generate Payroll",  path: "generate-payroll" },
    { label: "Payroll Records",   path: "payroll-records" },
    { label: "Salary Trends",     path: "salary-trends" },
    { label: "Monthly Statistics",path: "monthly-statistics" },
    { label: "Advance Requests",  path: "advance-requests" },
    { label: "Officers",          path: "officers" },
    { label: "Invoices",          path: "invoices" },          // ← will now use real page
    { label: "Reports",           path: "reports" },
    { label: "Payments",          path: "payments" },
    { label: "Deductions",        path: "deductions" },
    { label: "Loans",             path: "loans" },
];

const securityOfficerItems = [
    { label: "Dashboard",      path: "dashboard" },
    { label: "Request Leave",  path: "request-leave" },
    { label: "Request Uniform",path: "request-uniform" },
    { label: "Paysheet View",  path: "paysheet-view" },
    { label: "Salary History", path: "salary-history" },
    { label: "Shift Schedule", path: "shift-schedule" },
    { label: "Officer Rosters",path: "officer-rosters" },
    { label: "Request a Loan", path: "request-loan" },
];

const operationalManagerItems = [
    { label: "Dashboard",            path: "dashboard" },
    { label: "Weekly Report",        path: "weekly-report" },
    { label: "Client Management",    path: "client-management" },
    { label: "Staff Management",     path: "staff-management" },
    { label: "Inquiry Management",   path: "inquiry-management" },
    { label: "Interview Management", path: "interview-management" },
    { label: "Client Feedback Review",path: "client-feedback" },
    { label: "Request a Leave",      path: "request-leave" },
];

const executiveOfficerItems = [
    { label: "Dashboard",          path: "dashboard" },
    { label: "Uniform Distribution",path: "uniform-distribution" },
    { label: "Loan Request View",  path: "loan-request-view" },
    { label: "Request a Leave",    path: "request-leave" },
];

const chairmanItems = [
    { label: "Dashboard",        path: "dashboard" },
    { label: "Monthly Report",   path: "monthly-report" },
    { label: "Salary Trend",     path: "salary-trend" },
    { label: "Meeting Schedule", path: "meeting-schedule" },
    { label: "Registration List",path: "registration-list" },
    { label: "Leave Approval",   path: "leave-approval" },
];

const directorItems = [
    { label: "Dashboard",        path: "dashboard" },
    { label: "Monthly Report",   path: "monthly-report" },
    { label: "Salary Trend",     path: "salary-trend" },
    { label: "Meeting Schedule", path: "meeting-schedule" },
    { label: "Registration List",path: "registration-list" },
    { label: "Leave Approval",   path: "leave-approval" },
];

const clientItems = [
    { label: "Dashboard",     path: "dashboard" },
    { label: "Feedback",      path: "feedback" },
    { label: "Projects",      path: "projects" },
    { label: "Inquiries",     path: "inquiries" },
    { label: "Shift Schedule",path: "shift-schedule" },
    { label: "Invoices",         path: "invoices" },   // ← will now use real page
    { label: "Payments",         path: "payments" },
    { label: "Company Profile",  path: "company-profile" },
];

function renderDashboardRoutes(items: { label: string; path: string }[]) {
    return (
        <>
            <Route index element={<PlaceholderPage title="Dashboard" />} />
            <Route path="feedback" element={<ClientFeedback />} />

            {items.map((item) => (
                <Route
                    key={item.path}
                    path={item.path}
                    element={<PlaceholderPage title={item.label} />}
                />
            ))}
            <Route path="profile" element={<PlaceholderPage title="Profile" />} />
        </>
    );
}

function renderClientRoutes(items: { label: string; path: string }[]) {
    return (
        <>
            <Route index element={<ClientDashboard />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="invoices"  element={<ClientInvoices />} />
            <Route path="invoices/:id" element={<ClientInvoiceDetail />} />
            <Route path="payments" element={<ClientPayments />} />
            <Route path="feedback" element={<ClientFeedback />} />

            {items
                .filter((i) => i.path !== "dashboard" && i.path !== "invoices" && i.path !== "payments" && i.path !== "feedback" && i.path !== "company-profile")
                .map((item) => (
                    <Route
                        key={item.path}
                        path={item.path}
                        element={<PlaceholderPage title={item.label} />}
                    />
                ))}

            <Route path="company-profile" element={<ClientProfile />} />
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
                    <Route path="/careers"   element={<Careers />} />
                    <Route path="/inquiries" element={<Inquiries />} />

                    <Route path="/area-manager" element={
                        <DashboardLayout title="Area Manager" role="Area Manager"
                                         items={areaManagerItems} basePath="/area-manager" />
                    }>
                        {renderDashboardRoutes(areaManagerItems)}
                    </Route>

                    {/* ── Accountant — invoices use real page ── */}
                    <Route path="/accountant" element={
                        <DashboardLayout title="Accountant" role="Accountant"
                                         items={accountantItems} basePath="/accountant" />
                    }>
                        <Route index element={<PlaceholderPage title="Dashboard" />} />
                        <Route path="dashboard"         element={<PlaceholderPage title="Dashboard" />} />
                        <Route path="invoices"          element={<AccountantInvoices />} />
                        <Route path="invoices/create"   element={<AccountantCreateInvoice />} />
                        <Route path="invoices/queue"    element={<AccountantInvoiceQueue />} />
                        <Route path="invoices/review/:invoiceId" element={<AccountantInvoiceReview />} />
                        <Route path="invoices/create" element={<AccountantCreateInvoice />} />
                        <Route path="generate-payroll"  element={<PlaceholderPage title="Generate Payroll" />} />
                        <Route path="payroll-records"   element={<PlaceholderPage title="Payroll Records" />} />
                        <Route path="salary-trends"     element={<PlaceholderPage title="Salary Trends" />} />
                        <Route path="monthly-statistics"element={<PlaceholderPage title="Monthly Statistics" />} />
                        <Route path="advance-requests"  element={<PlaceholderPage title="Advance Requests" />} />
                        <Route path="officers"          element={<PlaceholderPage title="Officers" />} />
                        <Route path="reports"           element={<PlaceholderPage title="Reports" />} />
                        <Route path="payments"          element={<AccountantPayments />} />
                        <Route path="payments/:paymentId" element={<AccountantPaymentVerify />} />
                        <Route path="deductions"        element={<PlaceholderPage title="Deductions" />} />
                        <Route path="loans"             element={<PlaceholderPage title="Loans" />} />
                        <Route path="profile"           element={<PlaceholderPage title="Profile" />} />
                    </Route>

                    <Route path="/operational-manager" element={
                        <DashboardLayout title="Operational Manager" role="Operational Manager"
                                         items={operationalManagerItems} basePath="/operational-manager" />
                    }>
                        <Route index element={<PlaceholderPage title="Dashboard" />} />
                        <Route path="dashboard"          element={<PlaceholderPage title="Dashboard" />} />
                        <Route path="client-management"  element={<ClientManagement />} />
                        <Route path="weekly-report"      element={<PlaceholderPage title="Weekly Report" />} />
                        <Route path="staff-management"   element={<PlaceholderPage title="Staff Management" />} />
                        <Route path="inquiry-management" element={<PlaceholderPage title="Inquiry Management" />} />
                        <Route path="interview-management" element={<PlaceholderPage title="Interview Management" />} />
                        <Route path="client-feedback"    element={<OperationalManagerFeedback />} />
                        <Route path="request-leave"      element={<PlaceholderPage title="Request a Leave" />} />
                        <Route path="profile"            element={<PlaceholderPage title="Profile" />} />
                    </Route>

                    <Route path="/executive-officer" element={
                        <DashboardLayout title="Executive Officer" role="Executive Officer"
                                         items={executiveOfficerItems} basePath="/executive-officer" />
                    }>
                        {renderDashboardRoutes(executiveOfficerItems)}
                    </Route>

                    <Route path="/chairman" element={
                        <DashboardLayout title="Chairman" role="Chairman"
                                         items={chairmanItems} basePath="/chairman" />
                    }>
                        {renderDashboardRoutes(chairmanItems)}
                    </Route>

                    <Route path="/director" element={
                        <DashboardLayout title="Director" role="Director"
                                         items={directorItems} basePath="/director" />
                    }>
                        {renderDashboardRoutes(directorItems)}
                    </Route>

                    <Route path="/security-officer" element={
                        <DashboardLayout title="Security Officer" role="Security Officer"
                                         items={securityOfficerItems} basePath="/security-officer" />
                    }>
                        {renderDashboardRoutes(securityOfficerItems)}
                    </Route>

                    <Route path="/client" element={
                        <DashboardLayout title="Client Portal" role="Client"
                                         items={clientItems} basePath="/client" />
                    }>
                        {renderClientRoutes(clientItems)}
                    </Route>

                    {/* Standalone page — no sidebar */}
                    <Route path="/client/invoices/:id/upload-proof" element={<ClientUploadPaymentProof />} />

                    {/* Public feedback reviews page */}
                    <Route path="/reviews" element={<FeedbackAllPage />} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;