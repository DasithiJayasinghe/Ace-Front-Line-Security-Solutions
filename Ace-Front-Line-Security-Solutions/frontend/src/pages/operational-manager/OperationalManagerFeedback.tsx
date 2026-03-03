import { useEffect, useState } from "react";
import { feedbackApi } from "@/lib/api";
import {
    Star, CheckCircle, XCircle, Flag, MessageSquare, Download,
    ChevronDown, ChevronUp, Search, Filter, X, Eye, EyeOff,
    Shield, Clock, MessageCircle, ThumbsUp, AlertTriangle,
    Building2, Calendar, RefreshCw, Send
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface FeedbackItem {
    feedbackId: number;
    clientId: number;
    companyName?: string;
    overallRating: number;
    officerConductRating?: number;
    responseTimeRating?: number;
    communicationRating?: number;
    comments: string;
    improvements?: string;
    isAnonymous?: boolean;
    submissionMonth?: number;
    submissionYear?: number;
    status: string;
    isApproved?: boolean;
    displayOnHomepage?: boolean;
    adminResponse?: string | null;
    createdAt: string;
    reviewedAt?: string | null;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const statusBadge = (s: string) => {
    if (s === "APPROVED")  return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s === "REJECTED")  return "bg-red-100 text-red-700 border-red-200";
    if (s === "FLAGGED")   return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-amber-100 text-amber-700 border-amber-200"; // PENDING
};
const statusLabel = (s: string) =>
    ({ APPROVED: "Approved", REJECTED: "Rejected", FLAGGED: "Flagged", PENDING: "Pending" }[s] ?? s);

const StarDisplay = ({ value, size = "h-4 w-4" }: { value?: number | null; size?: string }) => {
    if (!value) return <span className="text-xs text-gray-400">—</span>;
    return (
        <div className="flex gap-0.5">
            {[1,2,3,4,5].map(n => (
                <Star key={n} className={`${size} ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
            ))}
        </div>
    );
};

/* ── Review Modal ─────────────────────────────────────────────────────────── */
interface ReviewModalProps {
    fb: FeedbackItem;
    onClose: () => void;
    onRefresh: () => void;
}

const ReviewModal = ({ fb, onClose, onRefresh }: ReviewModalProps) => {
    const [action, setAction]       = useState<"approve_home" | "approve_internal" | "reject" | "flag" | "reply" | null>(null);
    const [notes, setNotes]         = useState(fb.adminResponse ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);

    const handleSubmit = async () => {
        if (!action) return;
        setSubmitting(true);
        setMsg(null);
        try {
            if (action === "approve_home") {
                await feedbackApi.approve(fb.feedbackId, true);
                setMsg({ ok: true, text: "Feedback approved and set to display on homepage." });
            } else if (action === "approve_internal") {
                await feedbackApi.approve(fb.feedbackId, false);
                setMsg({ ok: true, text: "Feedback approved (internal only)." });
            } else if (action === "reject") {
                await feedbackApi.reject(fb.feedbackId, notes || undefined);
                setMsg({ ok: true, text: "Feedback rejected." });
            } else if (action === "flag") {
                await feedbackApi.flag(fb.feedbackId, notes || undefined);
                setMsg({ ok: true, text: "Feedback flagged as inappropriate." });
            } else if (action === "reply") {
                if (!notes.trim()) { setMsg({ ok: false, text: "Reply message is required." }); setSubmitting(false); return; }
                await feedbackApi.reply(fb.feedbackId, notes);
                setMsg({ ok: true, text: "Reply sent to client." });
            }
            onRefresh();
        } catch (e: any) {
            setMsg({ ok: false, text: e?.message ?? "Action failed." });
        } finally {
            setSubmitting(false);
        }
    };

    const period = fb.submissionMonth && fb.submissionYear
        ? `${MONTHS[fb.submissionMonth - 1]} ${fb.submissionYear}`
        : new Date(fb.createdAt).toLocaleDateString("en-LK", { month: "short", year: "numeric" });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Modal header */}
                <div className="flex items-start justify-between p-5 border-b border-gray-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-gray-900">Review Feedback</h2>
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge(fb.status)}`}>
                                {statusLabel(fb.status)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Feedback #{fb.feedbackId} &nbsp;·&nbsp; Submitted {period}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Client info + ratings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                <span className="font-bold text-sm text-gray-900">
                                    {fb.isAnonymous ? "Anonymous" : (fb.companyName ?? "Unknown")}
                                </span>
                            </div>
                            {fb.isAnonymous && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <EyeOff className="h-3 w-3" /> Submitted anonymously
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Overall Rating</p>
                            <div className="flex items-center gap-2">
                                <StarDisplay value={fb.overallRating} size="h-5 w-5" />
                                <span className="text-2xl font-black text-gray-900">{fb.overallRating}<span className="text-sm text-gray-400 font-normal">/5</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-ratings */}
                    {(fb.officerConductRating || fb.responseTimeRating || fb.communicationRating) && (
                        <div className="grid grid-cols-3 gap-3">
                            {fb.officerConductRating != null && (
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <Shield className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Officer Conduct</p>
                                    <StarDisplay value={fb.officerConductRating} size="h-3.5 w-3.5" />
                                </div>
                            )}
                            {fb.responseTimeRating != null && (
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Response Time</p>
                                    <StarDisplay value={fb.responseTimeRating} size="h-3.5 w-3.5" />
                                </div>
                            )}
                            {fb.communicationRating != null && (
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <MessageCircle className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Communication</p>
                                    <StarDisplay value={fb.communicationRating} size="h-3.5 w-3.5" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feedback Content */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" /> Feedback Content
                        </p>
                        <blockquote className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 italic leading-relaxed border-l-4 border-primary">
                            "{fb.comments}"
                        </blockquote>
                    </div>

                    {fb.improvements && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Suggestions for Improvement</p>
                            <p className="text-sm text-gray-600 leading-relaxed bg-blue-50 rounded-xl p-3 border border-blue-100">
                                {fb.improvements}
                            </p>
                        </div>
                    )}

                    {/* Existing admin response */}
                    {fb.adminResponse && action !== "reply" && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1">Previous Response</p>
                            <p className="text-sm text-gray-700">{fb.adminResponse}</p>
                        </div>
                    )}

                    {/* Success/Error message */}
                    {msg && (
                        <div className={`rounded-xl p-3 flex gap-2 text-sm font-medium ${msg.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                            {msg.ok ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                            {msg.text}
                        </div>
                    )}

                    {/* Action selector */}
                    {!msg?.ok && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Action</p>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { id: "approve_home"     as const, icon: <ThumbsUp className="h-4 w-4" />, label: "Approve & Display on Homepage", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
                                    { id: "approve_internal" as const, icon: <CheckCircle className="h-4 w-4" />, label: "Approve Internal Only",           color: "border-blue-300 bg-blue-50 text-blue-700" },
                                    { id: "reject"           as const, icon: <XCircle className="h-4 w-4" />,  label: "Reject",                           color: "border-red-300 bg-red-50 text-red-700" },
                                    { id: "flag"             as const, icon: <Flag className="h-4 w-4" />,     label: "Flag as Inappropriate",            color: "border-orange-300 bg-orange-50 text-orange-700" },
                                    { id: "reply"            as const, icon: <Send className="h-4 w-4" />,     label: "Reply to Client",                  color: "border-purple-300 bg-purple-50 text-purple-700" },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setAction(opt.id)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all
                                            ${action === opt.id ? opt.color + " ring-2 ring-offset-1 ring-current" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                                    >
                                        {opt.icon} {opt.label}
                                    </button>
                                ))}
                            </div>

                            {(action === "reject" || action === "flag" || action === "reply") && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                        {action === "reply" ? "Reply Message *" : "Internal Notes / Reason (optional)"}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder={
                                            action === "reply"
                                                ? "Write your response to the client..."
                                                : "Add notes or a reason for this decision..."
                                        }
                                        rows={3}
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal footer */}
                <div className="flex gap-3 p-5 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 py-2.5 rounded-xl font-bold text-sm transition-all"
                    >
                        {msg?.ok ? "Close" : "Cancel"}
                    </button>
                    {!msg?.ok && (
                        <button
                            onClick={handleSubmit}
                            disabled={!action || submitting}
                            className="flex-[2] bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                                : "Submit Decision"
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Main Component ──────────────────────────────────────────────────────── */
const OperationalManagerFeedback = () => {
    const [list, setList]           = useState<FeedbackItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [err, setErr]             = useState("");
    const [filter, setFilter]       = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED">("ALL");
    const [search, setSearch]       = useState("");
    const [selectedFb, setSelectedFb] = useState<FeedbackItem | null>(null);
    const [expanded, setExpanded]   = useState<number | null>(null);
    const [downloading, setDownloading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await feedbackApi.getAll();
            setList(data);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDownloadReport = async () => {
        setDownloading(true);
        try { await feedbackApi.downloadReport(); }
        catch (e: any) { alert(e?.message ?? "Download failed"); }
        finally { setDownloading(false); }
    };

    const filtered = list.filter(fb => {
        const matchStatus = filter === "ALL" || fb.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !q
            || (fb.companyName ?? "").toLowerCase().includes(q)
            || (fb.comments ?? "").toLowerCase().includes(q)
            || String(fb.feedbackId).includes(q);
        return matchStatus && matchSearch;
    });

    /* Stats */
    const pending  = list.filter(f => f.status === "PENDING").length;
    const approved = list.filter(f => f.status === "APPROVED").length;
    const rejected = list.filter(f => f.status === "REJECTED").length;
    const flagged  = list.filter(f => f.status === "FLAGGED").length;
    const avgRating = list.length
        ? (list.reduce((s, f) => s + (f.overallRating ?? 0), 0) / list.length).toFixed(1)
        : "—";
    const onHomepage = list.filter(f => f.displayOnHomepage).length;

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Client Feedback</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review, moderate and respond to client feedback submissions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={load}
                        className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                    <button
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                    >
                        <Download className="h-4 w-4" />
                        {downloading ? "Generating…" : "Download Report"}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: "Total",       value: list.length, color: "text-gray-900" },
                    { label: "Pending",     value: pending,     color: "text-amber-600" },
                    { label: "Approved",    value: approved,    color: "text-emerald-600" },
                    { label: "Rejected",    value: rejected,    color: "text-red-600" },
                    { label: "Flagged",     value: flagged,     color: "text-orange-600" },
                    { label: "Avg Rating",  value: avgRating,   color: "text-blue-600" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Homepage display notice */}
            {onHomepage > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                    <Eye className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700">
                        <span className="font-bold">{onHomepage}</span> feedback{onHomepage > 1 ? "s are" : " is"} currently displayed on the homepage testimonials section.
                    </p>
                </div>
            )}

            {/* Filters + Search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by company, comment or ID…"
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(["ALL","PENDING","APPROVED","REJECTED","FLAGGED"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border
                                    ${filter === f ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error */}
            {err && <p className="text-red-600 text-sm">{err}</p>}

            {/* Feedback list */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                    <p className="font-semibold text-gray-400">No feedback found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter settings.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(fb => {
                        const period = fb.submissionMonth && fb.submissionYear
                            ? `${MONTHS[fb.submissionMonth - 1]} ${fb.submissionYear}`
                            : new Date(fb.createdAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });

                        return (
                            <div key={fb.feedbackId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Left: company initial */}
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-base">
                                            {fb.isAnonymous ? "?" : (fb.companyName?.[0] ?? "C")}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className="font-bold text-sm text-gray-900">
                                                    {fb.isAnonymous ? "Anonymous Client" : (fb.companyName ?? "Unknown")}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge(fb.status)}`}>
                                                    {statusLabel(fb.status)}
                                                </span>
                                                {fb.displayOnHomepage && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                                        <Eye className="h-2.5 w-2.5" /> Homepage
                                                    </span>
                                                )}
                                                {fb.isAnonymous && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-0.5">
                                                        <EyeOff className="h-2.5 w-2.5" /> Anonymous
                                                    </span>
                                                )}
                                                <span className="ml-auto text-[11px] text-gray-400 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> {period}
                                                </span>
                                            </div>

                                            {/* Ratings row */}
                                            <div className="flex flex-wrap gap-4 mb-2">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Overall</span>
                                                    <StarDisplay value={fb.overallRating} size="h-3.5 w-3.5" />
                                                    <span className="text-xs font-bold text-gray-700">({fb.overallRating}/5)</span>
                                                </div>
                                                {fb.officerConductRating != null && (
                                                    <div className="flex items-center gap-1">
                                                        <Shield className="h-3 w-3 text-gray-400" />
                                                        <StarDisplay value={fb.officerConductRating} size="h-3 w-3" />
                                                    </div>
                                                )}
                                                {fb.responseTimeRating != null && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-gray-400" />
                                                        <StarDisplay value={fb.responseTimeRating} size="h-3 w-3" />
                                                    </div>
                                                )}
                                                {fb.communicationRating != null && (
                                                    <div className="flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3 text-gray-400" />
                                                        <StarDisplay value={fb.communicationRating} size="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{fb.comments}</p>

                                            {/* Admin response */}
                                            {fb.adminResponse && (
                                                <div className="mt-2.5 bg-primary/5 border border-primary/20 rounded-lg p-2.5">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-0.5">Our Response</p>
                                                    <p className="text-xs text-gray-700">{fb.adminResponse}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="shrink-0 flex gap-2">
                                            <button
                                                onClick={() => setSelectedFb(fb)}
                                                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-2 rounded-xl font-bold text-xs transition-all"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> Review
                                            </button>
                                            <button
                                                onClick={() => setExpanded(expanded === fb.feedbackId ? null : fb.feedbackId)}
                                                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                            >
                                                {expanded === fb.feedbackId
                                                    ? <ChevronUp className="h-4 w-4 text-gray-500" />
                                                    : <ChevronDown className="h-4 w-4 text-gray-500" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable details */}
                                {expanded === fb.feedbackId && (
                                    <div className="border-t border-gray-50 px-5 pb-4 pt-3 space-y-3 bg-gray-50/50">
                                        {fb.improvements && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Suggestions for Improvement</p>
                                                <p className="text-xs text-gray-600 leading-relaxed">{fb.improvements}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                                            <div><span className="font-bold text-gray-700">Feedback ID:</span> #{fb.feedbackId}</div>
                                            <div><span className="font-bold text-gray-700">Client ID:</span> #{fb.clientId}</div>
                                            <div><span className="font-bold text-gray-700">Reviewed:</span> {fb.reviewedAt ? new Date(fb.reviewedAt).toLocaleDateString("en-LK") : "Not yet"}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedFb && (
                <ReviewModal
                    fb={selectedFb}
                    onClose={() => setSelectedFb(null)}
                    onRefresh={() => { load(); setSelectedFb(null); }}
                />
            )}
        </div>
    );
};

export default OperationalManagerFeedback;
