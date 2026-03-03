import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "@/components/client/ChangePasswordModal";
import { clientApi } from "@/lib/api";
import type { ClientDashboardData } from "@/types/client";
import {
    Building2, MapPin, Calendar, Shield, Save,
    KeyRound, LogOut, Edit3, User, Phone, Mail, AlertCircle,
    CheckCircle2, Globe, FileText,
} from "lucide-react";

const ClientProfile = () => {
    const [data, setData]                             = useState<ClientDashboardData | null>(null);
    const [loading, setLoading]                       = useState(true);
    const [err, setErr]                               = useState("");
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [editMode, setEditMode]                     = useState(false);
    const [saved, setSaved]                           = useState(false);
    const navigate = useNavigate();

    // Editable fields state
    const [companyPhone, setCompanyPhone] = useState("011 484 8177");
    const [companyEmail, setCompanyEmail] = useState("contact@corporatehq.lk");
    const [companyAddress, setCompanyAddress] = useState("North Wing Plaza, Colombo 03");
    const [contactPerson, setContactPerson] = useState("James Perera");
    const [contactRole, setContactRole] = useState("Finance Manager");

    useEffect(() => {
        const clientIdRaw = localStorage.getItem("clientId");
        if (!clientIdRaw) {
            setData({
                clientId: 1, companyName: "Corporate HQ", status: "ACTIVE",
                activeOfficersCount: 2, totalOutstanding: 12450.00,
                overdueInvoicesCount: 1, pendingPaymentsCount: 1,
                monthlyBaseFee: 4150.00, riskLevel: "LOW",
                serviceLocation: "North Wing Plaza",
                contractStartDate: "Jan 2023", contractEndDate: "Dec 2023",
                oicCount: 1, jsoCount: 1,
            });
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await clientApi.getDashboard(Number(clientIdRaw));
                setData(res);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load profile");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleLogout = () => { localStorage.clear(); navigate("/client-login"); };

    const handleSave = () => {
        setEditMode(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading profile…</p>
            </div>
        </div>
    );

    if (err) return (
        <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" /> {err}
            </div>
        </div>
    );

    if (!data) return null;

    const statusBadge = (s: string) => {
        const map: Record<string, string> = {
            ACTIVE:     "bg-emerald-100 text-emerald-700",
            SUSPENDED:  "bg-red-100 text-red-700",
            EXPIRED:    "bg-amber-100 text-amber-700",
            TERMINATED: "bg-gray-100 text-gray-500",
        };
        return map[s] ?? "bg-gray-100 text-gray-500";
    };

    const inputCls = (active: boolean) =>
        `w-full text-sm font-medium rounded-lg px-3 py-2 border transition-all outline-none ${
            active
                ? "border-primary bg-white text-gray-900 focus:ring-2 focus:ring-primary/20"
                : "border-transparent bg-gray-50 text-gray-800 cursor-default select-none"
        }`;

    return (
        <div className="space-y-5 pb-10 max-w-3xl mx-auto">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Company Profile</h2>
                    <p className="text-sm text-gray-400 mt-0.5">View and manage your account details.</p>
                </div>
                {saved && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="h-4 w-4" /> Changes saved
                    </div>
                )}
            </div>

            {/* ── Identity Banner ── */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute -right-6 -bottom-6 h-36 w-36 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute right-24 -top-8 h-28 w-28 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                        <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Client Account</p>
                        <h3 className="text-2xl font-black text-white mt-0.5 truncate">{data.companyName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusBadge(data.status)}`}>
                                {data.status}
                            </span>
                            <span className="text-xs text-gray-500">ID: CHQ-2026-{data.clientId.toString().padStart(4, "0")}</span>
                            <span className="text-xs text-gray-500">·</span>
                            <span className="text-xs text-gray-500">Risk: <span className="text-gray-300 font-medium">{data.riskLevel ?? "LOW"}</span></span>
                        </div>
                    </div>
                </div>
                {/* Contract bar */}
                <div className="relative z-10 mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
                    {[
                        { label: "Contract Start", value: data.contractStartDate ?? "Jan 2023" },
                        { label: "Contract End",   value: data.contractEndDate   ?? "Dec 2023" },
                        { label: "Monthly Fee",    value: `LKR ${(data.monthlyBaseFee ?? 4150).toLocaleString("en-LK", { minimumFractionDigits: 2 })}` },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
                            <p className="text-sm font-bold text-white mt-0.5">{value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Company Information (Editable) ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Edit3 className="h-3.5 w-3.5 text-gray-600" />
                        </span>
                        Company Information
                    </h3>
                    {editMode ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditMode(false)}
                                className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all"
                            >
                                <Save className="h-3.5 w-3.5" /> Save Changes
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="text-xs font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-all"
                        >
                            Edit Info
                        </button>
                    )}
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {/* Company Name — read-only */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            Company Name
                        </label>
                        <div className="w-full text-sm font-medium rounded-lg px-3 py-2 bg-gray-50 border border-transparent text-gray-500 select-none">
                            {data.companyName}
                        </div>
                    </div>
                    {/* Client ID — read-only */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            Client ID
                        </label>
                        <div className="w-full text-sm font-medium rounded-lg px-3 py-2 bg-gray-50 border border-transparent text-gray-500 select-none">
                            CHQ-2026-{data.clientId.toString().padStart(4, "0")}
                        </div>
                    </div>
                    {/* Contact Person */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            <User className="h-3 w-3 inline mr-1" />Contact Person
                        </label>
                        <input
                            value={contactPerson}
                            onChange={e => setContactPerson(e.target.value)}
                            readOnly={!editMode}
                            className={inputCls(editMode)}
                        />
                    </div>
                    {/* Contact Role */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            <FileText className="h-3 w-3 inline mr-1" />Contact Role
                        </label>
                        <input
                            value={contactRole}
                            onChange={e => setContactRole(e.target.value)}
                            readOnly={!editMode}
                            className={inputCls(editMode)}
                        />
                    </div>
                    {/* Phone */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            <Phone className="h-3 w-3 inline mr-1" />Phone Number
                        </label>
                        <input
                            value={companyPhone}
                            onChange={e => setCompanyPhone(e.target.value)}
                            readOnly={!editMode}
                            className={inputCls(editMode)}
                        />
                    </div>
                    {/* Email */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            <Mail className="h-3 w-3 inline mr-1" />Email Address
                        </label>
                        <input
                            value={companyEmail}
                            onChange={e => setCompanyEmail(e.target.value)}
                            readOnly={!editMode}
                            className={inputCls(editMode)}
                        />
                    </div>
                    {/* Address — full width */}
                    <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            <MapPin className="h-3 w-3 inline mr-1" />Company Address
                        </label>
                        <input
                            value={companyAddress}
                            onChange={e => setCompanyAddress(e.target.value)}
                            readOnly={!editMode}
                            className={inputCls(editMode)}
                        />
                    </div>
                    {/* Service Location — read-only */}
                    <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                            <Globe className="h-3 w-3 inline mr-1" />Service Location
                        </label>
                        <div className="flex items-center justify-between w-full text-sm font-medium rounded-lg px-3 py-2 bg-gray-50 border border-transparent">
                            <span className="text-gray-800">{data.serviceLocation ?? "North Wing Plaza"}</span>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Managed by Ace</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Service Summary ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-gray-600" />
                    </span>
                    Service Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Officers on Site",  value: `${data.activeOfficersCount ?? 2}`,                    sub: `${data.oicCount ?? 0} OIC · ${data.jsoCount ?? 0} JSO` },
                        { label: "Contract Status",   value: data.status,                                            sub: "Current period" },
                        { label: "Risk Level",        value: data.riskLevel ?? "LOW",                               sub: "Assessed by ops" },
                        { label: "Contract Period",   value: data.contractStartDate ?? "Jan 2023",                  sub: `Ends ${data.contractEndDate ?? "Dec 2023"}` },
                    ].map(({ label, value, sub }) => (
                        <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                            <p className="text-base font-black text-gray-900 mt-1 truncate">{value}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
                        </div>
                    ))}
                </div>
                {/* Contract progress */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                        <span>Contract Progress</span>
                        <span className="font-semibold">75% completed</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" style={{ width: "75%" }} />
                    </div>
                </div>
            </section>

            {/* ── Account Security ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                            <KeyRound className="h-3.5 w-3.5 text-gray-600" />
                        </span>
                        Account Security
                    </h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {/* Password row */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                <KeyRound className="h-4.5 w-4.5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Password</p>
                                <p className="text-xs text-gray-400 mt-0.5">Last changed: Unknown · Keep your account secure</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="text-xs font-bold text-primary border border-primary/20 hover:bg-primary/5 px-4 py-1.5 rounded-lg transition-all shrink-0"
                        >
                            Change Password
                        </button>
                    </div>
                    {/* Session row */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <LogOut className="h-4.5 w-4.5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Sign Out</p>
                                <p className="text-xs text-gray-400 mt-0.5">End your current session and return to login</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-all shrink-0"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </section>

            {showChangePassword && (
                <ChangePasswordModal
                    clientId={data.clientId}
                    onClose={() => setShowChangePassword(false)}
                />
            )}
        </div>
    );
};

export default ClientProfile;

