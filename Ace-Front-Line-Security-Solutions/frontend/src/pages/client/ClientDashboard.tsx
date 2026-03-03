import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ChangePasswordModal from "@/components/client/ChangePasswordModal";
import { clientApi } from "@/lib/api";
import type { ClientDashboardData } from "@/types/client";
import {
    Download, CloudUpload, ChevronRight,
    Bell, Star, Shield, AlertTriangle, Info, CreditCard, Phone,
    Building2, User, Calendar, MapPin, Users,
    CheckCircle2, Activity, TrendingUp,
} from "lucide-react";

const ClientDashboard = () => {
    const [data, setData]                             = useState<ClientDashboardData | null>(null);
    const [loading, setLoading]                       = useState(true);
    const [err, setErr]                               = useState("");
    const [showChangePassword, setShowChangePassword] = useState(false);
    const navigate = useNavigate();

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
                if (localStorage.getItem("isFirstLogin") === "true") setShowChangePassword(true);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleLogout = () => { localStorage.clear(); navigate("/client-login"); };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading dashboard…</p>
            </div>
        </div>
    );
    if (err) return (
        <div className="flex items-center justify-center py-20">
            <p className="text-red-600 text-sm">{err}</p>
        </div>
    );
    if (!data) return null;

    const isFirstLogin = localStorage.getItem("isFirstLogin") === "true";

    const statusBadge = (s: string) => {
        const map: Record<string, string> = {
            ACTIVE:     "bg-emerald-100 text-emerald-700",
            SUSPENDED:  "bg-red-100 text-red-700",
            EXPIRED:    "bg-amber-100 text-amber-700",
            TERMINATED: "bg-gray-100 text-gray-500",
        };
        return map[s] ?? "bg-gray-100 text-gray-500";
    };

    const mockInvoices = [
        { id: "INV-2023-009", period: "Sept 01 – Sept 30, 2023", amount: 4150.00, status: "ISSUED" },
        { id: "INV-2023-008", period: "Aug 01 – Aug 31, 2023",   amount: 4150.00, status: "PAID"   },
        { id: "INV-2023-007", period: "July 01 – July 31, 2023", amount: 4150.00, status: "PAID"   },
    ];

    const statusInvBadge = (s: string) => {
        const map: Record<string, string> = {
            ISSUED:  "bg-amber-100 text-amber-700",
            PAID:    "bg-emerald-100 text-emerald-700",
            OVERDUE: "bg-red-100 text-red-700",
            PENDING: "bg-sky-100 text-sky-700",
        };
        return map[s] ?? "bg-gray-100 text-gray-500";
    };

    const notifications = [
        { Icon: AlertTriangle, iconColor: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200",  bar: "bg-amber-400",  title: "Payment Overdue", text: "Invoice INV-2023-009 is past its due date.",     time: "2d ago" },
        { Icon: Info,          iconColor: "text-sky-500",    bg: "bg-sky-50",    border: "border-sky-200",    bar: "bg-sky-400",    title: "Invoice Issued",  text: "Sept billing cycle invoice is now available.",  time: "3d ago" },
        { Icon: CheckCircle2,  iconColor: "text-emerald-500",bg: "bg-emerald-50",border: "border-emerald-200",bar: "bg-emerald-400",title: "Service Active",  text: "All security personnel are on duty today.",     time: "Today"  },
    ];

    const quickStats = [
        { label: "Monthly Fee",      value: `LKR ${(data.monthlyBaseFee ?? 4150).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`, Icon: CreditCard,    color: "text-indigo-600",   bg: "bg-indigo-50",   trend: "Due 10th of month"   },
        { label: "Active Officers",  value: `${data.activeOfficersCount ?? 2}`,                                                           Icon: Users,         color: "text-emerald-600",  bg: "bg-emerald-50",  trend: "On duty now"         },
        { label: "Overdue Invoices", value: `${data.overdueInvoicesCount ?? 1}`,                                                          Icon: AlertTriangle, color: "text-red-500",      bg: "bg-red-50",      trend: "Action needed"       },
        { label: "Risk Level",       value: data.riskLevel ?? "LOW",                                                                      Icon: Shield,        color: "text-teal-600",     bg: "bg-teal-50",     trend: "Within normal range" },
    ];

    return (
        <div className="space-y-5 pb-10">

            {/* ── Hero Banner ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5">
                    {/* Left content */}
                    <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col justify-center gap-5">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-[1.1]">
                                {isFirstLogin ? "Welcome," : "Welcome back,"}<br />
                                <span className="text-primary">{data.companyName}</span>
                            </h1>
                            <p className="text-sm text-gray-500 mt-3 max-w-sm leading-relaxed">
                                Manage your security services and financial status efficiently from your central command center.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/client/payments"
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-primary/20"
                            >
                                <CloudUpload className="h-4 w-4" /> Upload Payment Proof
                            </Link>
                            <Link
                                to="/client/invoices"
                                className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            >
                                <Download className="h-4 w-4" /> View Invoices
                            </Link>
                        </div>
                    </div>

                    {/* Right: building image area */}
                    <div className="hidden lg:flex lg:col-span-2 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative overflow-hidden items-center justify-center min-h-[240px]">
                        {/* Decorative rings */}
                        <div className="absolute w-64 h-64 rounded-full border border-white/5" />
                        <div className="absolute w-48 h-48 rounded-full border border-white/8" />
                        <div className="absolute w-32 h-32 rounded-full border border-white/10" />
                        {/* Glow */}
                        <div className="absolute top-4 right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                        <div className="absolute bottom-6 left-6 w-16 h-16 bg-indigo-400/20 rounded-full blur-xl" />
                        {/* Icon */}
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <Building2 className="h-20 w-20 text-white/30" strokeWidth={1.2} />
                            <div className="text-center">
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Security Services</p>
                                <p className="text-white/40 text-[10px] mt-0.5">Active Protection</p>
                            </div>
                        </div>
                        {/* Bottom fade */}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    </div>
                </div>
            </section>

            {/* ── Quick Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map(({ label, value, Icon, color, bg, trend }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                            <Icon className={`h-4.5 w-4.5 ${color}`} />
                        </div>
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                        <p className="text-lg font-black text-gray-900 mt-0.5 truncate">{value}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{trend}</p>
                    </div>
                ))}
            </div>

            {/* ── Service Overview + Assigned Officers ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Service Overview */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <span className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Shield className="h-3.5 w-3.5 text-indigo-600" />
                            </span>
                            Service Overview
                        </h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusBadge(data.status)}`}>
                            {data.status}
                        </span>
                    </div>
                    <div>
                        {[
                            { label: "Contract Period", value: `${data.contractStartDate ?? "Jan 2023"} – ${data.contractEndDate ?? "Dec 2023"}`, Icon: Calendar  },
                            { label: "Location",        value: data.serviceLocation ?? "North Wing Plaza",                                          Icon: MapPin    },
                            { label: "Officers",        value: `${data.oicCount ?? 0} OIC / ${data.jsoCount ?? 0} JSO`,                             Icon: Users     },
                            { label: "Status",          value: "Fully Operational",                                                                  Icon: Activity, green: true },
                        ].map(({ label, value, Icon, green }) => (
                            <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                    <Icon className={`h-3.5 w-3.5 ${green ? "text-emerald-500" : "text-gray-400"}`} />
                                    {label}
                                </span>
                                <span className={`text-sm font-semibold ${green ? "text-emerald-600" : "text-gray-800"}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-50">
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                            <span>Contract Progress</span>
                            <span className="font-semibold">75%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: "75%" }} />
                        </div>
                    </div>
                </div>

                {/* Assigned Officers */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <span className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-indigo-600" />
                            </span>
                            Assigned Officers
                        </h3>
                        <Link to="/client/shift-schedule" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
                            View Schedule <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {[
                            { name: "John Doe",  rank: "Officer-in-Charge (OIC)",      initials: "JD", color: "bg-indigo-100 text-indigo-700",  shift: "08:00 – 20:00", days: "Mon – Fri" },
                            { name: "Sarah Lee", rank: "Junior Security Officer (JSO)", initials: "SL", color: "bg-violet-100 text-violet-700", shift: "08:00 – 20:00", days: "Mon – Sat" },
                        ].map((o) => (
                            <div key={o.name} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5">
                                <div className={`h-10 w-10 rounded-full ${o.color} flex items-center justify-center font-bold text-sm shrink-0`}>
                                    {o.initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900">{o.name}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{o.rank}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-gray-700">{o.shift}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{o.days}</p>
                                </div>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold shrink-0">ON DUTY</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-[11px] text-gray-400">Total officers on site: <span className="font-semibold text-gray-600">{data.activeOfficersCount ?? 2}</span></p>
                        <p className="text-[11px] text-gray-400">{data.oicCount ?? 1} OIC · {data.jsoCount ?? 1} JSO</p>
                    </div>
                </div>
            </div>

            {/* ── Recent Alerts ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <Bell className="h-3.5 w-3.5 text-red-500" />
                        </span>
                        Recent Alerts
                        <span className="h-4.5 w-4.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none px-1.5">
                            {notifications.length}
                        </span>
                    </h3>
                    <button className="text-xs text-indigo-500 font-semibold hover:underline">Mark all read</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {notifications.map((n, i) => (
                        <div key={i} className={`relative overflow-hidden rounded-xl border ${n.border} ${n.bg} p-4`}>
                            <div className={`absolute left-0 inset-y-0 w-1 ${n.bar} rounded-l-xl`} />
                            <div className="pl-3 flex items-start gap-2.5">
                                <n.Icon className={`h-4 w-4 ${n.iconColor} mt-0.5 shrink-0`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <span className="text-xs font-bold text-gray-800">{n.title}</span>
                                        <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{n.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Payment Summary + Recent Invoices ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Payment Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                        </span>
                        Payment Summary
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl p-4 border border-indigo-100/60">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Outstanding</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">
                            LKR {data.totalOutstanding.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="h-3 w-3 text-red-400" />
                            <span className="text-[11px] text-red-500 font-medium">{data.overdueInvoicesCount ?? 1} invoice overdue</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Current Invoice</p>
                            <p className="text-sm font-black text-gray-900 mt-0.5">
                                LKR {(data.monthlyBaseFee ?? 4150).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                            </p>
                            <Link to="/client/invoices" className="text-[11px] font-bold text-indigo-500 hover:underline mt-1 block">View PDF →</Link>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Last Payment</p>
                            <p className="text-sm font-black text-emerald-600 mt-0.5">LKR 2,500.00</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Aug 28, 2023</p>
                        </div>
                    </div>
                    <Link
                        to="/client/payments"
                        className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all"
                    >
                        <CloudUpload className="h-4 w-4" /> Upload Payment Proof
                    </Link>
                </div>

                {/* Recent Invoices Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-sm">Recent Invoices</h3>
                        <Link to="/client/invoices" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
                            View All <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/70">
                                    <th className="px-5 py-3">Invoice #</th>
                                    <th className="px-5 py-3">Billing Period</th>
                                    <th className="px-5 py-3">Amount</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {mockInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-sm text-gray-800">{inv.id}</td>
                                        <td className="px-5 py-3.5 text-sm text-gray-500">{inv.period}</td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">
                                            LKR {inv.amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusInvBadge(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => navigate("/client/invoices")}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Download className="h-4 w-4 text-gray-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Need Assistance Banner ── */}
            <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-7 overflow-hidden">
                <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute right-28 -top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div>
                        <h3 className="text-xl font-black text-white">Need Assistance?</h3>
                        <p className="text-sm text-gray-400 max-w-sm mt-1">
                            Our dedicated support team is available 24/7 to help with your security configurations or billing queries.
                        </p>
                    </div>
                    <a
                        href="tel:0114848177"
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl transition-all shrink-0 text-sm shadow-lg shadow-primary/20"
                    >
                        <Phone className="h-4 w-4" /> Contact Support
                    </a>
                </div>
            </section>

            {/* ── Service Feedback ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Star className="h-5 w-5 text-amber-500" />
                        </span>
                        <div>
                            <h3 className="font-bold text-sm text-gray-900">Service Feedback</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Help us improve — share your experience this month.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            to="/client/feedback"
                            className="text-xs text-gray-500 hover:text-gray-700 font-semibold border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            View History
                        </Link>
                        <Link
                            to="/client/feedback"
                            className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                        >
                            <Star className="h-3.5 w-3.5" /> Give Feedback
                        </Link>
                    </div>
                </div>
            </section>

            {showChangePassword && (
                <ChangePasswordModal
                    clientId={data.clientId}
                    onClose={() => {
                        setShowChangePassword(false);
                        localStorage.setItem("isFirstLogin", "false");
                    }}
                />
            )}
        </div>
    );
};

export default ClientDashboard;
