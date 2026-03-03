import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { paymentApi } from "@/lib/api";
import {
    CreditCard, CheckCircle2, Clock, AlertTriangle, Calendar,
    Search, Download, Eye, ChevronLeft, ChevronRight, FileText,
    CloudUpload, RotateCcw
} from "lucide-react";

const PAGE_SIZE = 8;

/* ── Status helpers ── */
const verificationBadge = (s: string) => {
    const m: Record<string, string> = {
        VERIFIED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        PENDING:  "bg-amber-100 text-amber-700 border border-amber-200",
        REJECTED: "bg-red-100 text-red-700 border border-red-200",
    };
    return m[s] ?? "bg-gray-100 text-gray-500 border border-gray-200";
};
const verificationLabel = (s: string) => {
    if (s === "VERIFIED") return "✓ Verified";
    if (s === "REJECTED") return "✗ Rejected";
    if (s === "PENDING")  return "⏳ Pending Review";
    return s;
};

const formatLKR = (n: number) => `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const ClientPayments = () => {
    const navigate = useNavigate();
    const clientId = Number(localStorage.getItem("clientId") ?? 0);

    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [err, setErr]           = useState("");
    const [search, setSearch]     = useState("");
    const [filter, setFilter]     = useState("ALL");
    const [page, setPage]         = useState(1);
    const [downloading, setDownloading] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await paymentApi.getByClient(clientId);
                setPayments(data);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load payment history");
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    /* ── Stats ── */
    const totalVerified = useMemo(() =>
        payments.filter(p => p.verificationStatus === "VERIFIED")
                .reduce((s: number, p: any) => s + (p.amountPaid ?? 0), 0),
    [payments]);

    const pendingCount  = useMemo(() =>
        payments.filter(p => p.verificationStatus === "PENDING").length, [payments]);

    const rejectedCount = useMemo(() =>
        payments.filter(p => p.verificationStatus === "REJECTED").length, [payments]);

    /* ── Filter ── */
    const filtered = useMemo(() => {
        let list = [...payments];
        if (filter !== "ALL") list = list.filter(p => p.verificationStatus === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                (p.invoiceNumber ?? "").toLowerCase().includes(q) ||
                (p.transactionReference ?? "").toLowerCase().includes(q)
            );
        }
        return list.sort((a: any, b: any) => new Date(b.proofUploadedAt ?? 0).getTime() - new Date(a.proofUploadedAt ?? 0).getTime());
    }, [payments, filter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDownloadReceipt = async (p: any) => {
        setDownloading(p.paymentId);
        try {
            await paymentApi.downloadReceipt(p.invoiceId, p.invoiceNumber ?? String(p.invoiceId));
        } catch {
            alert("Could not download receipt. Please try again.");
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pt-2">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Payment History</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Track all your submitted payment proofs and their verification status
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
                        label: "Total Verified",
                        value: formatLKR(totalVerified),
                        sub: `${payments.filter(p => p.verificationStatus === "VERIFIED").length} payments`,
                        bg: "bg-emerald-50", border: "border-emerald-100"
                    },
                    {
                        icon: <Clock className="h-5 w-5 text-amber-500" />,
                        label: "Pending Review",
                        value: String(pendingCount),
                        sub: pendingCount > 0 ? "Awaiting accountant review" : "All cleared",
                        bg: "bg-amber-50", border: "border-amber-100"
                    },
                    {
                        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
                        label: "Rejected Proofs",
                        value: String(rejectedCount),
                        sub: rejectedCount > 0 ? "Re-upload required" : "None",
                        bg: "bg-red-50", border: "border-red-100"
                    },
                    {
                        icon: <Calendar className="h-5 w-5 text-blue-500" />,
                        label: "Last Submission",
                        value: payments.length > 0
                            ? new Date(
                                [...payments].sort((a: any, b: any) =>
                                    new Date(b.proofUploadedAt ?? 0).getTime() - new Date(a.proofUploadedAt ?? 0).getTime()
                                )[0]?.proofUploadedAt
                              ).toLocaleDateString("en-LK")
                            : "—",
                        sub: "Most recent upload",
                        bg: "bg-blue-50", border: "border-blue-100"
                    },
                ].map(({ icon, label, value, sub, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                            {icon}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
                        </div>
                        <p className="text-lg font-black text-gray-900 leading-tight">{value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search invoice # or reference…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {["ALL","PENDING","VERIFIED","REJECTED"].map(s => (
                            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    filter === s
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}>
                                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {err && <p className="text-red-600 text-sm">{err}</p>}

            {/* Payment Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">
                            <th className="px-5 py-3.5">Invoice #</th>
                            <th className="px-5 py-3.5">Amount Paid</th>
                            <th className="px-5 py-3.5 hidden sm:table-cell">Payment Date</th>
                            <th className="px-5 py-3.5 hidden md:table-cell">Transaction Ref</th>
                            <th className="px-5 py-3.5 hidden lg:table-cell">Method</th>
                            <th className="px-5 py-3.5">Submitted</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-5 py-16 text-center">
                                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm text-gray-400 font-medium">No payment records found</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {filter === "ALL"
                                            ? "You haven't submitted any payment proofs yet."
                                            : "No records match this filter."}
                                    </p>
                                    {filter === "ALL" && (
                                        <button onClick={() => navigate("/client/invoices")}
                                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all">
                                            Go to Invoices
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : paginated.map((p: any) => (
                            <tr key={p.paymentId} className={`hover:bg-gray-50 transition-colors ${
                                p.verificationStatus === "REJECTED" ? "bg-red-50/30" : ""
                            }`}>
                                <td className="px-5 py-4 font-semibold text-sm text-gray-900">
                                    <button
                                        onClick={() => navigate(`/client/invoices/${p.invoiceId}`)}
                                        className="hover:text-primary hover:underline transition-colors"
                                    >
                                        {p.invoiceNumber ?? `INV-${p.invoiceId}`}
                                    </button>
                                </td>
                                <td className="px-5 py-4 font-bold text-sm text-gray-900">
                                    {formatLKR(p.amountPaid ?? 0)}
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-600 hidden sm:table-cell">
                                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-LK") : "—"}
                                </td>
                                <td className="px-5 py-4 text-xs text-gray-600 hidden md:table-cell font-mono">
                                    {p.transactionReference ?? "—"}
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-600 hidden lg:table-cell capitalize">
                                    {(p.paymentMethod ?? "").toLowerCase().replace(/_/g, " ")}
                                </td>
                                <td className="px-5 py-4 text-xs text-gray-500">
                                    {p.proofUploadedAt
                                        ? new Date(p.proofUploadedAt).toLocaleDateString("en-LK")
                                        : "—"}
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${verificationBadge(p.verificationStatus)}`}>
                                        {verificationLabel(p.verificationStatus)}
                                    </span>
                                    {p.verificationStatus === "REJECTED" && p.rejectionReason && (
                                        <p className="text-[10px] text-red-600 mt-0.5 max-w-[140px] truncate" title={p.rejectionReason}>
                                            {p.rejectionReason}
                                        </p>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => navigate(`/client/invoices/${p.invoiceId}`)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary"
                                            title="View Invoice"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        {p.verificationStatus === "VERIFIED" && (
                                            <button
                                                onClick={() => handleDownloadReceipt(p)}
                                                disabled={downloading === p.paymentId}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                                                title="Download Receipt"
                                            >
                                                {downloading === p.paymentId
                                                    ? <span className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                                                    : <Download className="h-3 w-3" />
                                                }
                                                Receipt
                                            </button>
                                        )}
                                        {p.verificationStatus === "REJECTED" && (
                                            <button
                                                onClick={() => navigate(`/client/invoices/${p.invoiceId}/upload-proof`)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-bold transition-colors"
                                                title="Re-upload Proof"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                Re-upload
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400">
                            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(pg => Math.max(1, pg - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => setPage(pg)}
                                    className={`w-7 h-7 text-xs rounded-lg font-semibold transition-all ${
                                        pg === page ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-gray-600"
                                    }`}>
                                    {pg}
                                </button>
                            ))}
                            <button onClick={() => setPage(pg => Math.min(totalPages, pg + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty state CTA */}
            {payments.length === 0 && !loading && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-gray-900">Ready to make a payment?</p>
                        <p className="text-sm text-gray-500 mt-0.5">Go to your invoices, open an issued invoice, and click Upload Payment Proof.</p>
                    </div>
                    <button onClick={() => navigate("/client/invoices")}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shrink-0">
                        <CloudUpload className="h-4 w-4" /> Pay an Invoice
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClientPayments;
