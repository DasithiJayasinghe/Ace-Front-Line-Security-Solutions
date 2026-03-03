import { useEffect, useState } from "react";
import { feedbackApi } from "@/lib/api";
import {
    Star, Send, MessageSquare, CheckCircle2, AlertCircle,
    ChevronDown, ChevronUp, Plus, X, Shield, Clock, Eye, EyeOff, MessageCircle
} from "lucide-react";

/* ── Types matching FeedbackResponse / FeedbackSubmissionRequest ────────── */
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

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const statusBadge = (s: string) => {
    if (s === "APPROVED")     return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (s === "REJECTED")     return "bg-red-100 text-red-700 border border-red-200";
    if (s === "UNDER_REVIEW") return "bg-blue-100 text-blue-700 border border-blue-200";
    return "bg-gray-100 text-gray-600 border border-gray-200";
};
const statusLabel = (s: string) => {
    if (s === "APPROVED")     return "Approved";
    if (s === "REJECTED")     return "Rejected";
    if (s === "UNDER_REVIEW") return "Under Review";
    return "Submitted";
};
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Star Rating Component ────────────────────────────────────────────────── */
const StarRow = ({
    value, onChange, label, size = "h-5 w-5",
}: {
    value: number;
    onChange?: (n: number) => void;
    label?: string;
    size?: string;
}) => (
    <div className="flex flex-col gap-1">
        {label && <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>}
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange?.(n)}
                    className={onChange ? "cursor-pointer" : "cursor-default"}
                >
                    <Star className={`${size} ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                </button>
            ))}
        </div>
    </div>
);

/* ── Main Component ────────────────────────────────────────────────────────── */
const ClientFeedback = () => {
    const [list, setList]           = useState<FeedbackItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [err, setErr]             = useState("");
    const [expanded, setExpanded]   = useState<number | null>(null);
    const [showForm, setShowForm]   = useState(false);
    const [visibleCount, setVisibleCount] = useState(4);

    /* form state — matches FeedbackSubmissionRequest */
    const [overallRating, setOverallRating]         = useState(0);
    const [officerRating, setOfficerRating]         = useState(0);
    const [responseTimeRating, setResponseTimeRating] = useState(0);
    const [communicationRating, setCommunicationRating] = useState(0);
    const [comment, setComment]                     = useState("");
    const [improvements, setImprovements]           = useState("");
    const [isAnonymous, setIsAnonymous]             = useState(false);
    const [submitting, setSubmitting]               = useState(false);
    const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const clientId    = Number(localStorage.getItem("clientId") ?? 0);
    const companyName = localStorage.getItem("companyName") ?? "Client";

    const load = async () => {
        try {
            const data = await feedbackApi.getByClient(clientId);
            setList(data);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [clientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!overallRating || !comment.trim()) return;
        setSubmitting(true);
        setSubmitMsg(null);
        try {
            await feedbackApi.submit(clientId, {
                overallRating,
                ...(officerRating    > 0 && { officerConductRating: officerRating }),
                ...(responseTimeRating > 0 && { responseTimeRating }),
                ...(communicationRating > 0 && { communicationRating }),
                comments: comment,
                improvements: improvements.trim() || undefined,
                isAnonymous,
            });
            setSubmitMsg({ ok: true, text: "Thank you! Your feedback has been submitted and is under review." });
            setOverallRating(0); setOfficerRating(0); setResponseTimeRating(0); setCommunicationRating(0);
            setComment(""); setImprovements(""); setIsAnonymous(false);
            load();
        } catch (e: any) {
            setSubmitMsg({ ok: false, text: e?.message ?? "Submission failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    /* rating distribution summary */
    const avgRating = list.length
        ? list.reduce((s, f) => s + f.overallRating, 0) / list.length
        : 0;
    const ratingDist = [5, 4, 3, 2, 1].map(r => ({
        r,
        count: list.filter(f => f.overallRating === r).length,
        pct: list.length
            ? Math.round(list.filter(f => f.overallRating === r).length / list.length * 100)
            : 0,
    }));

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">My Feedback</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Share your experience with our security services</p>
                    </div>
                    <button
                        onClick={() => { setShowForm(v => !v); setSubmitMsg(null); }}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                        {showForm
                            ? <><X className="h-4 w-4" /> Cancel</>
                            : <><Plus className="h-4 w-4" /> Submit Feedback</>}
                    </button>
                </div>

                {/* Submit Feedback Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Dark header with rating summary */}
                        <div className="bg-gray-900 text-white px-6 py-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="text-center">
                                    <p className="text-5xl font-black text-primary">
                                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                                    </p>
                                    <StarRow value={Math.round(avgRating)} size="h-4 w-4" />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {list.length} review{list.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    {ratingDist.map(({ r, count, pct }) => (
                                        <div key={r} className="flex items-center gap-2 text-xs">
                                            <span className="w-3 text-gray-300">{r}</span>
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                                            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                                                <div className="bg-yellow-400 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-gray-400 w-4 text-right">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Success / Error message */}
                        {submitMsg ? (
                            <div className="p-6">
                                <div className={`rounded-xl p-4 flex gap-3 ${submitMsg.ok ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                                    {submitMsg.ok
                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                        : <AlertCircle  className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
                                    <p className={`text-sm font-medium ${submitMsg.ok ? "text-emerald-700" : "text-red-700"}`}>
                                        {submitMsg.text}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setShowForm(false); setSubmitMsg(null); }}
                                    className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-sm transition-all">
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Overall Rating */}
                                <div>
                                    <StarRow
                                        value={overallRating}
                                        onChange={setOverallRating}
                                        label="Overall Rating *"
                                        size="h-8 w-8"
                                    />
                                </div>

                                {/* Sub-ratings */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Shield className="h-3.5 w-3.5 text-primary" />
                                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Officer Conduct</p>
                                        </div>
                                        <StarRow value={officerRating} onChange={setOfficerRating} size="h-5 w-5" />
                                        <p className="text-[10px] text-gray-400 mt-1">Optional</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Response Time</p>
                                        </div>
                                        <StarRow value={responseTimeRating} onChange={setResponseTimeRating} size="h-5 w-5" />
                                        <p className="text-[10px] text-gray-400 mt-1">Optional</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <MessageCircle className="h-3.5 w-3.5 text-primary" />
                                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Communication</p>
                                        </div>
                                        <StarRow value={communicationRating} onChange={setCommunicationRating} size="h-5 w-5" />
                                        <p className="text-[10px] text-gray-400 mt-1">Optional</p>
                                    </div>
                                </div>

                                {/* Comments */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                                        Your Experience * <span className="text-gray-400 normal-case font-normal">(10–500 characters)</span>
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Tell us about your experience with our services…"
                                        rows={4}
                                        minLength={10}
                                        maxLength={500}
                                        required
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 text-right">{comment.length}/500</p>
                                </div>

                                {/* Improvements */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                                        Suggestions for Improvement <span className="text-gray-400 normal-case font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={improvements}
                                        onChange={e => setImprovements(e.target.value)}
                                        placeholder="What could we do better?"
                                        rows={2}
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>

                                {/* Anonymous toggle */}
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <div
                                        onClick={() => setIsAnonymous(v => !v)}
                                        className={`relative w-10 h-5 rounded-full transition-all ${isAnonymous ? "bg-primary" : "bg-gray-200"}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isAnonymous ? "left-5" : "left-0.5"}`} />
                                    </div>
                                    <span className="text-sm text-gray-600 flex items-center gap-1.5">
                                        {isAnonymous ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
                                        Submit anonymously
                                    </span>
                                </label>

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 py-2.5 rounded-xl font-bold text-sm transition-all">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !overallRating || comment.trim().length < 10}
                                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        {submitting ? "Submitting…" : "Submit Feedback"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Error */}
                {err && <p className="text-red-600 text-sm">{err}</p>}

                {/* Feedback List */}
                {list.length === 0 && !showForm ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                        <p className="font-semibold text-gray-400">No feedback submitted yet</p>
                        <p className="text-sm text-gray-400 mt-1">Share your experience to help us improve our services.</p>
                    </div>
                ) : list.length > 0 && (
                    <div className="space-y-3">
                        {list.slice(0, visibleCount).map(fb => (
                            <div key={fb.feedbackId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Badges row */}
                                            <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusBadge(fb.status)}`}>
                                                    {statusLabel(fb.status)}
                                                </span>
                                                {fb.isAnonymous && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-0.5">
                                                        <EyeOff className="h-2.5 w-2.5" /> Anonymous
                                                    </span>
                                                )}
                                                {fb.displayOnHomepage && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                                        Public
                                                    </span>
                                                )}
                                            </div>

                                            {/* Ratings */}
                                            <div className="flex flex-wrap gap-4 mb-2">
                                                <StarRow value={fb.overallRating} label="Overall" size="h-4 w-4" />
                                                {fb.officerConductRating != null && (
                                                    <StarRow value={fb.officerConductRating} label="Officer" size="h-4 w-4" />
                                                )}
                                                {fb.responseTimeRating != null && (
                                                    <StarRow value={fb.responseTimeRating} label="Response" size="h-4 w-4" />
                                                )}
                                                {fb.communicationRating != null && (
                                                    <StarRow value={fb.communicationRating} label="Communication" size="h-4 w-4" />
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{fb.comments}</p>
                                        </div>
                                        <div className="text-right shrink-0 text-[11px] text-gray-400">
                                            {fb.submissionMonth && fb.submissionYear
                                                ? `${MONTHS_SHORT[(fb.submissionMonth ?? 1) - 1]} ${fb.submissionYear}`
                                                : new Date(fb.createdAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })
                                            }
                                        </div>
                                    </div>

                                    {/* Admin Response */}
                                    {fb.adminResponse && (
                                        <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1">Response from Ace Front Line</p>
                                            <p className="text-xs text-gray-700 leading-relaxed">{fb.adminResponse}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Expandable Improvements */}
                                {fb.improvements && (
                                    <div className="border-t border-gray-50">
                                        <button
                                            onClick={() => setExpanded(expanded === fb.feedbackId ? null : fb.feedbackId)}
                                            className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            <span>Suggestions for Improvement</span>
                                            {expanded === fb.feedbackId
                                                ? <ChevronUp className="h-3.5 w-3.5" />
                                                : <ChevronDown className="h-3.5 w-3.5" />}
                                        </button>
                                        {expanded === fb.feedbackId && (
                                            <div className="px-5 pb-4">
                                                <p className="text-xs text-gray-600 leading-relaxed">{fb.improvements}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {list.length > visibleCount && (
                            <button
                                onClick={() => setVisibleCount(v => v + 4)}
                                className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all"
                            >
                                Load More ({list.length - visibleCount} remaining)
                            </button>
                        )}
                    </div>
                )}
        </div>
    );
};

export default ClientFeedback;
