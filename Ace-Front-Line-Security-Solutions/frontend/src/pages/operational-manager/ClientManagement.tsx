import { useEffect, useState, useMemo } from "react";
import { clientApi } from "@/lib/api";
import type { Client, SuccessData } from "@/types/client";
import {
  Users,
  CheckCircle,
  PauseCircle,
  CalendarX,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Download,
  Filter,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Ban,
  XCircle,
  RotateCcw,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ───────────────────────────── types / helpers ────────────────────────────── */

type View = "list" | "register" | "success" | "detail";

type RegisterForm = {
  companyName: string;
  companyRegistrationNo: string;
  vatNumber: string;
  industryType: string;
  address: string;
  serviceLocation: string;
  city: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  serviceStartDate: string;
  contractDurationMonths: string;
  oicCount: string;
  jsoCount: string;
  oicRatePerShift: string;
  jsoRatePerShift: string;
  otRatePerHour: string;
  riskLevel: string;
  recommendedOfficers: string;
};

const emptyForm: RegisterForm = {
  companyName: "",
  companyRegistrationNo: "",
  vatNumber: "",
  industryType: "",
  address: "",
  serviceLocation: "",
  city: "",
  contactPersonName: "",
  contactPersonDesignation: "",
  contactPersonEmail: "",
  contactPersonPhone: "",
  serviceStartDate: "",
  contractDurationMonths: "12",
  oicCount: "0",
  jsoCount: "0",
  oicRatePerShift: "0.00",
  jsoRatePerShift: "0.00",
  otRatePerHour: "0.00",
  riskLevel: "LOW",
  recommendedOfficers: "",
};

const INDUSTRY_OPTIONS = [
  "Banking & Finance",
  "Commercial Real Estate",
  "Retail & Supermarkets",
  "Manufacturing",
  "Healthcare",
  "Hospitality & Hotels",
  "Logistics & Warehousing",
  "Construction",
  "Technology",
  "Government",
  "Education",
  "Apparel",
  "Other",
];

const ROWS_PER_PAGE = 10;

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    SUSPENDED: "bg-amber-100 text-amber-700",
    TERMINATED: "bg-red-100 text-red-700",
    EXPIRED: "bg-rose-100 text-rose-700",
    EXPIRING: "bg-red-100 text-red-700",
  };
  return map[s] || "bg-muted text-muted-foreground";
};

const formatDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (n?: number) =>
  `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getDisplayStatus = (client: Client): string => {
  if (client.status === "ACTIVE" && client.contractEndDate) {
    const end = new Date(client.contractEndDate);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff > 0 && diff <= 60) return "EXPIRING";
  }
  return client.status;
};

const TABS = [
  { label: "Company Info", icon: "business" },
  { label: "Contact", icon: "person" },
  { label: "Deployment", icon: "location_on" },
  { label: "Rates", icon: "payments" },
  { label: "AI Risk", icon: "shield" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         CLIENT MANAGEMENT PAGE                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ClientManagement = () => {
  const [view, setView] = useState<View>("list");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  /* ── list state ── */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterIndustry, setFilterIndustry] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  /* ── register state ── */
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState<RegisterForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── data fetching ── */
  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientApi.getAll();
      setClients(data || []);
    } catch {
      setError("Failed to load clients. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /* ── computed stats ── */
  const total = clients.length;
  const active = clients.filter((c) => c.status === "ACTIVE").length;
  const suspended = clients.filter((c) => c.status === "SUSPENDED").length;
  const expiring = clients.filter((c) => {
    if (!c.contractEndDate) return false;
    const end = new Date(c.contractEndDate);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 60;
  }).length;

  /* ── filtered + paginated ── */
  const industries = useMemo(
    () => [...new Set(clients.map((c) => c.industryType).filter(Boolean))].sort(),
    [clients]
  );

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPersonEmail.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPersonName.toLowerCase().includes(search.toLowerCase()) ||
        (c.clientCode || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "ALL" ||
        (filterStatus === "EXPIRING"
          ? getDisplayStatus(c) === "EXPIRING"
          : c.status === filterStatus);
      const matchIndustry =
        filterIndustry === "ALL" || c.industryType === filterIndustry;
      return matchSearch && matchStatus && matchIndustry;
    });
  }, [clients, search, filterStatus, filterIndustry]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterIndustry]);

  /* ── actions ── */
  const handleAction = async (
    clientId: number,
    action: "suspend" | "terminate" | "reactivate"
  ) => {
    if (!confirm(`Are you sure you want to ${action} this client?`)) return;
    setActionLoading(clientId);
    try {
      await clientApi[action](clientId);
      fetchClients();
    } catch {
      alert(`Failed to ${action} client.`);
    } finally {
      setActionLoading(null);
    }
  };

  /* ── registration ── */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = async () => {
    // basic validation
    if (!form.companyName.trim()) {
      setFormError("Company name is required.");
      setActiveTab(0);
      return;
    }
    if (!form.contactPersonName.trim() || !form.contactPersonEmail.trim()) {
      setFormError("Contact person name and email are required.");
      setActiveTab(1);
      return;
    }
    if (!form.serviceLocation.trim()) {
      setFormError("Service location is required.");
      setActiveTab(2);
      return;
    }
    if (!form.serviceStartDate) {
      setFormError("Service start date is required.");
      setActiveTab(2);
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const data = await clientApi.register({
        companyName: form.companyName,
        companyRegistrationNo: form.companyRegistrationNo,
        vatNumber: form.vatNumber,
        industryType: form.industryType,
        address: form.address,
        serviceLocation: form.serviceLocation,
        city: form.city,
        contactPersonName: form.contactPersonName,
        contactPersonDesignation: form.contactPersonDesignation,
        contactPersonEmail: form.contactPersonEmail,
        contactPersonPhone: form.contactPersonPhone,
        serviceStartDate: form.serviceStartDate,
        contractDurationMonths: Number(form.contractDurationMonths) || 12,
        oicCount: Number(form.oicCount) || 0,
        jsoCount: Number(form.jsoCount) || 0,
        oicRatePerShift: Number(form.oicRatePerShift) || 0,
        jsoRatePerShift: Number(form.jsoRatePerShift) || 0,
        otRatePerHour: Number(form.otRatePerHour) || 0,
        riskLevel: form.riskLevel,
        recommendedOfficers: Number(form.recommendedOfficers) || undefined,
      });

      setSuccessData({
        companyName: data.companyName,
        username: data.username,
        temporaryPassword: data.temporaryPassword,
        contactPersonEmail: data.contactPersonEmail,
      });
      setView("success");
      setForm(emptyForm);
      setActiveTab(0);
      fetchClients();
    } catch (e: any) {
      setFormError(e?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToRegister = () => {
    setForm(emptyForm);
    setActiveTab(0);
    setFormError("");
    setView("register");
  };

  /* ── risk helpers ── */
  const riskScore =
    form.riskLevel === "LOW"
      ? 25
      : form.riskLevel === "MEDIUM"
      ? 64
      : form.riskLevel === "HIGH"
      ? 82
      : 95;
  const riskLabel =
    form.riskLevel === "LOW"
      ? "LOW RISK"
      : form.riskLevel === "MEDIUM"
      ? "MEDIUM RISK"
      : form.riskLevel === "HIGH"
      ? "HIGH RISK"
      : "CRITICAL";

  /* ── shared classes ── */
  const inputClass =
    "w-full border border-input bg-muted/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
  const labelClass = "block text-xs font-bold text-foreground mb-1.5";

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                             LIST VIEW                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderListView = () => {
    const stats = [
      {
        label: "Total Clients",
        value: total.toLocaleString(),
        icon: Users,
        trend: "12%",
        up: true,
        color: "",
        bg: "bg-yellow-50",
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
      },
      {
        label: "Active Contracts",
        value: active.toLocaleString(),
        icon: CheckCircle,
        trend: "5%",
        up: true,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        label: "Suspended",
        value: suspended.toString(),
        icon: PauseCircle,
        trend: "2%",
        up: false,
        color: "text-amber-600",
        bg: "bg-orange-50",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
      },
      {
        label: "Expiring Soon",
        value: expiring.toString(),
        icon: CalendarX,
        trend: "8%",
        up: true,
        color: "text-rose-600",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
      },
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Client Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor high-profile security service contracts
            </p>
          </div>
          <button
            onClick={goToRegister}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <PlusCircle className="h-5 w-5" />
            Register New Client
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} p-6 rounded-xl border shadow-sm`}
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2.5 ${stat.iconBg} rounded-lg`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span
                  className={`text-sm font-bold flex items-center gap-0.5 ${
                    stat.up ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {stat.up ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  ~{stat.trend}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </p>
              <p className={`text-3xl font-black mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status:
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="EXPIRING">Expiring Soon</option>
                </select>
              </div>

              {/* Industry filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Industry:
                </span>
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 cursor-pointer"
                >
                  <option value="ALL">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex items-center bg-muted rounded-lg border px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-muted-foreground ml-2 outline-none"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border">
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={fetchClients}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Loading clients...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">
                {search || filterStatus !== "ALL" || filterIndustry !== "ALL"
                  ? "No clients match your filters."
                  : "No clients yet. Register your first client!"}
              </p>
              {!search && filterStatus === "ALL" && filterIndustry === "ALL" && (
                <button
                  onClick={goToRegister}
                  className="mt-4 text-primary font-bold hover:underline"
                >
                  + Register New Client
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Client Code
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Service End Date
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                        Balance
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginated.map((client) => {
                      const displayStatus = getDisplayStatus(client);
                      const isExpiring = displayStatus === "EXPIRING";
                      const endDateColor = isExpiring ? "text-red-600 font-bold" : "";
                      const balanceColor =
                        (client.totalOutstanding ?? 0) > 0 &&
                        client.status !== "ACTIVE"
                          ? "text-destructive"
                          : (client.totalOutstanding ?? 0) > 0
                          ? "text-amber-600"
                          : "";

                      return (
                        <tr
                          key={client.clientId}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                            #{client.clientCode || `AF-${client.clientId}`}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-md bg-primary/80 flex items-center justify-center font-bold text-xs text-primary-foreground shrink-0">
                                {getInitials(client.companyName)}
                              </div>
                              <span className="font-bold text-sm">
                                {client.companyName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold">
                              {client.contactPersonName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {client.contactPersonEmail}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${statusBadge(
                                displayStatus
                              )}`}
                            >
                              {displayStatus}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-medium ${endDateColor}`}
                          >
                            {formatDate(client.contractEndDate)}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-bold text-right ${balanceColor}`}
                          >
                            {formatCurrency(client.totalOutstanding)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  disabled={
                                    actionLoading === client.clientId
                                  }
                                >
                                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClient(client);
                                    setView("detail");
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {client.status === "ACTIVE" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAction(
                                          client.clientId,
                                          "suspend"
                                        )
                                      }
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Suspend Client
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() =>
                                        handleAction(
                                          client.clientId,
                                          "terminate"
                                        )
                                      }
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Terminate Client
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(client.status === "SUSPENDED" ||
                                  client.status === "TERMINATED") && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction(
                                        client.clientId,
                                        "reactivate"
                                      )
                                    }
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reactivate Client
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-muted/30 flex items-center justify-between border-t">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {(page - 1) * ROWS_PER_PAGE + 1} to{" "}
                    {Math.min(page * ROWS_PER_PAGE, filtered.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground">
                    {filtered.length.toLocaleString()}
                  </span>{" "}
                  clients
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-card transition-colors disabled:opacity-50 flex items-center gap-1"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-card transition-colors disabled:opacity-50 flex items-center gap-1"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                         REGISTRATION VIEW                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderRegistrationView = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client List
        </button>
        <h1 className="text-3xl font-black tracking-tight">
          Client Registration
        </h1>
        <p className="text-muted-foreground mt-1">
          Onboard a new corporate partner to the security management ecosystem.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              i === activeTab
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {formError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      {/* All sections */}
      <div className="space-y-8">
        {/* ── Company Info ── */}
        <section className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Global Tech Solutions"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Registration Number</label>
              <input
                name="companyRegistrationNo"
                value={form.companyRegistrationNo}
                onChange={handleChange}
                placeholder="CR-2024-XXXX"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>VAT Number</label>
              <input
                name="vatNumber"
                value={form.vatNumber}
                onChange={handleChange}
                placeholder="VAT-123456789"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Industry Type</label>
              <select
                name="industryType"
                value={form.industryType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select industry...</option>
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Registered Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter full legal address"
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Primary Contact Person
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                name="contactPersonName"
                value={form.contactPersonName}
                onChange={handleChange}
                placeholder="Enter contact name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input
                name="contactPersonDesignation"
                value={form.contactPersonDesignation}
                onChange={handleChange}
                placeholder="e.g. Facilities Manager"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email Address *</label>
              <input
                name="contactPersonEmail"
                type="email"
                value={form.contactPersonEmail}
                onChange={handleChange}
                placeholder="email@company.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                name="contactPersonPhone"
                value={form.contactPersonPhone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ── Deployment ── */}
        <section className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Service & Deployment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>
                Service Location (Deployment Address) *
              </label>
              <input
                name="serviceLocation"
                value={form.serviceLocation}
                onChange={handleChange}
                placeholder="Physical deployment address"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Service Start Date *</label>
              <input
                name="serviceStartDate"
                type="date"
                value={form.serviceStartDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contract Duration (Months)</label>
              <input
                name="contractDurationMonths"
                type="number"
                min="1"
                value={form.contractDurationMonths}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ── Staffing & Rates ── */}
        <section className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Staffing Requirements & Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>OIC Count</label>
              <input
                name="oicCount"
                type="number"
                min="0"
                value={form.oicCount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>OIC Rate (Per Shift)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  name="oicRatePerShift"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.oicRatePerShift}
                  onChange={handleChange}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>JSO Count</label>
              <input
                name="jsoCount"
                type="number"
                min="0"
                value={form.jsoCount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>JSO Rate (Per Shift)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  name="jsoRatePerShift"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.jsoRatePerShift}
                  onChange={handleChange}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>OT Rate (Per Hour)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  name="otRatePerHour"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.otRatePerHour}
                  onChange={handleChange}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Risk ── */}
        <section className="bg-primary/5 rounded-2xl border border-primary/20 shadow-sm p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5 text-primary" />
            AI Risk Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk gauge card */}
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Calculated Risk Level
                </p>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    riskScore < 40
                      ? "bg-emerald-100 text-emerald-700"
                      : riskScore < 70
                      ? "bg-amber-100 text-amber-700"
                      : riskScore < 90
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {riskLabel}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-primary">{riskScore}</span>
                <span className="text-muted-foreground mb-1">/ 100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    riskScore < 40
                      ? "bg-emerald-500"
                      : riskScore < 70
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground italic">
                *Based on industry type and location historical data.
              </p>
              <select
                name="riskLevel"
                value={form.riskLevel}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>
            </div>

            {/* Recommended officers */}
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Recommended Officers
              </p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">OICs (Level 3+)</span>
                  <span className="font-bold text-primary">
                    {String(Number(form.oicCount) || 0).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">JSOs (Standard)</span>
                  <span className="font-bold text-primary">
                    {String(Number(form.jsoCount) || 0).padStart(2, "0")}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-sm font-semibold">Total Staffing</span>
                  <span className="text-2xl font-black">
                    {String(
                      (Number(form.oicCount) || 0) +
                        (Number(form.jsoCount) || 0)
                    ).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  Override Recommended Officers
                </label>
                <input
                  name="recommendedOfficers"
                  type="number"
                  min="1"
                  value={form.recommendedOfficers}
                  onChange={handleChange}
                  placeholder="e.g. 8"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-4 pb-8">
        <button
          onClick={() => setView("list")}
          className="px-6 py-3 border rounded-xl font-semibold text-sm hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors text-sm disabled:opacity-60 shadow-lg flex items-center gap-2"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            "Register Client"
          )}
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                          SUCCESS VIEW                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderSuccessView = () => {
    if (!successData) return null;
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">

          {/* Hero success banner */}
          <div className="bg-gradient-to-br from-primary to-primary/80 px-8 py-8 text-primary-foreground text-center relative overflow-hidden">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 border-4 border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-9 w-9 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Client Registered!</h2>
              <p className="text-primary-foreground/80 text-sm mt-1">
                <strong>{successData.companyName}</strong> has been onboarded successfully
              </p>
            </div>
          </div>

          {/* Credentials section */}
          <div className="px-6 py-6 space-y-5">
            {/* Warning note */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                Save these credentials now — the temporary password will <strong>not</strong> be shown again.
              </p>
            </div>

            {/* Credentials cards */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 border rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Username</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-sm font-bold text-foreground">{successData.username}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(successData.username)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0"
                      title="Copy username"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Temp. Password</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-sm font-bold text-primary">{successData.temporaryPassword || "Via email"}</code>
                    {successData.temporaryPassword && (
                      <button
                        onClick={() => navigator.clipboard.writeText(successData.temporaryPassword!)}
                        className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                        title="Copy password"
                      >
                        <Copy className="h-3.5 w-3.5 text-primary" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Email Sent To</p>
                    <p className="text-sm font-semibold">{successData.contactPersonEmail}</p>
                  </div>
                  <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">What's Next</p>
              <ul className="space-y-1.5">
                {[
                  "Client receives email with login credentials",
                  "Client logs in and sets a new password",
                  "Assign officers and generate the first invoice",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-blue-800">
                    <span className="h-4 w-4 rounded-full bg-blue-200 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t bg-muted/20 flex gap-3">
            <button
              onClick={() => setView("list")}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Client List
            </button>
            <button
              onClick={goToRegister}
              className="border hover:bg-muted font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                          DETAIL VIEW                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderDetailView = () => {
    if (!selectedClient) return null;
    const c = selectedClient;
    const displayStatus = getDisplayStatus(c);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client List
        </button>

        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/80 flex items-center justify-center font-bold text-lg text-primary-foreground">
              {getInitials(c.companyName)}
            </div>
            <div>
              <h1 className="text-2xl font-black">{c.companyName}</h1>
              <p className="text-muted-foreground text-sm font-mono">
                #{c.clientCode || `AF-${c.clientId}`}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusBadge(
              displayStatus
            )}`}
          >
            {displayStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Company Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Registration No</p>
                <p className="font-semibold">
                  {c.companyRegistrationNo || "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">VAT Number</p>
                <p className="font-semibold">{c.vatNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Industry</p>
                <p className="font-semibold">{c.industryType || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">City</p>
                <p className="font-semibold">{c.city || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-semibold">{c.address || "—"}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Contact Person
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold">{c.contactPersonName}</p>
                  <p className="text-muted-foreground text-xs">
                    {c.contactPersonDesignation || "Primary Contact"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{c.contactPersonEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{c.contactPersonPhone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Username:</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                  {c.username}
                </code>
              </div>
            </div>
          </div>

          {/* Contract */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Contract Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-semibold">
                  {formatDate(c.serviceStartDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">End Date</p>
                <p className="font-semibold">
                  {formatDate(c.contractEndDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-semibold">
                  {c.contractDurationMonths} months
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Service Location</p>
                <p className="font-semibold">{c.serviceLocation || "—"}</p>
              </div>
            </div>
          </div>

          {/* Staffing & Rates */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Staffing & Rates
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">OIC Count</p>
                <p className="font-semibold">{c.oicCount ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">JSO Count</p>
                <p className="font-semibold">{c.jsoCount ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Officers</p>
                <p className="font-semibold text-primary">
                  {c.activeOfficersCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">OIC Rate/Shift</p>
                <p className="font-semibold">
                  {formatCurrency(c.oicRatePerShift)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">JSO Rate/Shift</p>
                <p className="font-semibold">
                  {formatCurrency(c.jsoRatePerShift)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">OT Rate/Hour</p>
                <p className="font-semibold">
                  {formatCurrency(c.otRatePerHour)}
                </p>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-card rounded-xl border p-6 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Financial & Risk Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Outstanding Balance
                </p>
                <p
                  className={`text-xl font-black ${
                    (c.totalOutstanding ?? 0) > 0
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(c.totalOutstanding)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Risk Level
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    c.riskLevel === "LOW"
                      ? "bg-emerald-100 text-emerald-700"
                      : c.riskLevel === "MEDIUM"
                      ? "bg-amber-100 text-amber-700"
                      : c.riskLevel === "HIGH"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {c.riskLevel}
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Recommended Officers
                </p>
                <p className="text-xl font-black">{c.recommendedOfficers ?? "—"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Registered
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(c.registeredAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {c.status === "ACTIVE" && (
            <>
              <button
                onClick={() => handleAction(c.clientId, "suspend")}
                className="px-4 py-2 rounded-lg border text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-2"
              >
                <Ban className="h-4 w-4" /> Suspend
              </button>
              <button
                onClick={() => handleAction(c.clientId, "terminate")}
                className="px-4 py-2 rounded-lg border text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" /> Terminate
              </button>
            </>
          )}
          {(c.status === "SUSPENDED" || c.status === "TERMINATED") && (
            <button
              onClick={() => handleAction(c.clientId, "reactivate")}
              className="px-4 py-2 rounded-lg border text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Reactivate
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                              RENDER                                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-0">
      {view === "list" && renderListView()}
      {view === "register" && renderRegistrationView()}
      {view === "success" && renderSuccessView()}
      {view === "detail" && renderDetailView()}
    </div>
  );
};

export default ClientManagement;
