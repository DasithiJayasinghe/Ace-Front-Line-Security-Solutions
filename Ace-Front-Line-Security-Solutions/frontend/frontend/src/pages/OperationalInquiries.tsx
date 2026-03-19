import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, MessageCircle, ChevronDown, ChevronRight, Mail, Phone, User,
  Calendar, MapPin, Clock, Send, CheckCircle, FileText, Reply, ArrowUpDown,
  Circle, AlertCircle, XCircle, Save, Inbox, Search, Shield, Users, Pencil, Archive
} from "lucide-react";

interface ServiceInquiry {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  companyAddress: string;
  numberOfOfficers: number;
  serviceLocation: string;
  serviceDuration: string;
  additionalNotes?: string;
  submittedDate: string;
  status?: string;
  replied?: boolean;
  repliedAt?: string;
  replyMessage?: string;
  documentNotes?: string;
  sentToAdmin?: boolean;
}

interface GeneralInquiry {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
  submittedDate: string;
  status?: string;
  replied?: boolean;
  repliedAt?: string;
  replyMessage?: string;
}

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  NEW: { label: "New", color: "text-blue-800", bg: "bg-blue-100", icon: <Circle className="h-3 w-3" /> },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-800", bg: "bg-yellow-100", icon: <Clock className="h-3 w-3" /> },
  RESOLVED: { label: "Resolved", color: "text-green-800", bg: "bg-green-100", icon: <CheckCircle className="h-3 w-3" /> },
  CLOSED: { label: "Closed", color: "text-gray-800", bg: "bg-gray-200", icon: <XCircle className="h-3 w-3" /> },
};

const getStatusInfo = (status?: string) => statusConfig[status || "NEW"] || statusConfig["NEW"];

