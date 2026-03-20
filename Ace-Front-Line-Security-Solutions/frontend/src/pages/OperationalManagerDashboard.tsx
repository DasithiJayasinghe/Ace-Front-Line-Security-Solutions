import { useState, useEffect } from "react";
import { LayoutDashboard, FileText, UserPlus, Users, MessageSquare, Shield, Building2, ClipboardList, ExternalLink } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import ProfilePage from "@/pages/ProfilePage";
import AdminRegistration from "@/pages/AdminRegistration";
import SecurityOfficerRegistration from "@/pages/SecurityOfficerRegistration";
import UserDirectory from "@/pages/UserDirectory";
import { authService } from "@/services/authService";

const OpManagerWeeklyReport = () => (
  <div className="bg-card rounded-lg p-6"><p>Weekly Report view coming soon</p></div>
);

const OpManagerInterviewManagement = () => (
  <div className="bg-card rounded-lg p-6"><p>Interview Management coming soon</p></div>
);

const OpManagerClientFeedback = () => (
  <div className="bg-card rounded-lg p-6"><p>Client Feedback view coming soon</p></div>
);

type TabType = "dashboard" | "weekly-report" | "registration" | "interview" | "feedback";

/* ─── Feature card: centred icon → title → description → CTA ─── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 text-center">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed text-center mb-6 flex-1">{description}</p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}

function StatCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-4xl font-bold text-primary mb-2">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function OperationalManagerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [registrationView, setRegistrationView] = useState<"cards" | "admin" | "security" | "directory">("cards");
  const [user, setUser] = useState<any>(null);
  const [totalRegistrations, setTotalRegistrations] = useState<number>(0);
  const [interviewApplicants, setInterviewApplicants] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isProfile = location.pathname.endsWith("/profile");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const users = await authService.getAllUsers();
        setTotalRegistrations(Array.isArray(users) ? users.length : 0);

        const savedApplicantCount = Number(localStorage.getItem("interviewApplicantsCount") || 0);
        setInterviewApplicants(Number.isFinite(savedApplicantCount) ? savedApplicantCount : 0);
      } catch (error: any) {
        setStatsError(error?.message || "Unable to load dashboard stats");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

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
    { icon: FileText, label: "Weekly Report", id: "weekly-report" as TabType },
    { icon: UserPlus, label: "Registration Management", id: "registration" as TabType },
    { icon: Users, label: "Interview Management", id: "interview" as TabType },
    { icon: MessageSquare, label: "Client Feedback", id: "feedback" as TabType },
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId !== "registration") setRegistrationView("cards");
  };

  /* ─── Shared header ─── */
  const renderHeader = () => (
    <DashboardHeader
      userName={user?.fullName || "Operation Manager"}
      userRole="Operation Manager"
      onLogout={handleLogout}
      userId={user?.userId || 0}
      backendRole="OPERATION_MANAGER"
      profilePath="/operational-manager/profile"
    />
  );

  /* ─── Footer ─── */
  const renderFooter = () => (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground tracking-wide uppercase">
          © {new Date().getFullYear()} Ace Front Line Security Solutions
        </p>
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer tracking-wide uppercase">Privacy Policy</span>
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer tracking-wide uppercase">Security Terms</span>
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer tracking-wide uppercase">Support</span>
        </div>
      </div>
    </footer>
  );

  /* ─── View All Users bar ─── */
  const renderUserDirectoryBar = () => (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardList className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground mb-1">View All Users</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Access the comprehensive central database of all registered personnel.
            Audit active profiles, update operational status, and review historical data across all levels.
          </p>
        </div>
        <button 
          onClick={() => setRegistrationView("directory")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
        >
          <ExternalLink className="h-4 w-4" />
          Open User Directory
        </button>
      </div>
    </div>
  );

  // Profile route
  if (isProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1"><ProfilePage /></main>
        {renderFooter()}
      </div>
    );
  }

  // Registration sub-views
  if (activeTab === "registration" && registrationView === "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
          <AdminRegistration onBack={() => setRegistrationView("cards")} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  if (activeTab === "registration" && registrationView === "security") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
          <SecurityOfficerRegistration onBack={() => setRegistrationView("cards")} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  if (activeTab === "registration" && registrationView === "directory") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
          <UserDirectory onBack={() => setRegistrationView("cards")} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {renderHeader()}

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* ─── Dashboard Tab ─── */}
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome back to the Ace Frontline Administrative Portal</p>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground">Key operational statistics for your team.</p>
            </div>

            {statsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-6">
                <p className="text-sm text-destructive">{statsError}</p>
              </div>
            )}

            {statsLoading ? (
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <p className="text-muted-foreground">Loading dashboard statistics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <StatCard
                  title="Total Registrations"
                  value={totalRegistrations}
                  description="Total number of users registered in the system."
                />
                <StatCard
                  title="Interview Applicants"
                  value={interviewApplicants}
                  description="Current number of interview applicants tracked for this operational period."
                />
              </div>
            )}
          </div>
        )}

        {/* ─── Weekly Report Tab ─── */}
        {activeTab === "weekly-report" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Weekly Report</h2>
            <p className="text-muted-foreground mb-8">View and manage weekly reports and summaries.</p>
            <OpManagerWeeklyReport />
          </div>
        )}

        {/* ─── Registration Management Tab ─── */}
        {activeTab === "registration" && registrationView === "cards" && (
          <div>
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Registration Management</h2>
              <p className="text-muted-foreground">Register new admin personnel, security officers, and area managers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <FeatureCard
                icon={UserPlus}
                title="Admin Personnel"
                description="Complete onboarding for Directors, Chairmen, Operation Managers, and Account Executives. Manage administrative access levels and core platform permissions."
                buttonText="Start Admin Registration"
                onClick={() => setRegistrationView("admin")}
              />
              <FeatureCard
                icon={Shield}
                title="Security Force"
                description="Register Security Officers and Area Managers. Define patrol zones, shift assignments, and operational reporting structures."
                buttonText="Start Staff Registration"
                onClick={() => setRegistrationView("security")}
              />
              <FeatureCard
                icon={Building2}
                title="Client Registration"
                description="Module for onboarding corporate partners, managing service contracts, and configuring site-specific security requirements and personnel needs."
                buttonText="Start Registration"
              />
            </div>

            {renderUserDirectoryBar()}
          </div>
        )}

        {/* ─── Interview Management Tab ─── */}
        {activeTab === "interview" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Interview Management</h2>
            <p className="text-muted-foreground mb-8">Manage interviews and candidate tracking.</p>
            <OpManagerInterviewManagement />
          </div>
        )}

        {/* ─── Client Feedback Tab ─── */}
        {activeTab === "feedback" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Client Feedback</h2>
            <p className="text-muted-foreground mb-8">Review and respond to client feedback.</p>
            <OpManagerClientFeedback />
          </div>
        )}
      </main>

      {renderFooter()}
    </div>
  );
}
