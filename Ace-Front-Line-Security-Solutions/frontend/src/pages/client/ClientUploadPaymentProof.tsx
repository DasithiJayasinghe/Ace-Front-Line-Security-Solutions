import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { invoiceApi, paymentApi } from "@/lib/api";
import type { Invoice } from "@/types/client";
import {
    ChevronRight, CloudUpload, Paperclip, CheckCircle2,
    AlertCircle, Shield, ExternalLink, ArrowLeft, X, Bell
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const ClientUploadPaymentProof = () => {
    const { id } = useParams<{ id: string }>();
    const navigate  = useNavigate();
    const fileRef   = useRef<HTMLInputElement>(null);

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState("");

    // form fields
    const [txRef,    setTxRef]   = useState("");
    const [payDate,  setPayDate] = useState("");
    const [amtPaid,  setAmtPaid] = useState("");
    const [bankName, setBankName]= useState("");
    const [file,     setFile]    = useState<File | null>(null);
    const [dragOver, setDragOver]= useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

    const companyName = localStorage.getItem("companyName") ?? "Client";

    useEffect(() => {
        (async () => {
            try {
                const data = await invoiceApi.getByIdForClient(Number(id));
                setInvoice(data);
                // Pre-fill amount
                setAmtPaid(String(data.balanceAmount ?? data.totalAmount ?? ""));
            } catch (e: any) {
                setErr(e?.message ?? "Invoice not found");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) validateAndSetFile(dropped);
    };

    const validateAndSetFile = (f: File) => {
        const allowed = ["image/jpeg","image/png","application/pdf"];
        if (!allowed.includes(f.type)) {
            alert("Only JPG, PNG, or PDF files are accepted.");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            alert("File must be under 5 MB.");
            return;
        }
        setFile(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice || !file || !txRef || !payDate || !amtPaid) return;

        setSubmitting(true);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append("invoiceId",            String(invoice.invoiceId));
            fd.append("amountPaid",           amtPaid);
            fd.append("paymentDate",          payDate);
            fd.append("transactionReference", txRef);
            fd.append("paymentMethod",        "BANK_TRANSFER");
            if (bankName) fd.append("bankName", bankName);
            fd.append("paymentProof",         file);
            await paymentApi.upload(fd);
            setResult({ ok: true, text: "Payment proof submitted successfully! Our team will verify within 24–48 hours." });
        } catch (e: any) {
            setResult({ ok: false, text: e?.message ?? "Upload failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Page shell (always rendered) ──────────────────────────────────────

    const portalHeader = (
        <header className="bg-charcoal text-charcoal-foreground border-b border-charcoal-foreground/10">
            <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
                <Link to="/client/dashboard" className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="leading-none">
                        <p className="font-extrabold text-sm uppercase tracking-tight">Ace Front Line</p>
                        <p className="text-[9px] tracking-[0.2em] text-charcoal-foreground/40 uppercase mt-0.5">Client Portal</p>
                    </div>
                </Link>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-charcoal-foreground/50 hover:text-charcoal-foreground transition-colors rounded-lg hover:bg-charcoal-foreground/5">
                        <Bell className="w-5 h-5" />
                    </button>
                    <div className="w-px h-8 bg-charcoal-foreground/10 mx-1" />
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold leading-none">{companyName}</p>
                            <p className="text-[10px] text-charcoal-foreground/40 uppercase tracking-widest mt-1">Client Account</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-black text-sm text-primary-foreground shrink-0">
                            {companyName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );

    // ── Loading ────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            {portalHeader}
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    if (err || !invoice) return (
        <div className="min-h-screen bg-gray-50">
            {portalHeader}
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-red-600 font-semibold">{err || "Invoice not found"}</p>
                <button onClick={() => navigate("/client/invoices")}
                    className="text-sm font-semibold text-primary underline">← Back to Invoices</button>
            </div>
        </div>
    );

    const totalDue  = invoice.balanceAmount ?? invoice.totalAmount ?? 0;
    const period    = invoice.billingMonth
        ? `${MONTHS[(invoice.billingMonth ?? 1) - 1]} ${invoice.billingYear}`
        : "—";
    const canUpload = ["ISSUED","PAYMENT_REJECTED","OVERDUE"].includes(invoice.status);

    // ── Success screen ────────────────────────────────────────────────────

    if (result?.ok) return (
        <div className="min-h-screen bg-gray-50">
            {portalHeader}
            <div className="max-w-lg mx-auto py-16 text-center space-y-5 px-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Proof Submitted!</h2>
                <p className="text-gray-500 text-sm">{result.text}</p>
                <div className="bg-white border rounded-xl p-4 text-sm text-left space-y-1">
                    <p className="font-semibold text-gray-700">What happens next?</p>
                    <ul className="text-gray-500 space-y-1 list-disc list-inside text-xs">
                        <li>Our accountant will review your proof within 24–48 business hours</li>
                        <li>You will be notified by email once verified</li>
                        <li>After approval, your invoice status updates to <strong>Paid</strong></li>
                        <li>A receipt PDF will be available in your Payments tab</li>
                    </ul>
                </div>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate("/client/invoices")}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-all">
                        Back to Invoices
                    </button>
                    <button onClick={() => navigate("/client/payments")}
                        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
                        View Payments
                    </button>
                </div>
            </div>
        </div>
    );

    // ── Not eligible ──────────────────────────────────────────────────────

    if (!canUpload) return (
        <div className="min-h-screen bg-gray-50">
            {portalHeader}
            <div className="max-w-lg mx-auto py-16 text-center space-y-4 px-6">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <h2 className="text-lg font-black text-gray-900">Cannot Upload Proof</h2>
                <p className="text-sm text-gray-500">
                    This invoice has status <strong>{invoice.status}</strong> and does not accept payment proof uploads.
                    {invoice.status === "PAID" && " This invoice is already marked as paid."}
                    {invoice.status === "PAYMENT_UPLOADED" && " A proof has already been submitted and is awaiting verification."}
                </p>
                <button onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                    className="text-sm font-semibold text-primary underline">← View Invoice</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Portal Header */}
            {portalHeader}

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-5">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Link to="/client/dashboard" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link to="/client/invoices" className="hover:text-primary transition-colors">Invoices</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-gray-900 font-semibold">Upload Payment Proof</span>
                </nav>

                {/* Page header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                        className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
                        <ArrowLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Confirm Your Payment</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Please provide details of your transaction. Verification typically takes 24–48 business hours.
                        </p>
                    </div>
                </div>

                {/* PAYMENT_REJECTED banner */}
                {invoice.status === "PAYMENT_REJECTED" && (
                    <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-800 text-sm">Previous proof was rejected</p>
                            <p className="text-xs text-orange-600 mt-0.5">Please upload a clear copy of your bank receipt or transfer confirmation.</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-5">

                        {/* ── Left: Invoice Summary ── */}
                        <div className="md:col-span-2 bg-gray-900 text-white p-8 flex flex-col">
                            <div className="flex-1 space-y-5">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Invoice Summary</p>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice Number</p>
                                    <p className="text-xl font-black text-primary mt-1">{invoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Outstanding Balance</p>
                                    <p className="text-4xl font-black text-yellow-400 mt-1 leading-none">
                                        LKR {totalDue.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-gray-400 uppercase tracking-wide">Period</p>
                                        <p className="font-semibold text-white mt-1">{period}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 uppercase tracking-wide">Due Date</p>
                                        <p className={`font-semibold mt-1 ${invoice.status === "OVERDUE" ? "text-red-400" : "text-white"}`}>
                                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-LK") : "—"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                    <ExternalLink className="h-3 w-3" /> View full invoice
                                </button>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3">
                                <Shield className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-yellow-400">Secure Submission</p>
                                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                        Your payment data is encrypted and handled directly by our secure billing system.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Right: Upload Form ── */}
                        <div className="md:col-span-3 p-8">
                            {result?.ok === false && (
                                <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{result.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Transaction Reference */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                        Transaction Reference Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={txRef}
                                        onChange={e => setTxRef(e.target.value)}
                                        required
                                        placeholder="e.g. TXN987654321"
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Found on your bank receipt or wire transfer confirmation.</p>
                                </div>

                                {/* Date + Amount row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                            Payment Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={payDate}
                                            onChange={e => setPayDate(e.target.value)}
                                            required
                                            max={new Date().toISOString().split("T")[0]}
                                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                            Amount Paid (LKR) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">LKR</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={amtPaid}
                                                onChange={e => setAmtPaid(e.target.value)}
                                                required
                                                placeholder="0.00"
                                                className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                        Receipt / Proof of Payment <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                            file       ? "border-primary bg-primary/5" :
                                            dragOver   ? "border-primary/70 bg-primary/5" :
                                            "border-gray-200 hover:border-primary/50 bg-gray-50 hover:bg-gray-100"
                                        }`}
                                    >
                                        {file ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Paperclip className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                                                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); setFile(null); }}
                                                    className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5 text-gray-500" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <CloudUpload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm font-semibold text-gray-700">Drag and drop file here</p>
                                                <p className="text-xs text-gray-400 mt-1">or <span className="text-primary font-semibold underline">browse files</span> from your computer</p>
                                                <div className="flex items-center justify-center gap-2 mt-3">
                                                    {["PDF","JPG","PNG"].map(t => (
                                                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-gray-200 text-gray-600 rounded">{t}</span>
                                                    ))}
                                                    <span className="text-[10px] text-gray-400">Max 5MB</span>
                                                </div>
                                            </>
                                        )}
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="hidden"
                                            onChange={e => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                                        className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-bold text-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !txRef || !payDate || !amtPaid || !file}
                                        className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                Submitting…
                                            </>
                                        ) : (
                                            <>
                                                <CloudUpload className="h-4 w-4" />
                                                Submit Proof →
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientUploadPaymentProof;