const OperationalInquiries = () => {
  const [serviceInquiries, setServiceInquiries] = useState<ServiceInquiry[]>([]);
  const [generalInquiries, setGeneralInquiries] = useState<GeneralInquiry[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [expandedGeneralId, setExpandedGeneralId] = useState<number | null>(null);

  // Sort
  const [serviceSortAsc, setServiceSortAsc] = useState(true);
  const [generalSortAsc, setGeneralSortAsc] = useState(true);

  // Reply modal state (shared for both tabs)
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ type: "service" | "general"; id: number; email: string; name: string; subject: string; message: string } | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);

  // Document modal state (service only)
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docInquiry, setDocInquiry] = useState<ServiceInquiry | null>(null);
  const [docNotes, setDocNotes] = useState("");
  const [docSaving, setDocSaving] = useState(false);

  // Status dropdown open
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

  // Filter state
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [generalFilter, setGeneralFilter] = useState<string>("ALL");

  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const fetchService = () => {
    fetch("/api/inquiries/service", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => { if (d && Array.isArray(d.data)) setServiceInquiries(d.data); })
      .catch(err => { console.error("Failed to load service inquiries:", err); });
  };

  const fetchGeneral = () => {
    fetch("/api/inquiries/general", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => { if (d && Array.isArray(d.data)) setGeneralInquiries(d.data); })
      .catch(err => { console.error("Failed to load general inquiries:", err); });
  };

  useEffect(() => {
    fetchService();
    fetchGeneral();
  }, []);

  // Sort by status priority
  const statusOrder: Record<string, number> = { NEW: 0, IN_PROGRESS: 1, RESOLVED: 2, CLOSED: 3 };

  const filteredService = serviceFilter === "ALL"
    ? serviceInquiries
    : serviceInquiries.filter(s => (s.status || "NEW") === serviceFilter);
  const sortedService = [...filteredService].sort((a, b) => {
    const diff = (statusOrder[a.status || "NEW"] ?? 4) - (statusOrder[b.status || "NEW"] ?? 4);
    return serviceSortAsc ? diff : -diff;
  });

  const filteredGeneral = generalFilter === "ALL"
    ? generalInquiries
    : generalInquiries.filter(g => (g.status || "NEW") === generalFilter);
  const sortedGeneral = [...filteredGeneral].sort((a, b) => {
    const diff = (statusOrder[a.status || "NEW"] ?? 4) - (statusOrder[b.status || "NEW"] ?? 4);
    return generalSortAsc ? diff : -diff;
  });

  // Reply handlers
  const openServiceReply = (si: ServiceInquiry) => {
    setReplyTarget({
      type: "service", id: si.id, email: si.email,
      name: si.contactPerson,
      subject: "Re: Service Inquiry - " + si.companyName,
      message: si.additionalNotes || `Service inquiry from ${si.companyName} requesting ${si.numberOfOfficers} officers at ${si.serviceLocation}.`,
    });
    setReplySubject("Re: Service Inquiry - " + si.companyName);
    setReplyMessage("");
    setReplyModalOpen(true);
  };

  const openGeneralReply = (gi: GeneralInquiry) => {
    setReplyTarget({
      type: "general", id: gi.id, email: gi.email,
      name: gi.fullName, subject: "Re: " + gi.subject, message: gi.message,
    });
    setReplySubject("Re: " + gi.subject);
    setReplyMessage("");
    setReplyModalOpen(true);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;
    setReplySending(true);
    try {
      const url = replyTarget.type === "service"
        ? `/api/inquiries/service/${replyTarget.id}/reply`
        : `/api/inquiries/general/${replyTarget.id}/reply`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ subject: replySubject, message: replyMessage }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      toast({ title: "Reply Sent", description: `Email reply sent to ${replyTarget.email}` });
      // If service inquiry reply, append to document notes
      if (replyTarget.type === "service") {
        const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        const replyEntry = `${now} — Reply sent:\nSubject: ${replySubject}\n${replyMessage}`;
        const si = serviceInquiries.find(s => s.id === replyTarget.id);
        const existingNotes = si?.documentNotes || "";
        const updatedNotes = existingNotes ? `${existingNotes}\n\n${replyEntry}` : replyEntry;
        await fetch(`/api/inquiries/service/${replyTarget.id}/document`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ notes: updatedNotes }),
        });
      }
      setReplyModalOpen(false);
      if (replyTarget.type === "service") fetchService(); else fetchGeneral();
    } catch {
      toast({ title: "Error", description: "Failed to send reply email", variant: "destructive" });
    } finally {
      setReplySending(false);
    }
  };

  // Status update
  const updateStatus = async (type: "service" | "general", id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/inquiries/${type}/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Status Updated", description: `Inquiry status changed to ${statusConfig[newStatus]?.label || newStatus}` });
      setStatusDropdownId(null);
      if (type === "service") fetchService(); else fetchGeneral();
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  // Document notes
  const openDocModal = (si: ServiceInquiry) => {
    setDocInquiry(si);
    setDocNotes(si.documentNotes || "");
    setDocModalOpen(true);
  };

  const handleSaveDocument = async () => {
    if (!docInquiry) return;
    setDocSaving(true);
    try {
      const res = await fetch(`/api/inquiries/service/${docInquiry.id}/document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ notes: docNotes }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Document Saved", description: "Document notes updated successfully." });
      setDocModalOpen(false);
      fetchService();
    } catch {
      toast({ title: "Error", description: "Failed to save document notes", variant: "destructive" });
    } finally {
      setDocSaving(false);
    }
  };

  const handleSendToAdmin = async () => {
    if (!docInquiry) return;
    // Save notes first, then send to admin
    setDocSaving(true);
    try {
      if (docNotes !== (docInquiry.documentNotes || "")) {
        await fetch(`/api/inquiries/service/${docInquiry.id}/document`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ notes: docNotes }),
        });
      }
      const res = await fetch(`/api/inquiries/service/${docInquiry.id}/send-to-admin`, {
        method: "PUT",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Sent to Administration", description: "Document has been sent to Director, Executive & Chairman portals." });
      setDocModalOpen(false);
      fetchService();
    } catch {
      toast({ title: "Error", description: "Failed to send document to administration", variant: "destructive" });
    } finally {
      setDocSaving(false);
    }
  };

  const handleCloseInquiry = async (type: "service" | "general", id: number) => {
    await updateStatus(type, id, "CLOSED");
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  // Status badge component
  const StatusBadge = ({ status, type, id }: { status?: string; type: "service" | "general"; id: number }) => {
    const info = getStatusInfo(status);
    const dropdownKey = `${type}-${id}`;
    const isOpen = statusDropdownId === dropdownKey;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setStatusDropdownId(isOpen ? null : dropdownKey); }}
          className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:opacity-80 transition ${info.bg} ${info.color}`}
        >
          {info.icon} {info.label}
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[140px] py-1">
            {STATUS_OPTIONS.map(opt => {
              const optInfo = statusConfig[opt];
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); updateStatus(type, id, opt); }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted transition ${
                    (status || "NEW") === opt ? "font-bold" : ""
                  }`}
                >
                  <span className={`${optInfo.bg} ${optInfo.color} p-0.5 rounded-full`}>{optInfo.icon}</span>
                  {optInfo.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = () => setStatusDropdownId(null);
    if (statusDropdownId) window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [statusDropdownId]);

  // Stats
  const serviceNew = serviceInquiries.filter(s => !s.status || s.status === "NEW").length;
  const serviceInProgress = serviceInquiries.filter(s => s.status === "IN_PROGRESS").length;
  const serviceClosed = serviceInquiries.filter(s => s.status === "CLOSED").length;
  const generalNew = generalInquiries.filter(g => !g.status || g.status === "NEW").length;
  const generalInProgress = generalInquiries.filter(g => g.status === "IN_PROGRESS").length;
  const generalClosed = generalInquiries.filter(g => g.status === "CLOSED").length;
  const generalPendingReply = generalInquiries.filter(g => !g.replied).length;

  const FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "NEW", label: "New" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative rounded-2xl overflow-hidden bg-[#1A1A1B] p-5 text-white shadow-xl">
        {/* Golden glow on right side */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#FFD700]/25 via-[#FFD700]/8 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#FFD700]/15 rounded-xl border border-[#FFD700]/20">
            <Inbox className="h-5 w-5 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Inquiry Management</h2>
            <p className="text-sm text-white/50">Review and respond to service and general inquiries</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-4 gap-3">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Building2 className="h-4 w-4 mx-auto mb-1.5 text-[#FFD700]" />
            <p className="text-xl font-bold">{serviceInquiries.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Service</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <MessageCircle className="h-4 w-4 mx-auto mb-1.5 text-green-400" />
            <p className="text-xl font-bold">{generalInquiries.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">General</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Circle className="h-4 w-4 mx-auto mb-1.5 text-amber-400" />
            <p className="text-xl font-bold">{serviceNew + generalNew}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">New</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <AlertCircle className="h-4 w-4 mx-auto mb-1.5 text-red-400" />
            <p className="text-xl font-bold">{generalPendingReply}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Pending Reply</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="service" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
          <TabsTrigger value="service" className="gap-2 text-sm font-bold">
            <Building2 className="h-4 w-4" /> Service Inquiries
            {serviceInquiries.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{serviceInquiries.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2 text-sm font-bold">
            <MessageCircle className="h-4 w-4" /> General Inquiries
            {generalInquiries.length > 0 && (
              <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{generalInquiries.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ======================== SERVICE INQUIRIES TAB ======================== */}
        <TabsContent value="service">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  Service Inquiries
                  <span className="text-sm font-normal text-muted-foreground">({serviceInquiries.length} total)</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setServiceSortAsc(!serviceSortAsc)} className="gap-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Sort by Status
                </Button>
              </CardTitle>
              {/* Filter pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setServiceFilter(f.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                      serviceFilter === f.value
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {f.label}
                    {f.value !== "ALL" && (
                      <span className="ml-1">
                        ({serviceInquiries.filter(s => (s.status || "NEW") === f.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {serviceInquiries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No service inquiries received yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedService.map(si => (
                    <div key={si.id} className={`border rounded-xl overflow-hidden ${si.replied ? "border-green-200" : ""}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedServiceId(prev => prev === si.id ? null : si.id)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-muted/40 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-foreground">{si.companyName}</span>
                          <StatusBadge status={si.status} type="service" id={si.id} />
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(si.submittedDate)}
                          </span>
                        </div>
                        {expandedServiceId === si.id
                          ? <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                      </button>

                      {expandedServiceId === si.id && (
                        <div className="p-5 bg-background">
                          {/* Action buttons */}
                          <div className="flex justify-end gap-2">
                            {si.status !== "CLOSED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCloseInquiry("service", si.id)}
                                className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-100"
                              >
                                <XCircle className="h-4 w-4" />
                                Close Inquiry
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDocModal(si)}
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openServiceReply(si)}
                              className="flex items-center gap-2"
                            >
                              <Reply className="h-4 w-4" />
                              {si.replied ? "Reply Again" : "Reply"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== GENERAL INQUIRIES TAB ======================== */}
        <TabsContent value="general">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </div>
                  General Inquiries
                  <span className="text-sm font-normal text-muted-foreground">({generalInquiries.length} total)</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setGeneralSortAsc(!generalSortAsc)} className="gap-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Sort by Status
                </Button>
              </CardTitle>
              {/* Filter pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setGeneralFilter(f.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                      generalFilter === f.value
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {f.label}
                    {f.value !== "ALL" && (
                      <span className="ml-1">
                        ({generalInquiries.filter(g => (g.status || "NEW") === f.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {generalInquiries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No general inquiries received yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedGeneral.map(gi => (
                    <div key={gi.id} className={`border rounded-xl overflow-hidden ${gi.replied ? "border-green-200" : ""}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedGeneralId(prev => prev === gi.id ? null : gi.id)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-muted/40 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <User className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-foreground">{gi.fullName}</span>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full max-w-[200px] truncate">
                            {gi.subject}
                          </span>
                          <StatusBadge status={gi.status} type="general" id={gi.id} />
                          {gi.replied ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Replied
                            </span>
                          ) : (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Pending Reply
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(gi.submittedDate)}
                          </span>
                        </div>
                        {expandedGeneralId === gi.id
                          ? <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                      </button>

                      {expandedGeneralId === gi.id && (
                        <div className="p-5 bg-background space-y-4">
                          {/* Contact info */}
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${gi.email}`} className="text-primary hover:underline">{gi.email}</a>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {gi.phoneNumber}
                            </span>
                          </div>

                          {/* Message */}
                          <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> Message
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{gi.message}</p>
                          </div>

                          {/* Reply history */}
                          {gi.replied && gi.replyMessage && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                                <Reply className="h-3 w-3" /> Your Reply
                                {gi.repliedAt && <span className="font-normal text-green-600 ml-2">({formatDate(gi.repliedAt)})</span>}
                              </p>
                              <p className="text-sm whitespace-pre-wrap text-green-900">{gi.replyMessage}</p>
                            </div>
                          )}

                          {/* Reply button */}
                          <div className="flex justify-end gap-2">
                            {gi.status !== "CLOSED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCloseInquiry("general", gi.id)}
                                className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-100"
                              >
                                <XCircle className="h-4 w-4" />
                                Close Inquiry
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => openGeneralReply(gi)}
                              className="flex items-center gap-2"
                            >
                              <Reply className="h-4 w-4" />
                              {gi.replied ? "Reply Again" : "Reply"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================== REPLY EMAIL MODAL ================== */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Reply to Inquiry
            </DialogTitle>
          </DialogHeader>

          {replyTarget && (
            <div className="space-y-4">
              {/* Email format header */}
              <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-12">To:</span>
                  <span className="text-foreground">{replyTarget.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-12">From:</span>
                  <span className="text-foreground">acefrontlines@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-12">Name:</span>
                  <span className="text-foreground">{replyTarget.name}</span>
                </div>
              </div>

              {/* Original message preview */}
              <div className="p-3 bg-muted/30 rounded-lg border text-sm">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Original Message:</p>
                <p className="text-xs text-muted-foreground italic line-clamp-3">{replyTarget.message}</p>
              </div>

              <form onSubmit={handleSendReply} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reply-subject" className="font-semibold">Subject</Label>
                  <Input
                    id="reply-subject"
                    value={replySubject}
                    onChange={e => setReplySubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reply-body" className="font-semibold">Reply Message</Label>
                  <Textarea
                    id="reply-body"
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    required
                    className="min-h-[160px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={replySending}>
                  <Send className="h-4 w-4 mr-2" />
                  {replySending ? "Sending..." : "Send Reply Email"}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================== DOCUMENT NOTES MODAL (SERVICE) ================== */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden rounded-2xl">
          {/* Top bar with breadcrumb */}
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
              <span>Dashboard</span>
              <ChevronRight className="h-3 w-3" />
              <span>Service Inquiries</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-600 font-medium">Request #SI-{docInquiry?.id}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#1A1A1B] tracking-tight">
                  Service Request #SI-{docInquiry?.id}
                </h2>
                {docInquiry && (() => {
                  const info = getStatusInfo(docInquiry.status);
                  return (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${info.bg} ${info.color}`}>
                      {info.label}
                    </span>
                  );
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("doc-notes-textarea");
                  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => el.focus(), 400); }
                }}
                className="flex items-center gap-1.5 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Notes
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Submitted by {docInquiry?.contactPerson} • {docInquiry?.submittedDate ? formatDate(docInquiry.submittedDate) : "—"}
            </p>
          </div>

          {docInquiry && (
            <div className="px-6 py-5 bg-[#FAFAFA] overflow-y-auto max-h-[70vh] space-y-5">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                {/* LEFT COLUMN — Client Information */}
                <div className="md:col-span-2 space-y-5">
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#1A1A1B] mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#FFD700]" />
                      Client Information
                    </h3>

                    <div className="space-y-3.5">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Company Name</p>
                        <p className="text-sm font-semibold text-[#1A1A1B]">{docInquiry.companyName}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Primary Contact</p>
                        <p className="text-sm font-semibold text-[#1A1A1B]">{docInquiry.contactPerson}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Details</p>
                        <div className="space-y-1.5">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {docInquiry.phoneNumber}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <a href={`mailto:${docInquiry.email}`} className="text-blue-600 hover:underline">{docInquiry.email}</a>
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                        <p className="text-sm text-gray-600">{docInquiry.companyAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Request History */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#1A1A1B] mb-4">Request History</h3>
                    <div className="relative pl-6 space-y-4">
                      {/* Timeline line */}
                      <div className="absolute left-[9px] top-1 bottom-1 w-[2px] bg-gray-200" />

                      {/* Request Received */}
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full bg-[#FFD700] border-2 border-white shadow-sm flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <p className="text-sm font-semibold text-[#1A1A1B]">Request Received</p>
                        <p className="text-xs text-gray-400">{formatDate(docInquiry.submittedDate)}</p>
                      </div>

                      {/* Reply status */}
                      <div className="relative">
                        <div className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                          docInquiry.replied ? "bg-emerald-500" : "bg-gray-300"
                        }`}>
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <p className="text-sm font-semibold text-[#1A1A1B]">Response</p>
                        <p className="text-xs text-gray-400">
                          {docInquiry.replied && docInquiry.repliedAt ? formatDate(docInquiry.repliedAt) : "Pending"}
                        </p>
                      </div>

                      {/* Document status */}
                      <div className="relative">
                        <div className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                          docInquiry.documentNotes ? "bg-emerald-500" : "bg-gray-300"
                        }`}>
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <p className="text-sm font-semibold text-[#1A1A1B]">Documentation</p>
                        <p className="text-xs text-gray-400">
                          {docInquiry.documentNotes ? "Notes recorded" : "Pending"}
                        </p>
                      </div>

                      {/* Sent to admin */}
                      <div className="relative">
                        <div className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                          docInquiry.sentToAdmin ? "bg-emerald-500" : "bg-gray-300"
                        }`}>
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <p className="text-sm font-semibold text-[#1A1A1B]">Sent to Administration</p>
                        <p className="text-xs text-gray-400">
                          {docInquiry.sentToAdmin ? "Delivered" : "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN — Service Requirements + Notes */}
                <div className="md:col-span-3 space-y-5">
                  {/* Service Requirements */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#1A1A1B] mb-4 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#FFD700]" />
                      Service Requirements
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#FFFDE7] rounded-xl p-4 border border-[#FFD700]/10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Officers Needed</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#FFD700]" />
                          <p className="text-sm font-bold text-[#1A1A1B]">{String(docInquiry.numberOfOfficers).padStart(2, "0")} Security Officers</p>
                        </div>
                      </div>

                      <div className="bg-[#FFFDE7] rounded-xl p-4 border border-[#FFD700]/10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#FFD700]" />
                          <p className="text-sm font-bold text-[#1A1A1B]">{docInquiry.serviceDuration}</p>
                        </div>
                      </div>

                      <div className="bg-[#FFFDE7] rounded-xl p-4 border border-[#FFD700]/10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Service Location</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#FFD700]" />
                          <p className="text-sm font-bold text-[#1A1A1B]">{docInquiry.serviceLocation}</p>
                        </div>
                      </div>

                      <div className="bg-[#FFFDE7] rounded-xl p-4 border border-[#FFD700]/10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Submitted Date</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#FFD700]" />
                          <p className="text-sm font-bold text-[#1A1A1B]">
                            {docInquiry.submittedDate ? new Date(docInquiry.submittedDate.replace(" ", "T")).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Message / Additional Notes */}
                  {docInquiry.additionalNotes && (
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-[#1A1A1B] mb-3 flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-[#FFD700] inline-block" />
                        Client Message
                      </h3>
                      <div className="bg-[#FAFAFA] rounded-lg border border-gray-100 p-4">
                        <p className="text-sm text-gray-600 italic leading-relaxed">"{docInquiry.additionalNotes}"</p>
                      </div>
                    </div>
                  )}

                  {/* Document Notes */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#1A1A1B] mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#FFD700]" />
                      Document Notes
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Use this space to keep ongoing notes for this service inquiry. Update it day by day as progress is made.
                    </p>
                    <Textarea
                      id="doc-notes-textarea"
                      value={docNotes}
                      onChange={e => setDocNotes(e.target.value)}
                      placeholder={"e.g.\n2026-02-28 — Initial contact made, awaiting site visit confirmation.\n2026-03-01 — Site visit completed, proposal sent.\n..."}
                      className="min-h-[180px] font-mono text-sm border-gray-200 focus:border-[#FFD700] focus:ring-[#FFD700]/20 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveDocument}
                    disabled={docSaving}
                    className="bg-[#FFD700] hover:bg-[#E6C200] text-[#1A1A1B] font-bold px-6 rounded-lg shadow-sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {docSaving ? "Saving..." : "SAVE DOCUMENT"}
                  </Button>
                  <Button
                    onClick={handleSendToAdmin}
                    variant="outline"
                    disabled={docSaving}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-5 rounded-lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {docInquiry.sentToAdmin ? "Resend to Admin" : "Send to Administration"}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setDocModalOpen(false)}
                  className="border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Close
                </Button>
              </div>

              {docInquiry.sentToAdmin && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5 justify-center pb-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Already sent to Director, Executive & Chairman
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationalInquiries;
