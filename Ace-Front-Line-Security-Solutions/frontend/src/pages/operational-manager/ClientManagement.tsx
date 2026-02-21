import { useEffect, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type Client = {
    clientId: number;
    companyName: string;
    companyRegistrationNo: string;
    industryType: string;
    address: string;
    city: string;
    contactPersonName: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    username: string;
    status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    monthlyBaseFee: number;
    otRatePerHour: number;
    recommendedOfficers: number;
    activeOfficersCount: number;
    totalOutstanding: number;
    contractDurationMonths: number;
    serviceStartDate: string;
    registeredAt: string;
};

type RegisterForm = {
    companyName: string;
    companyRegistrationNo: string;
    industryType: string;
    address: string;
    city: string;
    contactPersonName: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    serviceStartDate: string;
    contractDurationMonths: string;
    monthlyBaseFee: string;
    otRatePerHour: string;
    riskLevel: string;
    recommendedOfficers: string;
};

type SuccessData = {
    companyName: string;
    username: string;
    temporaryPassword: string;
    contactPersonEmail: string;
};

type View = "list" | "register" | "success";

const emptyForm: RegisterForm = {
    companyName: "",
    companyRegistrationNo: "",
    industryType: "",
    address: "",
    city: "",
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    serviceStartDate: "",
    contractDurationMonths: "",
    monthlyBaseFee: "",
    otRatePerHour: "",
    riskLevel: "LOW",
    recommendedOfficers: "",
};

const STEPS = [
    "Company Info",
    "Contact Details",
    "Contract & Service",
    "Risk & Security",
    "Review & Submit",
];

const API = "http://localhost:8080/api";

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusColor = (s: string) => {
    if (s === "ACTIVE") return "bg-green-100 text-green-700 border border-green-200";
    if (s === "SUSPENDED") return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    if (s === "TERMINATED") return "bg-red-100 text-red-700 border border-red-200";
    return "bg-gray-100 text-gray-600";
};

const riskColor = (r: string) => {
    if (r === "LOW") return "bg-green-100 text-green-700";
    if (r === "MEDIUM") return "bg-yellow-100 text-yellow-700";
    if (r === "HIGH") return "bg-orange-100 text-orange-700";
    if (r === "CRITICAL") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
};

const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

// ── Main Component ────────────────────────────────────────────────────────────

const ClientManagement = () => {
    const [view, setView] = useState<View>("list");
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterRisk, setFilterRisk] = useState("ALL");
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<RegisterForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [successData, setSuccessData] = useState<SuccessData | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // ── Fetch clients ───────────────────────────────────────────────────────────
    const fetchClients = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API}/clients`);
            const json = await res.json();
            setClients(json.data || []);
        } catch {
            setError("Failed to load clients. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, []);

    // ── Summary stats ───────────────────────────────────────────────────────────
    const total = clients.length;
    const active = clients.filter((c) => c.status === "ACTIVE").length;
    const suspended = clients.filter((c) => c.status === "SUSPENDED").length;
    const terminated = clients.filter((c) => c.status === "TERMINATED").length;
    const monthlyRevenue = clients
        .filter((c) => c.status === "ACTIVE")
        .reduce((sum, c) => sum + (c.monthlyBaseFee || 0), 0);

    // ── Filtered clients ────────────────────────────────────────────────────────
    const filtered = clients.filter((c) => {
        const matchSearch =
            c.companyName.toLowerCase().includes(search.toLowerCase()) ||
            c.contactPersonEmail.toLowerCase().includes(search.toLowerCase()) ||
            c.username.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
        const matchRisk = filterRisk === "ALL" || c.riskLevel === filterRisk;
        return matchSearch && matchStatus && matchRisk;
    });

    // ── Form field change ───────────────────────────────────────────────────────
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setFormError("");
    };

    // ── Step validation ─────────────────────────────────────────────────────────
    const validateStep = () => {
        if (step === 0) {
            if (!form.companyName.trim()) return "Company name is required";
            if (!form.companyRegistrationNo.trim()) return "Registration number is required";
            if (!form.industryType.trim()) return "Industry type is required";
            if (!form.address.trim()) return "Address is required";
            if (!form.city.trim()) return "City is required";
        }
        if (step === 1) {
            if (!form.contactPersonName.trim()) return "Contact name is required";
            if (!form.contactPersonEmail.trim()) return "Email is required";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactPersonEmail))
                return "Invalid email format";
            if (!form.contactPersonPhone.trim()) return "Phone is required";
        }
        if (step === 2) {
            if (!form.serviceStartDate) return "Service start date is required";
            if (!form.contractDurationMonths) return "Contract duration is required";
            if (!form.monthlyBaseFee) return "Monthly base fee is required";
            if (!form.otRatePerHour) return "OT rate is required";
        }
        if (step === 3) {
            if (!form.recommendedOfficers) return "Recommended officers count is required";
        }
        return null;
    };

    const handleNext = () => {
        const err = validateStep();
        if (err) { setFormError(err); return; }
        setFormError("");
        setStep((s) => s + 1);
    };

    const handleBack = () => {
        setFormError("");
        if (step === 0) { setView("list"); setForm(emptyForm); setStep(0); }
        else setStep((s) => s - 1);
    };

    // ── Submit registration ───────���─────────────────────────────────────────────
    const handleSubmit = async () => {
        setSubmitting(true);
        setFormError("");
        try {
            const res = await fetch(`${API}/clients/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    contractDurationMonths: Number(form.contractDurationMonths),
                    monthlyBaseFee: Number(form.monthlyBaseFee),
                    otRatePerHour: Number(form.otRatePerHour),
                    recommendedOfficers: Number(form.recommendedOfficers),
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setFormError(json.message || "Registration failed. Please try again.");
                return;
            }
            setSuccessData({
                companyName: json.data.companyName,
                username: json.data.username,
                temporaryPassword: json.data.temporaryPassword,
                contactPersonEmail: json.data.contactPersonEmail,
            });
            setView("success");
            fetchClients();
        } catch {
            setFormError("Network error. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Status actions ──────────────────────────────────────────────────────────
    const handleAction = async (
        clientId: number,
        action: "suspend" | "terminate" | "reactivate"
    ) => {
        const labels = {
            suspend: "suspend",
            terminate: "terminate",
            reactivate: "reactivate",
        };
        if (!confirm(`Are you sure you want to ${labels[action]} this client?`)) return;
        setActionLoading(clientId);
        try {
            await fetch(`${API}/clients/${clientId}/${action}`, { method: "PUT" });
            fetchClients();
        } catch {
            alert("Action failed. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    // ── Contract end date ───────────────────────────────────────────────────────
    const getContractEnd = (start: string, months: number) => {
        if (!start || !months) return "—";
        const d = new Date(start);
        d.setMonth(d.getMonth() + months);
        return formatDate(d.toISOString());
    };

    // ────────────────────────────────────────────────────────────────────────────
    // SUCCESS VIEW
    // ────────────────────────────────────────────────────────────────────────────
    if (view === "success" && successData) {
        return (
            <div className="max-w-2xl mx-auto py-12 space-y-6">
                {/* Success card */}
                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                    {/* Green header */}
                    <div className="bg-green-500 px-8 py-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                                ✓
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Client Registered Successfully</h2>
                                <p className="text-green-100 text-sm mt-1">
                                    Login credentials have been sent to the client's email
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Credentials */}
                    <div className="px-8 py-6 space-y-4">
                        <p className="text-muted-foreground text-sm">
                            Please save these credentials. The password will not be shown again.
                        </p>

                        <div className="rounded-xl bg-muted/40 border p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Company</span>
                                <span className="font-semibold">{successData.companyName}</span>
                            </div>
                            <div className="border-t" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Username</span>
                                <code className="bg-black text-yellow-400 px-3 py-1 rounded font-mono text-sm">
                                    {successData.username}
                                </code>
                            </div>
                            <div className="border-t" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Temporary Password</span>
                                <code className="bg-black text-yellow-400 px-3 py-1 rounded font-mono text-sm">
                                    {successData.temporaryPassword || "Sent via email"}
                                </code>
                            </div>
                            <div className="border-t" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Email Sent To</span>
                                <span className="font-medium">{successData.contactPersonEmail}</span>
                            </div>
                        </div>

                        {/* Info box */}
                        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                            <strong>What happens next:</strong>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                <li>Client receives email with login credentials</li>
                                <li>Client logs in and is prompted to change their password</li>
                                <li>You can now assign officers to this client</li>
                                <li>Generate their first invoice from the Invoices section</li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t bg-muted/20 flex gap-3">
                        <button
                            onClick={() => { setView("list"); setForm(emptyForm); setStep(0); }}
                            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            ← Back to Client List
                        </button>
                        <button
                            onClick={() => { setForm(emptyForm); setStep(0); setView("register"); }}
                            className="border border-gray-300 hover:bg-gray-50 font-semibold py-2.5 px-6 rounded-lg transition-colors"
                        >
                            Register Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // REGISTER VIEW (multi-step)
    // ────────────────────────────────────────────────────────────────────────────
    if (view === "register") {
        const progress = Math.round(((step + 1) / STEPS.length) * 100);

        return (
            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button
                        onClick={() => { setView("list"); setForm(emptyForm); setStep(0); }}
                        className="hover:text-foreground transition-colors"
                    >
                        Client Management
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium">Register New Client</span>
                </div>

                {/* Page heading */}
                <div>
                    <h2 className="text-2xl font-bold">Register New Client</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Complete all steps to onboard a new security service client
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-0">
                    {STEPS.map((label, i) => (
                        <div key={i} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                    ${i < step
                                        ? "bg-yellow-400 border-yellow-400 text-black"
                                        : i === step
                                            ? "bg-yellow-400 border-yellow-400 text-black"
                                            : "bg-white border-gray-300 text-gray-400"
                                    }`}
                                >
                                    {i < step ? "✓" : i + 1}
                                </div>
                                <span
                                    className={`text-xs hidden md:block whitespace-nowrap
                    ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}
                                >
                  {label}
                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`flex-1 h-0.5 mb-4 mx-1 transition-all
                    ${i < step ? "bg-yellow-400" : "bg-gray-200"}`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Main content + sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Form card */}
                    <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm p-6 space-y-5">

                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                                ⚠ {formError}
                            </div>
                        )}

                        {/* ── STEP 0: Company Info ── */}
                        {step === 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    🏢 Company Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Legal Company Name *
                                        </label>
                                        <input
                                            name="companyName"
                                            value={form.companyName}
                                            onChange={handleChange}
                                            placeholder="e.g. ABC Corporation (Pvt) Ltd"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Company Registration No *
                                        </label>
                                        <input
                                            name="companyRegistrationNo"
                                            value={form.companyRegistrationNo}
                                            onChange={handleChange}
                                            placeholder="e.g. PV-2024-12345"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Industry Type *
                                        </label>
                                        <select
                                            name="industryType"
                                            value={form.industryType}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        >
                                            <option value="">Select industry...</option>
                                            <option>Banking & Finance</option>
                                            <option>Retail & Supermarkets</option>
                                            <option>Manufacturing</option>
                                            <option>Healthcare</option>
                                            <option>Hospitality & Hotels</option>
                                            <option>Education</option>
                                            <option>Construction</option>
                                            <option>Logistics & Warehousing</option>
                                            <option>Government</option>
                                            <option>Technology</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Company Address *
                                        </label>
                                        <input
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="Street, Building, Area"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            City *
                                        </label>
                                        <input
                                            name="city"
                                            value={form.city}
                                            onChange={handleChange}
                                            placeholder="e.g. Colombo"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 1: Contact Details ── */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    👤 Contact Person Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Full Name *
                                        </label>
                                        <input
                                            name="contactPersonName"
                                            value={form.contactPersonName}
                                            onChange={handleChange}
                                            placeholder="e.g. John Perera"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Email Address *
                                        </label>
                                        <input
                                            name="contactPersonEmail"
                                            type="email"
                                            value={form.contactPersonEmail}
                                            onChange={handleChange}
                                            placeholder="john@company.com"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Phone Number *
                                        </label>
                                        <input
                                            name="contactPersonPhone"
                                            value={form.contactPersonPhone}
                                            onChange={handleChange}
                                            placeholder="e.g. 0771234567"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                </div>
                                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                                    💡 Login credentials will be sent to the email address provided above.
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: Contract & Service ── */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    📋 Contract & Service Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Service Start Date *
                                        </label>
                                        <input
                                            name="serviceStartDate"
                                            type="date"
                                            value={form.serviceStartDate}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Contract Duration (months) *
                                        </label>
                                        <select
                                            name="contractDurationMonths"
                                            value={form.contractDurationMonths}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        >
                                            <option value="">Select duration...</option>
                                            <option value="3">3 Months</option>
                                            <option value="6">6 Months</option>
                                            <option value="12">12 Months (1 Year)</option>
                                            <option value="24">24 Months (2 Years)</option>
                                            <option value="36">36 Months (3 Years)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Monthly Base Fee (LKR) *
                                        </label>
                                        <input
                                            name="monthlyBaseFee"
                                            type="number"
                                            min="0"
                                            value={form.monthlyBaseFee}
                                            onChange={handleChange}
                                            placeholder="e.g. 50000"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Overtime Rate Per Hour (LKR) *
                                        </label>
                                        <input
                                            name="otRatePerHour"
                                            type="number"
                                            min="0"
                                            value={form.otRatePerHour}
                                            onChange={handleChange}
                                            placeholder="e.g. 500"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                </div>
                                {/* Contract end date preview */}
                                {form.serviceStartDate && form.contractDurationMonths && (
                                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
                                        <span className="text-muted-foreground">Contract end date: </span>
                                        <span className="font-semibold text-yellow-800">
                      {getContractEnd(form.serviceStartDate, Number(form.contractDurationMonths))}
                    </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── STEP 3: Risk & Security ── */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    🛡️ Risk & Security Assessment
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Risk Level *
                                        </label>
                                        <select
                                            name="riskLevel"
                                            value={form.riskLevel}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        >
                                            <option value="LOW">Low Risk</option>
                                            <option value="MEDIUM">Medium Risk</option>
                                            <option value="HIGH">High Risk</option>
                                            <option value="CRITICAL">Critical Risk</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                            Recommended Officers *
                                        </label>
                                        <input
                                            name="recommendedOfficers"
                                            type="number"
                                            min="1"
                                            value={form.recommendedOfficers}
                                            onChange={handleChange}
                                            placeholder="e.g. 3"
                                            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                </div>
                                {/* Risk level guide */}
                                <div className="rounded-xl border overflow-hidden">
                                    <div className="bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Risk Level Guide
                                    </div>
                                    <div className="divide-y text-sm">
                                        {[
                                            { level: "LOW", desc: "Standard retail, small offices — 1-2 officers", color: "text-green-600" },
                                            { level: "MEDIUM", desc: "Banks, malls, warehouses — 2-4 officers", color: "text-yellow-600" },
                                            { level: "HIGH", desc: "Hospitals, large factories — 4-8 officers", color: "text-orange-600" },
                                            { level: "CRITICAL", desc: "Government, embassies, high-value assets — 8+ officers", color: "text-red-600" },
                                        ].map((r) => (
                                            <div key={r.level} className="flex items-center gap-3 px-4 py-2.5">
                                                <span className={`font-bold w-20 ${r.color}`}>{r.level}</span>
                                                <span className="text-muted-foreground">{r.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 4: Review & Submit ── */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">📝 Review & Confirm</h3>
                                <p className="text-sm text-muted-foreground">
                                    Please review all details before registering the client.
                                </p>

                                {[
                                    {
                                        title: "🏢 Company",
                                        rows: [
                                            ["Company Name", form.companyName],
                                            ["Registration No", form.companyRegistrationNo],
                                            ["Industry", form.industryType],
                                            ["Address", form.address],
                                            ["City", form.city],
                                        ],
                                    },
                                    {
                                        title: "👤 Contact",
                                        rows: [
                                            ["Contact Person", form.contactPersonName],
                                            ["Email", form.contactPersonEmail],
                                            ["Phone", form.contactPersonPhone],
                                        ],
                                    },
                                    {
                                        title: "📋 Contract",
                                        rows: [
                                            ["Start Date", formatDate(form.serviceStartDate)],
                                            ["Duration", `${form.contractDurationMonths} months`],
                                            ["End Date", getContractEnd(form.serviceStartDate, Number(form.contractDurationMonths))],
                                            ["Monthly Fee", `LKR ${Number(form.monthlyBaseFee).toLocaleString()}`],
                                            ["OT Rate/Hour", `LKR ${Number(form.otRatePerHour).toLocaleString()}`],
                                        ],
                                    },
                                    {
                                        title: "🛡️ Risk",
                                        rows: [
                                            ["Risk Level", form.riskLevel],
                                            ["Recommended Officers", form.recommendedOfficers],
                                        ],
                                    },
                                ].map((section) => (
                                    <div key={section.title} className="rounded-xl border overflow-hidden">
                                        <div className="bg-muted/40 px-4 py-2 text-sm font-semibold">
                                            {section.title}
                                        </div>
                                        <div className="divide-y">
                                            {section.rows.map(([label, value]) => (
                                                <div key={label} className="flex justify-between px-4 py-2 text-sm">
                                                    <span className="text-muted-foreground">{label}</span>
                                                    <span className="font-medium">{value || "—"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Right Sidebar ── */}
                    <div className="space-y-4">
                        {/* Progress card */}
                        <div className="rounded-xl border bg-card shadow-sm p-5 space-y-3">
                            <div className="text-xs font-bold uppercase tracking-widest text-yellow-600">
                                Registration Progress
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Completion</span>
                                <span className="font-bold text-lg">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Step {step + 1} of {STEPS.length}: {STEPS[step]}
                            </div>
                        </div>

                        {/* What happens next */}
                        <div className="rounded-xl border bg-card shadow-sm p-5 space-y-3">
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                After Registration
                            </div>
                            <ul className="space-y-2 text-sm">
                                {[
                                    { icon: "🔑", text: "Username & password auto-generated" },
                                    { icon: "📧", text: "Credentials emailed to client" },
                                    { icon: "🔒", text: "Client prompted to change password" },
                                    { icon: "👮", text: "Assign officers to client site" },
                                    { icon: "🧾", text: "Generate first monthly invoice" },
                                ].map((item) => (
                                    <li key={item.text} className="flex items-start gap-2">
                                        <span>{item.icon}</span>
                                        <span className="text-muted-foreground">{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Current step hint */}
                        <div className="rounded-xl border bg-yellow-50 border-yellow-200 p-4 text-sm text-yellow-800 space-y-1">
                            <div className="font-semibold">Step {step + 1} — {STEPS[step]}</div>
                            <div className="text-yellow-700 text-xs">
                                {step === 0 && "Enter the client's official company details as per registration documents."}
                                {step === 1 && "Provide the primary contact person who will manage the portal account."}
                                {step === 2 && "Define the service agreement terms and billing details."}
                                {step === 3 && "Assess the security risk level to determine officer deployment."}
                                {step === 4 && "Review all information carefully before submitting."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom action bar */}
                <div className="flex items-center justify-between border-t pt-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                    >
                        ← {step === 0 ? "Cancel" : "Back"}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setView("list"); setForm(emptyForm); setStep(0); }}
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                            Discard Changes
                        </button>

                        {step < STEPS.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2"
                            >
                                Next: {STEPS[step + 1]} →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60 flex items-center gap-2"
                            >
                                {submitting ? "Registering..." : "✓ Register Client"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // LIST VIEW
    // ────────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Client Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage all security service clients and contracts
                    </p>
                </div>
                <button
                    onClick={() => { setView("register"); setStep(0); setForm(emptyForm); setFormError(""); }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                    + Register New Client
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Total Clients", value: total, color: "text-foreground", bg: "" },
                    { label: "Active", value: active, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Suspended", value: suspended, color: "text-yellow-600", bg: "bg-yellow-50" },
                    { label: "Terminated", value: terminated, color: "text-red-600", bg: "bg-red-50" },
                    {
                        label: "Monthly Revenue",
                        value: `LKR ${monthlyRevenue.toLocaleString()}`,
                        color: "text-foreground",
                        bg: "bg-muted/40",
                    },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl border p-4 ${stat.bg}`}>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {stat.label}
                        </div>
                        <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by company, email or username..."
                    className="flex-1 min-w-64 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="TERMINATED">Terminated</option>
                </select>
                <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                    <option value="ALL">All Risk Levels</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading clients...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    {search || filterStatus !== "ALL" || filterRisk !== "ALL"
                        ? "No clients match your filters."
                        : "No clients yet. Register your first client!"}
                </div>
            ) : (
                <div className="rounded-xl border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Company</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Contact</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Username</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Contract</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Monthly Fee</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Officers</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Risk</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((client) => (
                                <tr
                                    key={client.clientId}
                                    className="border-b hover:bg-muted/20 transition-colors"
                                >
                                    {/* Company */}
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{client.companyName}</div>
                                        <div className="text-xs text-muted-foreground">{client.city} · {client.industryType}</div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-4 py-3">
                                        <div>{client.contactPersonName}</div>
                                        <div className="text-xs text-muted-foreground">{client.contactPersonEmail}</div>
                                        <div className="text-xs text-muted-foreground">{client.contactPersonPhone}</div>
                                    </td>

                                    {/* Username */}
                                    <td className="px-4 py-3">
                                        <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                                            {client.username}
                                        </code>
                                    </td>

                                    {/* Contract */}
                                    <td className="px-4 py-3">
                                        <div className="text-xs">Start: {formatDate(client.serviceStartDate)}</div>
                                        <div className="text-xs">End: {getContractEnd(client.serviceStartDate, client.contractDurationMonths)}</div>
                                        <div className="text-xs text-muted-foreground">{client.contractDurationMonths} months</div>
                                    </td>

                                    {/* Fee */}
                                    <td className="px-4 py-3 font-semibold">
                                        LKR {client.monthlyBaseFee?.toLocaleString()}
                                    </td>

                                    {/* Officers */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="font-bold">{client.activeOfficersCount}</div>
                                        <div className="text-xs text-muted-foreground">
                                            / {client.recommendedOfficers} rec.
                                        </div>
                                    </td>

                                    {/* Risk */}
                                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${riskColor(client.riskLevel)}`}>
                        {client.riskLevel}
                      </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(client.status)}`}>
                        {client.status}
                      </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5">
                                            {client.status === "ACTIVE" && (
                                                <>
                                                    <button
                                                        disabled={actionLoading === client.clientId}
                                                        onClick={() => handleAction(client.clientId, "suspend")}
                                                        className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        Suspend
                                                    </button>
                                                    <button
                                                        disabled={actionLoading === client.clientId}
                                                        onClick={() => handleAction(client.clientId, "terminate")}
                                                        className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        Terminate
                                                    </button>
                                                </>
                                            )}
                                            {(client.status === "SUSPENDED" || client.status === "TERMINATED") && (
                                                <button
                                                    disabled={actionLoading === client.clientId}
                                                    onClick={() => handleAction(client.clientId, "reactivate")}
                                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                                >
                                                    Reactivate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table footer */}
                    <div className="px-4 py-3 bg-muted/20 border-t text-xs text-muted-foreground">
                        Showing {filtered.length} of {total} clients
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagement;