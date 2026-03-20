import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { invoiceApi } from "@/lib/api";
import type { Invoice } from "@/types/client";
import {
    Search, Download, Eye, TrendingUp, TrendingDown, FileText,
    ChevronLeft, ChevronRight, CloudUpload
} from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const statusBadge = (s: string) => {
    const m: Record<string, string> = {
        PAID:             "bg-emerald-100 text-emerald-700 border border-emerald-200",
        PENDING:          "bg-blue-100 text-blue-700 border border-blue-200",
        ISSUED:           "bg-amber-100 text-amber-700 border border-amber-200",
        OVERDUE:          "bg-red-100 text-red-700 border border-red-200",
        DRAFT:            "bg-gray-100 text-gray-500 border border-gray-200",
        APPROVED:         "bg-indigo-100 text-indigo-700 border border-indigo-200",
        PAYMENT_UPLOADED: "bg-sky-100 text-sky-700 border border-sky-200",
        PAYMENT_REJECTED: "bg-orange-100 text-orange-700 border border-orange-200",
        WAIVED:           "bg-purple-100 text-purple-700 border border-purple-200",
        DISPUTED:         "bg-yellow-100 text-yellow-700 border border-yellow-200",
        CANCELLED:        "bg-gray-200 text-gray-500 border border-gray-300",
    };
    return m[s] ?? "bg-gray-100 text-gray-600 border border-gray-200";
};

// Human-readable labels for statuses
const statusLabel = (s: string) => {
    const m: Record<string, string> = {
        PAYMENT_UPLOADED: "Proof Submitted",
        PAYMENT_REJECTED: "Proof Rejected",
    };
    return m[s] ?? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
};

const PAGE_SIZE = 8;

const ClientInvoices = () => {
    const [invoices, setInvoices]     = useState<Invoice[]>([]);
    const [loading, setLoading]       = useState(true);
    const [err, setErr]               = useState("");
    const [search, setSearch]         = useState("");
    const [filter, setFilter]         = useState<string>("ALL");
    const [page, setPage]             = useState(1);
    const navigate = useNavigate();

    const clientId    = Number(localStorage.getItem("clientId") ?? 0);
    const companyName = localStorage.getItem("companyName") ?? "Client";

    useEffect(() => {
        (async () => {
            try {
                const data = await invoiceApi.getByClient(clientId);
                setInvoices(data);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load invoices");
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    const totalOutstanding = useMemo(() =>
        invoices.filter(i => i.status !== "PAID" && i.status !== "WAIVED")
                .reduce((s, i) => s + (i.balanceAmount ?? i.totalAmount ?? 0), 0), [invoices]);

    const totalPaidThisYear = useMemo(() => {
        const yr = new Date().getFullYear();
        return invoices
            .filter(i => i.status === "PAID" && (i.billingYear === yr || new Date(i.issueDate ?? "").getFullYear() === yr))
            .reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    }, [invoices]);

    const settledCount  = useMemo(() => invoices.filter(i => i.status === "PAID").length, [invoices]);
    const avgMonthlyBill = useMemo(() =>
        invoices.length ? invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0) / invoices.length : 0,
    [invoices]);

    const filtered = useMemo(() => {
        let list = [...invoices];
        if (filter !== "ALL") list = list.filter(i => i.status === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(i =>
                (i.invoiceNumber ?? "").toLowerCase().includes(q) ||
                `${MONTHS[(i.billingMonth ?? 1) - 1]} ${i.billingYear}`.toLowerCase().includes(q)
            );
        }
        return list.sort((a, b) => (b.billingYear ?? 0) - (a.billingYear ?? 0) || (b.billingMonth ?? 0) - (a.billingMonth ?? 0));
    }, [invoices, filter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDownload = async (invoiceId: number) => {
        try {
            const blob = await invoiceApi.downloadPdf(invoiceId);
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `invoice-${invoiceId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert("Could not download PDF.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading invoices…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pt-2">

                <div>
                    <h1 className="text-2xl font-black text-gray-900">My Invoices</h1>
                    <p className="text-sm text-gray-500 mt-0.5">View and manage all your billing statements</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total Outstanding</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">
                            LKR {totalOutstanding.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-xs text-red-600 font-semibold">+12.5% from last month</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total Paid This Year</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">
                            LKR {totalPaidThisYear.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-xs text-emerald-600 font-semibold">{settledCount} invoices settled</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Average Monthly Bill</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">
                            LKR {avgMonthlyBill.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-semibold">-2.1% from last month</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search invoice # or period…"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {["ALL","ISSUED","PAYMENT_UPLOADED","PAYMENT_REJECTED","PAID","OVERDUE","WAIVED"].map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setFilter(s); setPage(1); }}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        filter === s
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {s === "ALL" ? "All" : statusLabel(s)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {err && <p className="text-red-600 text-sm">{err}</p>}

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                            <tr className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                <th className="px-6 py-3 text-left">Invoice #</th>
                                <th className="px-6 py-3 text-left">Period</th>
                                <th className="px-6 py-3 text-left">Issue Date</th>
                                <th className="px-6 py-3 text-left">Due Date</th>
                                <th className="px-6 py-3 text-left">Amount (LKR)</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No invoices found</p>
                                    </td>
                                </tr>
                            ) : paginated.map(inv => {
                                const period = `${MONTHS[(inv.billingMonth ?? 1) - 1]} ${inv.billingYear ?? ""}`;
                                return (
                                    <tr key={inv.invoiceId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-semibold text-sm text-gray-900">
                                            {inv.invoiceNumber ?? `INV-${inv.invoiceId}`}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{period}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">
                                            {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("en-LK") : "—"}
                                        </td>
                                        <td className={`px-6 py-3 text-sm font-medium ${inv.status === "OVERDUE" ? "text-red-600" : "text-gray-600"}`}>
                                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-LK") : "—"}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                                            {(inv.totalAmount ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadge(inv.status)}`}>
                                                {statusLabel(inv.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => navigate(`/client/invoices/${inv.invoiceId}`)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>
                                                {(inv.status === "ISSUED" || inv.status === "PAYMENT_REJECTED" || inv.status === "OVERDUE") && (
                                                    <button
                                                        onClick={() => navigate(`/client/invoices/${inv.invoiceId}/upload-proof`)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
                                                        title="Upload Payment Proof"
                                                    >
                                                        <CloudUpload className="h-3 w-3" />
                                                        Pay
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownload(inv.invoiceId)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                                                    title="Download PDF"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50">
                            <p className="text-xs text-gray-400">
                                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-7 h-7 text-xs rounded-lg font-semibold transition-all ${p === page ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-gray-600"}`}>
                                        {p}
                                    </button>
                                ))}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
        </div>
    );
};

export default ClientInvoices;
