import { useEffect, useState } from "react";
import {
  Building2, FileText, Calendar, MapPin, User, Mail, Phone, Clock,
  ChevronDown, ChevronRight, CheckCircle, Reply, Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "text-blue-800", bg: "bg-blue-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-800", bg: "bg-yellow-100" },
  RESOLVED: { label: "Resolved", color: "text-green-800", bg: "bg-green-100" },
  CLOSED: { label: "Closed", color: "text-gray-800", bg: "bg-gray-200" },
};

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const fetchInquiries = () => {
    fetch("/api/inquiries/admin/service-documents", { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((d) => {
        if (d && Array.isArray(d.data)) setInquiries(d.data);
      })
      .catch((err) => console.error("Failed to load admin inquiries:", err));
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B] p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Inquiry Documents</h2>
            <p className="text-sm text-white/60">
              Service inquiry documents shared by the Operational Manager
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3.5 text-center border border-white/5">
            <Building2 className="h-5 w-5 mx-auto mb-1.5 text-blue-300" />
            <p className="text-2xl font-bold">{inquiries.length}</p>
            <p className="text-[11px] text-white/50 uppercase tracking-wider">Total Documents</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3.5 text-center border border-white/5">
            <Clock className="h-5 w-5 mx-auto mb-1.5 text-amber-300" />
            <p className="text-2xl font-bold">
              {inquiries.filter((i) => i.status === "IN_PROGRESS" || i.status === "NEW").length}
            </p>
            <p className="text-[11px] text-white/50 uppercase tracking-wider">Active</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3.5 text-center border border-white/5">
            <CheckCircle className="h-5 w-5 mx-auto mb-1.5 text-green-300" />
            <p className="text-2xl font-bold">
              {inquiries.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length}
            </p>
            <p className="text-[11px] text-white/50 uppercase tracking-wider">Resolved / Closed</p>
          </div>
        </div>
      </div>

      {/* Inquiry Documents */}
      {inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No inquiry documents shared yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Documents will appear here once the Operational Manager sends them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((si) => {
            const statusInfo = statusConfig[si.status || "NEW"] || statusConfig["NEW"];
            return (
              <Card
                key={si.id}
                className="shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId((prev) => (prev === si.id ? null : si.id))}
                  className="w-full flex items-center justify-between px-5 py-4 bg-muted/40 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-foreground">{si.companyName}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {si.numberOfOfficers} officers
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {si.serviceDuration}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(si.submittedDate)}
                    </span>
                  </div>
                  {expandedId === si.id ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {expandedId === si.id && (
                  <CardContent className="pt-4 pb-5 space-y-4">
                    {/* Contact details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Contact:</span>
                          <span>{si.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Email:</span>
                          <span className="text-primary">{si.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Phone:</span>
                          <span>{si.phoneNumber}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">Company Address:</span>
                            <p className="text-muted-foreground">{si.companyAddress}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Service Location:</span>
                          <span>{si.serviceLocation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Officers Needed:</span>
                          <span>{si.numberOfOfficers}</span>
                        </div>
                      </div>
                    </div>

                    {si.additionalNotes && (
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Additional Notes
                        </p>
                        <p className="text-sm">{si.additionalNotes}</p>
                      </div>
                    )}

                    {/* Document Notes — the main focus */}
                    {si.documentNotes && (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> Operations Document Notes
                        </p>
                        <p className="text-sm whitespace-pre-wrap text-amber-900 font-mono">
                          {si.documentNotes}
                        </p>
                      </div>
                    )}

                    {/* Reply history */}
                    {si.replied && si.replyMessage && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                          <Reply className="h-3 w-3" /> Reply Sent
                          {si.repliedAt && (
                            <span className="font-normal text-green-600 ml-2">
                              ({formatDate(si.repliedAt)})
                            </span>
                          )}
                        </p>
                        <p className="text-sm whitespace-pre-wrap text-green-900">
                          {si.replyMessage}
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
