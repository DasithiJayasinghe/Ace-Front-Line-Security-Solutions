import { useEffect, useState, useMemo, useRef } from "react";
import { User, Briefcase, ChevronDown, ChevronRight, FileText, Mail, Phone, Download, Calendar, CheckCircle, Send, Clock, Search, Users, ClipboardList, Plus, Pencil, Filter, Trash2, Star, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Vacancy {
  id: number;
  jobTitle: string;
  description?: string;
  requirements?: string;
  experienceLevel?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  status?: string;
}

interface Application {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  vacancyId: number;
  vacancyTitle?: string;
  applicationStatus: string;
  cvFilePath?: string;
  certificateFilePath?: string;
}

interface CvSubmission {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  cvFilePath?: string;
  submittedDate?: string;
}

const OperationalCareers = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvSubmissions, setCvSubmissions] = useState<CvSubmission[]>([]);

  // vacancy status filter
  const [vacancyFilter, setVacancyFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  // selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // which vacancy is expanded in the pending section
  const [expandedVacancyId, setExpandedVacancyId] = useState<number | null>(null);

  // which vacancy is expanded in the shortlisted section
  const [expandedShortlistVacId, setExpandedShortlistVacId] = useState<number | null>(null);

  // which vacancy is expanded in the selected section
  const [expandedSelectedVacId, setExpandedSelectedVacId] = useState<number | null>(null);

  // selection for shortlisted interview scheduling
  const [shortlistSelectedIds, setShortlistSelectedIds] = useState<number[]>([]);

  // schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [expandedScheduleVacId, setExpandedScheduleVacId] = useState<number | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [selectedInterviewerRoles, setSelectedInterviewerRoles] = useState<string[]>([]);

  const INTERVIEWER_ROLES = [
    { value: "ACCOUNTANT", label: "Accountant" },
    { value: "AREA_MANAGER", label: "Area Manager" },
    { value: "CHAIRMAN", label: "Chairman" },
    { value: "DIRECTOR", label: "Director" },
    { value: "EXECUTIVE", label: "Executive" },
  ];

  const toggleInterviewerRole = (role: string) => {
    setSelectedInterviewerRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const [newVacancyTitle, setNewVacancyTitle] = useState("");
  const [newVacancyDescription, setNewVacancyDescription] = useState("");
  const [newVacancyLocation, setNewVacancyLocation] = useState("");
  const [newVacancyExperience, setNewVacancyExperience] = useState("");
  // salary fields no longer collected in UI
  const [newVacancyStatus, setNewVacancyStatus] = useState("OPEN");
  const [newVacancyRequirements, setNewVacancyRequirements] = useState("");

  // dropdown options for vacancy form
  const EXPERIENCE_OPTIONS = ["ENTRY", "INTERMEDIATE", "SENIOR", "EXPERT"];
  const STATUS_OPTIONS = ["OPEN", "CLOSED"];
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const openFileWithAuth = async (url: string) => {
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch file");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch {
      toast({ title: "Error", description: "Unable to open file.", variant: "destructive" });
    }
  };

  const fetchVacancies = () => {
    fetch("/api/vacancies", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => {
        if (d && Array.isArray(d.data)) setVacancies(d.data);
      })
      .catch(err => { console.error("Failed to load vacancies:", err); });
  };

  const fetchApplications = () => {
    fetch("/api/applications", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => {
        if (d && Array.isArray(d.data)) setApplications(d.data);
      })
      .catch(err => { console.error("Failed to load applications:", err); });
  };

  const fetchCvSubmissions = () => {
    fetch("/api/cv-submissions", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => {
        if (d && Array.isArray(d.data)) setCvSubmissions(d.data);
      })
      .catch(err => { console.error("Failed to load CV submissions:", err); });
  };

  useEffect(() => {
    fetchVacancies();
    fetchApplications();
    fetchCvSubmissions();
  }, []);

  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const vacancyFormRef = useRef<HTMLDivElement>(null);

  const handleAddVacancy = async () => {
    const payload: any = {
      jobTitle: newVacancyTitle,
      description: newVacancyDescription,
      requirements: newVacancyRequirements,
      location: newVacancyLocation,
      experienceLevel: newVacancyExperience,
      status: newVacancyStatus
    };
    const url = editingVacancy ? `/api/vacancies/${editingVacancy.id}` : "/api/vacancies";
    const method = editingVacancy ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.error("vacancy error", errData);
        throw new Error(errData?.message || "");
      }
      toast({ title: editingVacancy ? "Vacancy Updated" : "Vacancy Created", description: editingVacancy ? "Changes saved." : "New vacancy has been added." });
      setNewVacancyTitle("");
      setNewVacancyDescription("");
      setNewVacancyLocation("");
      setNewVacancyExperience("");
      // clear editing state if any
      setEditingVacancy(null);
      setNewVacancyStatus("OPEN");
      setNewVacancyRequirements("");
      fetchVacancies();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create vacancy", variant: "destructive" });
    }
  };

  // helper to enter edit mode for a vacancy
  const startEditVacancy = (v: Vacancy) => {
    setEditingVacancy(v);
    setNewVacancyTitle(v.jobTitle);
    setNewVacancyDescription(v.description || "");
    setNewVacancyLocation(v.location || "");
    setNewVacancyExperience(v.experienceLevel || "");
    setNewVacancyStatus(v.status || "OPEN");
    setNewVacancyRequirements(v.requirements || "");
    // scroll the form into view so user sees it
    setTimeout(() => {
      vacancyFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // helpers derived from applications
  const pendingApps = applications.filter(a => a.applicationStatus === "PENDING");
  const shortlistedApps = applications.filter(a => a.applicationStatus === "SHORTLISTED");
  const selectedApps = applications.filter(a => a.applicationStatus === "SELECTED");

  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleShortlistSelectId = (id: number) => {
    setShortlistSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bulkShortlist = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/applications/${id}/shortlist`, { method: "PUT", headers: authHeaders() })
        )
      );
      toast({ title: "Shortlisted", description: "Selected candidates have been shortlisted." });
      setSelectedIds([]);
      fetchApplications();
    } catch {
      toast({ title: "Error", description: "Failed to shortlist some candidates.", variant: "destructive" });
    }
  };

  const openScheduleModal = () => {
    setInterviewDate("");
    setInterviewTime("");
    setInterviewLocation("");
    setSelectedInterviewerRoles([]);
    setExpandedScheduleVacId(null);
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shortlistSelectedIds.length === 0) {
      toast({ title: "No candidates selected", description: "Please select at least one candidate.", variant: "destructive" });
      return;
    }
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/interviews/schedule-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          applicationIds: shortlistSelectedIds,
          interviewDate,
          interviewTime,
          interviewLocation,
          interviewerRoles: selectedInterviewerRoles,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to schedule");
      }
      // Send announcements to selected interviewer roles
      if (selectedInterviewerRoles.length > 0) {
        const vacancyIds = [...new Set(shortlistedApps.filter(a => shortlistSelectedIds.includes(a.id)).map(a => a.vacancyId))];
        const vacancyTitles = vacancyIds.map(vid => {
          const v = vacancies.find(vac => vac.id === vid);
          return v?.jobTitle || `Vacancy #${vid}`;
        }).join(", ");
        await fetch("/api/announcements/interview-scheduled", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            interviewerRoles: selectedInterviewerRoles,
            vacancyTitle: vacancyTitles,
            interviewDate,
            interviewTime,
            interviewLocation,
            numberOfInterviewees: shortlistSelectedIds.length,
          }),
        });
      }
      toast({
        title: "Interviews Scheduled",
        description: `${shortlistSelectedIds.length} invitation(s) sent successfully.${selectedInterviewerRoles.length > 0 ? " Interviewers notified." : ""}`,
      });
      setShortlistSelectedIds([]);
      fetchApplications();
      setScheduleModalOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Unable to schedule interview", variant: "destructive" });
    } finally {
      setScheduleLoading(false);
    }
  };

  // delete handler for closed vacancies
  const handleDeleteVacancy = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vacancy? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/vacancies/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      toast({ title: "Deleted", description: "Vacancy has been removed." });
      fetchVacancies();
    } catch {
      toast({ title: "Error", description: "Failed to delete vacancy", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="relative rounded-2xl overflow-hidden bg-[#1A1A1B] p-5 text-white shadow-xl">
        {/* Golden glow on right side */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#FFD700]/25 via-[#FFD700]/8 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#FFD700]/15 rounded-xl border border-[#FFD700]/20">
            <Briefcase className="h-5 w-5 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Recruitment Management</h2>
            <p className="text-sm text-white/50">Manage vacancies, applications, and hiring pipeline</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-5 gap-3">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <ClipboardList className="h-4 w-4 mx-auto mb-1.5 text-[#FFD700]" />
            <p className="text-xl font-bold">{vacancies.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Vacancies</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Clock className="h-4 w-4 mx-auto mb-1.5 text-amber-400" />
            <p className="text-xl font-bold">{pendingApps.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Pending</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Users className="h-4 w-4 mx-auto mb-1.5 text-purple-400" />
            <p className="text-xl font-bold">{shortlistedApps.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Shortlisted</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <CheckCircle className="h-4 w-4 mx-auto mb-1.5 text-emerald-400" />
            <p className="text-xl font-bold">{selectedApps.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Selected</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Send className="h-4 w-4 mx-auto mb-1.5 text-cyan-400" />
            <p className="text-xl font-bold">{cvSubmissions.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">CVs</p>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="vacancies" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="vacancies" className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg text-sm font-medium text-gray-500 transition-all">
            <Briefcase className="h-4 w-4 mr-1.5" /> Vacancies
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg text-sm font-medium text-gray-500 transition-all">
            <Users className="h-4 w-4 mr-1.5" /> Applications
          </TabsTrigger>
          <TabsTrigger value="cv-submissions" className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg text-sm font-medium text-gray-500 transition-all">
            <Send className="h-4 w-4 mr-1.5" /> CV Submissions
          </TabsTrigger>
        </TabsList>

      <TabsContent value="vacancies" className="space-y-4 mt-0">
      {/* published vacancies and creation/edit form */}
      <Card className="shadow-sm border-0 bg-white rounded-xl">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-[#FFD700]" />
            </div>
            Published Vacancies
            <span className="text-sm font-normal text-gray-400">({vacancyFilter === "ALL" ? vacancies.length : vacancies.filter(v => v.status === vacancyFilter).length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Sort / Filter bar */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#FFD700]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Filter:</span>
            {(["ALL", "OPEN", "CLOSED"] as const).map(f => (
              <Button
                key={f}
                size="sm"
                variant={vacancyFilter === f ? "default" : "outline"}
                className={vacancyFilter === f ? "bg-[#1A1A1B] hover:bg-[#2a2a2b] text-white text-xs h-7 px-4 rounded-full shadow-sm" : "text-xs h-7 px-4 rounded-full border-gray-200 text-gray-500 hover:bg-gray-50"}
                onClick={() => setVacancyFilter(f)}
              >
                {f === "ALL" ? "All" : f === "OPEN" ? "Open" : "Closed"}
              </Button>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacancies.filter(v => vacancyFilter === "ALL" || v.status === vacancyFilter).map(v => (
                <TableRow key={v.id} className="hover:bg-muted">
                  <TableCell>{v.id}</TableCell>
                  <TableCell>{v.jobTitle}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{v.location || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {v.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditVacancy(v)}
                        className="h-8 w-8 rounded-full bg-[#FFD700]/10 hover:bg-[#FFD700]/20 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#FFD700]" />
                      </button>
                      {v.status === "CLOSED" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVacancy(v.id)}
                          className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card ref={vacancyFormRef} className={`shadow-sm border-0 rounded-xl transition-all duration-500 ${editingVacancy ? "bg-[#FFFDE7] ring-2 ring-[#FFD700]/40" : "bg-white"}`}>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
              {editingVacancy ? <Pencil className="h-4 w-4 text-[#FFD700]" /> : <Star className="h-4 w-4 text-[#FFD700]" />}
            </div>
            {editingVacancy ? "Edit Vacancy" : "Post New Vacancy"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {/* vacancy form unchanged */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-title" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Job Title *</Label>
              <Input id="vacancy-title" value={newVacancyTitle} onChange={e => setNewVacancyTitle(e.target.value)} className="border-gray-200 focus:border-[#FFD700] focus:ring-[#FFD700]/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-desc" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Description *</Label>
              <Textarea id="vacancy-desc" value={newVacancyDescription} onChange={e => setNewVacancyDescription(e.target.value)} className="border-gray-200 focus:border-[#FFD700] focus:ring-[#FFD700]/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-location" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Location *</Label>
              <Input id="vacancy-location" value={newVacancyLocation} onChange={e => setNewVacancyLocation(e.target.value)} className="border-gray-200 focus:border-[#FFD700] focus:ring-[#FFD700]/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-experience" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Experience Level *</Label>
              <select
                id="vacancy-experience"
                className="w-full rounded-md border border-gray-200 input focus:border-[#FFD700] focus:ring-[#FFD700]/20"
                value={newVacancyExperience}
                onChange={e => setNewVacancyExperience(e.target.value)}
              >
                <option value="" disabled>Select level</option>
                {EXPERIENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-status" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status *</Label>
              <select
                id="vacancy-status"
                className="w-full rounded-md border border-gray-200 input focus:border-[#FFD700] focus:ring-[#FFD700]/20"
                value={newVacancyStatus}
                onChange={e => setNewVacancyStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="vacancy-requirements" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Requirements</Label>
              <Textarea id="vacancy-requirements" value={newVacancyRequirements} onChange={e => setNewVacancyRequirements(e.target.value)} className="border-gray-200 focus:border-[#FFD700] focus:ring-[#FFD700]/20" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleAddVacancy} className="bg-[#1A1A1B] hover:bg-[#2a2a2b] text-white px-6 rounded-lg shadow-sm">{editingVacancy ? "Save Changes" : "Create Vacancy"}</Button>
            {editingVacancy && (
              <Button variant="outline" className="border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg" onClick={() => {
                setEditingVacancy(null);
                setNewVacancyTitle("");
                setNewVacancyDescription("");
                setNewVacancyLocation("");
                setNewVacancyExperience("");
                setNewVacancyStatus("OPEN");
                setNewVacancyRequirements("");
              }}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="pipeline" className="space-y-4 mt-0">
      {/* pending applications grouped by vacancy */}
      <Card className="shadow-sm border-0 bg-white rounded-xl">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            Pending Review
            <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pendingApps.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {selectedIds.length > 0 && (
            <Button className="mb-4" onClick={bulkShortlist}>Shortlist Selected ({selectedIds.length})</Button>
          )}

          {/* group pending apps by vacancy */}
          {(() => {
            // build a map: vacancyId -> { title, apps[] }
            const grouped = new Map<number, { title: string; apps: typeof pendingApps }>();
            for (const app of pendingApps) {
              const vid = app.vacancyId;
              if (!grouped.has(vid)) {
                grouped.set(vid, {
                  title: app.vacancyTitle || `Vacancy #${vid}`,
                  apps: [],
                });
              }
              grouped.get(vid)!.apps.push(app);
            }

            if (grouped.size === 0) {
              return <p className="text-muted-foreground text-sm">No pending applications.</p>;
            }

            return (
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([vacId, { title, apps }]) => (
                  <div key={vacId} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                    {/* vacancy button */}
                    <button
                      type="button"
                      onClick={() => setExpandedVacancyId(prev => prev === vacId ? null : vacId)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                          <FolderOpen className="h-4.5 w-4.5 text-[#FFD700]" />
                        </div>
                        <span className="font-semibold text-[#1A1A1B]">{title}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {apps.length} applicant{apps.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedVacancyId === vacId ? "rotate-90" : ""}`} />
                    </button>

                    {/* expanded applicant details */}
                    {expandedVacancyId === vacId && (
                      <div className="p-4 space-y-2 bg-white border-t border-gray-100">
                        {apps.map(app => (
                          <div key={app.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                            {/* checkbox */}
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[#FFD700] rounded"
                              checked={selectedIds.includes(app.id)}
                              onChange={() => toggleSelectId(app.id)}
                            />
                            {/* applicant info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-semibold text-[#1A1A1B]">{app.fullName}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phoneNumber}</span>
                                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID: {app.id}</span>
                              </div>
                              {(app.cvFilePath || app.certificateFilePath) && (
                                <div className="flex gap-3 mt-1 text-xs">
                                  {app.cvFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/cv`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View CV
                                    </button>
                                  )}
                                  {app.certificateFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/certificate`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View Certificate
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* status badge */}
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              {app.applicationStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* shortlisted candidates grouped by vacancy */}
      <Card className="shadow-sm border-0 bg-white rounded-xl">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              Shortlisted Candidates
              <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">{shortlistedApps.length}</span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => openScheduleModal()}
              disabled={shortlistSelectedIds.length === 0}
              className="flex items-center gap-1.5 bg-[#1A1A1B] hover:bg-[#FFD700] hover:text-[#1A1A1B] text-white rounded-lg font-semibold"
            >
              <Calendar className="h-4 w-4" /> Schedule Interview {shortlistSelectedIds.length > 0 ? `(${shortlistSelectedIds.length})` : ""}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {(() => {
            const grouped = new Map<number, { title: string; apps: typeof shortlistedApps }>();
            for (const app of shortlistedApps) {
              const vid = app.vacancyId;
              if (!grouped.has(vid)) {
                grouped.set(vid, {
                  title: app.vacancyTitle || `Vacancy #${vid}`,
                  apps: [],
                });
              }
              grouped.get(vid)!.apps.push(app);
            }

            if (grouped.size === 0) {
              return <p className="text-muted-foreground text-sm">No shortlisted candidates.</p>;
            }

            const downloadCSV = (vacId: number, title: string, apps: typeof shortlistedApps) => {
              const header = "ID,Full Name,Email,Phone Number,Vacancy,Status";
              const rows = apps.map(a =>
                `${a.id},"${a.fullName}","${a.email}","${a.phoneNumber}","${a.vacancyTitle || a.vacancyId}","${a.applicationStatus}"`
              );
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `shortlisted_${title.replace(/\s+/g, "_")}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            };

            return (
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([vacId, { title, apps }]) => {
                  return (
                    <div key={vacId} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                      {/* vacancy button */}
                      <button
                        type="button"
                        onClick={() => setExpandedShortlistVacId(prev => prev === vacId ? null : vacId)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                            <FolderOpen className="h-4.5 w-4.5 text-purple-500" />
                          </div>
                          <span className="font-semibold text-[#1A1A1B]">{title}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            {apps.length} shortlisted
                          </span>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedShortlistVacId === vacId ? "rotate-90" : ""}`} />
                      </button>

                      {/* expanded shortlisted applicant details */}
                      {expandedShortlistVacId === vacId && (
                        <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                          {/* action bar */}
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadCSV(vacId, title, apps)}
                              className="flex items-center gap-1.5 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
                            >
                              <Download className="h-4 w-4" /> Download List
                            </Button>
                          </div>

                          {/* applicant cards */}
                          {apps.map(app => (
                            <div key={app.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-[#FFD700] rounded"
                                checked={shortlistSelectedIds.includes(app.id)}
                                onChange={() => toggleShortlistSelectId(app.id)}
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-semibold text-[#1A1A1B]">{app.fullName}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phoneNumber}</span>
                                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID: {app.id}</span>
                                </div>
                                {(app.cvFilePath || app.certificateFilePath) && (
                                  <div className="flex gap-3 mt-1 text-xs">
                                    {app.cvFilePath && (
                                      <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/cv`)}
                                        className="text-primary hover:underline flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> View CV
                                      </button>
                                    )}
                                    {app.certificateFilePath && (
                                      <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/certificate`)}
                                        className="text-primary hover:underline flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> View Certificate
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                {app.applicationStatus}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* selected candidates grouped by vacancy */}
      <Card className="shadow-sm border-0 bg-white rounded-xl">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            Selected Candidates
            <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{selectedApps.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {(() => {
            const grouped = new Map<number, { title: string; apps: typeof selectedApps }>();
            for (const app of selectedApps) {
              const vid = app.vacancyId;
              if (!grouped.has(vid)) {
                grouped.set(vid, {
                  title: app.vacancyTitle || `Vacancy #${vid}`,
                  apps: [],
                });
              }
              grouped.get(vid)!.apps.push(app);
            }

            if (grouped.size === 0) {
              return <p className="text-muted-foreground text-sm">No selected candidates yet.</p>;
            }

            const downloadSelectedCSV = (vacId: number, title: string, apps: typeof selectedApps) => {
              const header = "ID,Full Name,Email,Phone Number,Vacancy,Status";
              const rows = apps.map(a =>
                `${a.id},"${a.fullName}","${a.email}","${a.phoneNumber}","${a.vacancyTitle || a.vacancyId}","${a.applicationStatus}"`
              );
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `selected_${title.replace(/\s+/g, "_")}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            };

            return (
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([vacId, { title, apps }]) => (
                  <div key={vacId} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                    {/* vacancy button */}
                    <button
                      type="button"
                      onClick={() => setExpandedSelectedVacId(prev => prev === vacId ? null : vacId)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <FolderOpen className="h-4.5 w-4.5 text-emerald-500" />
                        </div>
                        <span className="font-semibold text-[#1A1A1B]">{title}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {apps.length} selected
                        </span>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedSelectedVacId === vacId ? "rotate-90" : ""}`} />
                    </button>

                    {/* expanded selected applicant details */}
                    {expandedSelectedVacId === vacId && (
                      <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadSelectedCSV(vacId, title, apps)}
                            className="flex items-center gap-1.5 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
                          >
                            <Download className="h-4 w-4" /> Download List
                          </Button>
                        </div>
                        {apps.map(app => (
                          <div key={app.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-semibold text-[#1A1A1B]">{app.fullName}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phoneNumber}</span>
                                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID: {app.id}</span>
                              </div>
                              {(app.cvFilePath || app.certificateFilePath) && (
                                <div className="flex gap-3 mt-1 text-xs">
                                  {app.cvFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/cv`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View CV
                                    </button>
                                  )}
                                  {app.certificateFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/certificate`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View Certificate
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              {app.applicationStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="cv-submissions" className="mt-0">
      {/* CV Submissions Section */}
      <Card className="shadow-sm border-0 bg-white rounded-xl">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Send className="h-4 w-4 text-cyan-500" />
            </div>
            CV Submissions
            <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold">{cvSubmissions.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {cvSubmissions.length === 0 ? (
            <p className="text-gray-400 text-sm">No CV submissions yet.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-3">{cvSubmissions.length} CV{cvSubmissions.length !== 1 ? "s" : ""} received</p>
              {cvSubmissions.map(cv => (
                <div key={cv.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-[#FFD700]" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-[#1A1A1B]">{cv.fullName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{cv.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{cv.phoneNumber}</span>
                      {cv.submittedDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(cv.submittedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    {cv.cvFilePath && (
                      <div className="flex gap-3 mt-1 text-xs">
                        <a
                          href={`/api/cv-submissions/${cv.id}/cv`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            const creds = sessionStorage.getItem("auth");
                            fetch(`/api/cv-submissions/${cv.id}/cv`, {
                              headers: creds ? { Authorization: `Basic ${creds}` } : {},
                            })
                              .then(r => {
                                if (!r.ok) throw new Error("Failed to load");
                                return r.blob();
                              })
                              .then(blob => {
                                const url = URL.createObjectURL(blob);
                                window.open(url, "_blank");
                              })
                              .catch(() => {
                                toast({ title: "Error", description: "Failed to load CV file", variant: "destructive" });
                              });
                          }}
                        >
                          <FileText className="h-3 w-3" /> View CV
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>
      </Tabs>

      {/* schedule interview modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#FFD700]" />
              Schedule Interview
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-5">
            {/* Candidate selection grouped by vacancy */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-[#FFD700]" />
                Select Candidates ({shortlistSelectedIds.length} selected)
              </Label>
              <p className="text-xs text-muted-foreground">
                Choose shortlisted candidates from one or more job vacancies
              </p>

              {(() => {
                const grouped = new Map<number, { title: string; apps: typeof shortlistedApps }>();
                for (const app of shortlistedApps) {
                  if (!grouped.has(app.vacancyId)) {
                    grouped.set(app.vacancyId, { title: app.vacancyTitle || `Vacancy #${app.vacancyId}`, apps: [] });
                  }
                  grouped.get(app.vacancyId)!.apps.push(app);
                }
                const groups = Array.from(grouped.entries());

                if (groups.length === 0) {
                  return (
                    <div className="p-6 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      No shortlisted candidates available.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto border rounded-xl p-2">
                    {groups.map(([vacId, { title, apps }]) => {
                      const allIds = apps.map(a => a.id);
                      const allChecked = allIds.length > 0 && allIds.every(id => shortlistSelectedIds.includes(id));
                      const someChecked = allIds.some(id => shortlistSelectedIds.includes(id));
                      const isExpanded = expandedScheduleVacId === vacId;

                      const toggleAllInVac = () => {
                        if (allChecked) {
                          setShortlistSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
                        } else {
                          setShortlistSelectedIds(prev => [...new Set([...prev, ...allIds])]);
                        }
                      };

                      return (
                        <div key={vacId} className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedScheduleVacId(prev => prev === vacId ? null : vacId)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#FFD700] rounded"
                              checked={allChecked}
                              ref={(el: HTMLInputElement | null) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                              onChange={(e) => { e.stopPropagation(); toggleAllInVac(); }}
                              onClick={e => e.stopPropagation()}
                            />
                            <Briefcase className="h-4 w-4 text-[#FFD700] flex-shrink-0" />
                            <span className="font-medium text-sm flex-1">{title}</span>
                            <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full border">
                              {apps.length} candidate{apps.length !== 1 ? "s" : ""}
                            </span>
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            }
                          </button>

                          {isExpanded && (
                            <div className="divide-y">
                              {apps.map(app => (
                                <label
                                  key={app.id}
                                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                    shortlistSelectedIds.includes(app.id) ? "bg-[#FFD700]/5" : "hover:bg-muted/20"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-[#FFD700] rounded"
                                    checked={shortlistSelectedIds.includes(app.id)}
                                    onChange={() => toggleShortlistSelectId(app.id)}
                                  />
                                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{app.fullName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                                  </div>
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium uppercase">
                                    Shortlisted
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="interview-date" className="text-sm font-medium">Date</Label>
                <Input id="interview-date" type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interview-time" className="text-sm font-medium">Time</Label>
                <Input id="interview-time" type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} required />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="interview-location" className="text-sm font-medium">Location</Label>
              <Input id="interview-location" placeholder="e.g. Head Office, Board Room 2" value={interviewLocation} onChange={e => setInterviewLocation(e.target.value)} required />
            </div>

            {/* Interviewer selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Interviewers (optional)</Label>
              <p className="text-xs text-muted-foreground">Choose officers who will participate in this interview</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTERVIEWER_ROLES.map(role => (
                  <label key={role.value} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedInterviewerRoles.includes(role.value) ? "bg-[#FFD700]/10 border-[#FFD700]" : "hover:bg-muted/50"
                  }`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#FFD700]"
                      checked={selectedInterviewerRoles.includes(role.value)}
                      onChange={() => toggleInterviewerRole(role.value)}
                    />
                    <span className="text-sm font-medium">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            {shortlistSelectedIds.length > 0 && (
              <div className="p-3 bg-[#FFD700]/5 rounded-lg border border-[#FFD700]/20 text-sm">
                <p className="font-medium text-[#1A1A1B]">
                  <CheckCircle className="h-4 w-4 inline mr-1 text-[#FFD700]" />
                  {shortlistSelectedIds.length} candidate{shortlistSelectedIds.length !== 1 ? "s" : ""} from{" "}
                  {new Set(shortlistedApps.filter(a => shortlistSelectedIds.includes(a.id)).map(a => a.vacancyId)).size} vacancy
                  {new Set(shortlistedApps.filter(a => shortlistSelectedIds.includes(a.id)).map(a => a.vacancyId)).size !== 1 ? " positions" : ""} will receive interview invitations
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={scheduleLoading || shortlistSelectedIds.length === 0}
              className="w-full bg-[#1A1A1B] hover:bg-[#FFD700] hover:text-[#1A1A1B] text-white font-semibold h-11"
            >
              {scheduleLoading ? "Scheduling..." : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule & Send {shortlistSelectedIds.length > 0 ? `${shortlistSelectedIds.length} Invitation${shortlistSelectedIds.length !== 1 ? "s" : ""}` : "Invitations"}
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationalCareers;
