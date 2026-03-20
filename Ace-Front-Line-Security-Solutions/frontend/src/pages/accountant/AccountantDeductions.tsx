import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { deductionApi } from "@/lib/api";
import {
    Plus, Search, Filter, Eye, Trash2, CheckCircle2,
    XCircle, Clock, AlertTriangle, TrendingDown, ChevronLeft,
    ChevronRight, RefreshCw, CalendarDays, Building2, User,
} from "lucide-react";

const PAGE_SIZE = 10;

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmtLKR = (n: number) =>
    `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const fmtDate = (s: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

const typeLabel: Record<string, string> = {
    ABSENCE:                 "Absence",
    MISCONDUCT:              "Misconduct",
    SLA_BREACH:              "SLA Breach",
    EQUIPMENT_NON_COMPLIANCE:"Equipment / Uniform",
    CUSTOM:                  "Custom",
};

const typeBadge: Record<string, string> = {
    ABSENCE:                 "bg-amber-100 text-amber-700 border-amber-200",
    MISCONDUCT:              "bg-red-100 text-red-700 border-red-200",
    SLA_BREACH:              "bg-orange-100 text-orange-700 border-orange-200",
    EQUIPMENT_NON_COMPLIANCE:"bg-purple-100 text-purple-700 border-purple-200",
    CUSTOM:                  "bg-gray-100 text-gray-600 border-gray-200",
};

const approvalBadge: Record<string, string> = {
    PENDING:  "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const ApprovalIcon = ({ status }: { status: string }) => {
    if (status === "APPROVED") return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (status === "REJECTED") return <XCircle className="h-3.5 w-3.5" />;
    return <Clock className="h-3.5 w-3.5" />;
};

/* ── Reject modal ── */
const RejectModal = ({
    deduction, onConfirm, onClose,
}: {
    deduction: any;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}) => {
    const [reason, setReason] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-1">Reject Deduction</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Provide a reason for rejecting the deduction for <strong>{deduction.companyName}</strong>.
                </p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    placeholder="Enter rejection reason…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
                <div className="flex gap-2 mt-4 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >Cancel</button>
                    <button
                        disabled={!reason.trim()}
                        onClick={() => onConfirm(reason.trim())}
                        className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-40 transition-all"
                    >Reject</button>
                </div>
            </div>
        </div>
    );
};

/* ── Detail modal ── */
const DetailModal = ({ d, onClose }: { d: any; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-900">Deduction Details</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Client",          value: d.companyName },
                        { label: "Type",            value: typeLabel[d.deductionType] ?? d.deductionType },
                        { label: "Amount",          value: fmtLKR(d.amount) },
                        { label: "Incident Date",   value: fmtDate(d.incidentDate) },
                        { label: "Target Period",   value: `${MONTH_NAMES[(d.targetBillingMonth ?? 1) - 1]} ${d.targetBillingYear}` },
                        { label: "Officer",         value: d.officerName ?? "—" },
                        { label: "Approval Status", value: d.accountantApprovalStatus },
                        { label: "Applied",         value: d.appliedToInvoice ? "Yes" : "No" },
                        { label: "Queued Next Month", value: d.queuedForNextMonth ? "Yes" : "No" },
                        { label: "Invoice",         value: d.invoiceNumber ?? "Not linked yet" },
                    ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                            <p className="font-semibold text-gray-800 truncate">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-gray-700 leading-relaxed">{d.description}</p>
                </div>
                {d.accountantRejectionReason && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">Rejection Reason</p>
                        <p className="text-red-700">{d.accountantRejectionReason}</p>
                    </div>
                )}
            </div>
            <button
                onClick={onClose}
                className="mt-5 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >Close</button>
        </div>
    </div>
);

const AccountantDeductions = () => {
    const navigate = useNavigate();

    const [deductions, setDeductions]       = useState<any[]>([]);
    const [loading, setLoading]             = useState(true);
    const [err, setErr]                     = useState("");
    const [search, setSearch]               = useState("");
    const [typeFilter, setTypeFilter]       = useState("ALL");
    const [statusFilter, setStatusFilter]   = useState("ALL");
    const [appliedFilter, setAppliedFilter] = useState("ALL");
    const [page, setPage]                   = useState(1);
    const [viewDetail, setViewDetail]       = useState<any | null>(null);
    const [rejectTarget, setRejectTarget]   = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        setErr("");
        try {
            setDeductions(await deductionApi.getAll());
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load deductions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    /* ── Stats ── */
    const totalCount      = deductions.length;
    const pendingAmount   = useMemo(() =>
        deductions.filter(d => !d.appliedToInvoice).reduce((s, d) => s + d.amount, 0), [deductions]);
    const appliedAmount   = useMemo(() =>
        deductions.filter(d => d.appliedToInvoice).reduce((s, d) => s + d.amount, 0), [deductions]);
    const pendingApproval = useMemo(() =>
        deductions.filter(d => d.accountantApprovalStatus === "PENDING").length, [deductions]);

    /* ── Filtering ── */
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return deductions.filter(d => {
            const matchSearch = !q
                || d.companyName?.toLowerCase().includes(q)
                || (d.officerName ?? "").toLowerCase().includes(q)
                || String(d.deductionId).includes(q);
            const matchType   = typeFilter   === "ALL" || d.deductionType             === typeFilter;
            const matchStatus = statusFilter === "ALL" || d.accountantApprovalStatus  === statusFilter;
            const matchApplied =
                appliedFilter === "ALL"     ||
                (appliedFilter === "YES"    && d.appliedToInvoice) ||
                (appliedFilter === "NO"     && !d.appliedToInvoice) ||
                (appliedFilter === "QUEUED" && d.queuedForNextMonth);
            return matchSearch && matchType && matchStatus && matchApplied;
        });
    }, [deductions, search, typeFilter, statusFilter, appliedFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleApprove = async (d: any) => {
        setActionLoading(d.deductionId);
        try {
            await deductionApi.approve(d.deductionId);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Failed to approve");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectTarget) return;
        setActionLoading(rejectTarget.deductionId);
        try {
            await deductionApi.reject(rejectTarget.deductionId, reason);
            setRejectTarget(null);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Failed to reject");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (d: any) => {
        if (!confirm(`Delete deduction #${d.deductionId} for ${d.companyName}? This cannot be undone.`)) return;
        setActionLoading(d.deductionId);
        try {
            await deductionApi.delete(d.deductionId);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Failed to delete");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-5 pb-10">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Deduction Management</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Manage and track financial offsets for security incidents.</p>
                </div>
                <button
                    onClick={() => navigate("/accountant/deductions/create")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-primary/20"
                >
                    <Plus className="h-4 w-4" /> Create New Deduction
                </button>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Deductions",    value: totalCount,                     sub: "Total incidents recorded", Icon: TrendingDown, color: "text-gray-700",     bg: "bg-gray-100" },
                    { label: "Pending Amount",       value: fmtLKR(pendingAmount),          sub: "Awaiting invoice application", Icon: Clock,       color: "text-amber-600",    bg: "bg-amber-50" },
                    { label: "Applied This Period",  value: fmtLKR(appliedAmount),          sub: "Successfully offset", Icon: CheckCircle2,         color: "text-emerald-600",  bg: "bg-emerald-50" },
                    { label: "Pending Approval",     value: `${pendingApproval} records`,   sub: "Awaiting your review", Icon: AlertTriangle,        color: "text-red-500",      bg: "bg-red-50" },
                ].map(({ label, value, sub, Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
                        <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                            <Icon className={`h-4.5 w-4.5 ${color}`} />
                        </div>
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                        <p className="text-lg font-black text-gray-900 mt-0.5 truncate">{value}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Table Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by client, officer, or ID…"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">All Types</option>
                        {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">All Approvals</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <select
                        value={appliedFilter}
                        onChange={e => { setAppliedFilter(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">All States</option>
                        <option value="YES">Applied to Invoice</option>
                        <option value="NO">Not Applied</option>
                        <option value="QUEUED">Queued Next Month</option>
                    </select>
                    <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all" title="Refresh">
                        <RefreshCw className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                {/* Error */}
                {err && (
                    <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm">Loading deductions…</p>
                        </div>
                    </div>
                ) : paged.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <TrendingDown className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No deductions found</p>
                        <p className="text-xs mt-1">Try adjusting your filters or create a new deduction.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <th className="px-5 py-3 text-left">Client</th>
                                    <th className="px-5 py-3 text-left">Type</th>
                                    <th className="px-5 py-3 text-left">Amount (LKR)</th>
                                    <th className="px-5 py-3 text-left">Incident Date</th>
                                    <th className="px-5 py-3 text-left">Target Period</th>
                                    <th className="px-5 py-3 text-left">Approval</th>
                                    <th className="px-5 py-3 text-left">Applied</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paged.map((d) => (
                                    <tr key={d.deductionId} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                    <Building2 className="h-3.5 w-3.5 text-gray-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900 truncate">{d.companyName}</p>
                                                    <p className="text-[11px] text-gray-400">#{d.deductionId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${typeBadge[d.deductionType] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                {typeLabel[d.deductionType] ?? d.deductionType}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-sm text-gray-900">
                                            {d.amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                {fmtDate(d.incidentDate)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-600 font-medium">
                                            {MONTH_NAMES[(d.targetBillingMonth ?? 1) - 1]} {d.targetBillingYear}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${approvalBadge[d.accountantApprovalStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                <ApprovalIcon status={d.accountantApprovalStatus} />
                                                {d.accountantApprovalStatus}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {d.appliedToInvoice ? (
                                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                    Applied
                                                </span>
                                            ) : d.queuedForNextMonth ? (
                                                <span className="text-[11px] font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                                                    Queued
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <button
                                                    onClick={() => setViewDetail(d)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </button>
                                                {/* Approve */}
                                                {d.accountantApprovalStatus === "PENDING" && !d.appliedToInvoice && (
                                                    <button
                                                        onClick={() => handleApprove(d)}
                                                        disabled={actionLoading === d.deductionId}
                                                        className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    </button>
                                                )}
                                                {/* Reject */}
                                                {d.accountantApprovalStatus === "PENDING" && !d.appliedToInvoice && (
                                                    <button
                                                        onClick={() => setRejectTarget(d)}
                                                        disabled={actionLoading === d.deductionId}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="h-4 w-4 text-red-400" />
                                                    </button>
                                                )}
                                                {/* Delete */}
                                                {!d.appliedToInvoice && (
                                                    <button
                                                        onClick={() => handleDelete(d)}
                                                        disabled={actionLoading === d.deductionId}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && filtered.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all"
                            ><ChevronLeft className="h-4 w-4" /></button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === "…" ? (
                                        <span key={`e-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p as number)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                                                page === p
                                                    ? "bg-primary text-primary-foreground"
                                                    : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                                            }`}
                                        >{p}</button>
                                    )
                                )}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all"
                            ><ChevronRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {viewDetail   && <DetailModal d={viewDetail} onClose={() => setViewDetail(null)} />}
            {rejectTarget && <RejectModal deduction={rejectTarget} onConfirm={handleReject} onClose={() => setRejectTarget(null)} />}
        </div>
    );
};

export default AccountantDeductions;
