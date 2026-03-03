import { useState } from "react";
import { clientApi } from "@/lib/api";
import type { SuccessData } from "@/types/client";

interface ClientRegistrationProps {
    onBack: () => void;
    onSuccess: (data: SuccessData) => void;
}

type RegisterForm = {
    companyName: string;
    companyRegistrationNo: string;
    vatNumber: string;
    industryType: string;
    address: string;
    serviceLocation: string;
    city: string;
    contactPersonName: string;
    contactPersonDesignation: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    serviceStartDate: string;
    contractDurationMonths: string;
    oicCount: string;
    jsoCount: string;
    oicRatePerShift: string;
    jsoRatePerShift: string;
    otRatePerHour: string;
    oicOtRatePerHour: string;
    jsoOtRatePerHour: string;
    riskLevel: string;
    recommendedOfficers: string;
};

const emptyForm: RegisterForm = {
    companyName: "", companyRegistrationNo: "", vatNumber: "", industryType: "",
    address: "", serviceLocation: "", city: "",
    contactPersonName: "", contactPersonDesignation: "", contactPersonEmail: "", contactPersonPhone: "",
    serviceStartDate: "", contractDurationMonths: "12",
    oicCount: "0", jsoCount: "0", oicRatePerShift: "0", jsoRatePerShift: "0", otRatePerHour: "0",
    oicOtRatePerHour: "0", jsoOtRatePerHour: "0",
    riskLevel: "LOW", recommendedOfficers: "",
};

const TABS = [
    { label: "Company Info", icon: "business",  sectionId: "section-company" },
    { label: "Contact",      icon: "person",    sectionId: "section-contact" },
    { label: "Deployment",   icon: "location_on", sectionId: "section-deployment" },
    { label: "Rates",        icon: "payments",  sectionId: "section-rates" },
    { label: "AI Risk",      icon: "shield",    sectionId: "section-ai-risk" },
];

const ClientRegistration = ({ onBack, onSuccess }: ClientRegistrationProps) => {
    const [activeTab, setActiveTab] = useState(0);
    const [form, setForm] = useState<RegisterForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setFormError("");
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setFormError("");
        try {
            const data = await clientApi.register({
                ...form,
                contractDurationMonths: Number(form.contractDurationMonths),
                oicCount: Number(form.oicCount),
                jsoCount: Number(form.jsoCount),
                oicRatePerShift: Number(form.oicRatePerShift),
                jsoRatePerShift: Number(form.jsoRatePerShift),
                otRatePerHour: Number(form.otRatePerHour),
                oicOtRatePerHour: Number(form.oicOtRatePerHour),
                jsoOtRatePerHour: Number(form.jsoOtRatePerHour),
                recommendedOfficers: Number(form.recommendedOfficers),
            });
            onSuccess({
                companyName: data.companyName,
                username: data.username,
                temporaryPassword: data.temporaryPassword,
                contactPersonEmail: data.contactPersonEmail,
            });
        } catch (e: any) {
            setFormError(e?.message || "Registration failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full border border-input bg-muted/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
    const labelClass = "block text-xs font-bold text-foreground mb-1.5";

    // Risk score mock
    const riskScore = form.riskLevel === "LOW" ? 25 : form.riskLevel === "MEDIUM" ? 64 : form.riskLevel === "HIGH" ? 82 : 95;
    const riskLabel = form.riskLevel === "LOW" ? "LOW RISK" : form.riskLevel === "MEDIUM" ? "MEDIUM RISK" : form.riskLevel === "HIGH" ? "HIGH RISK" : "CRITICAL";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight">Client Registration</h1>
                <p className="text-muted-foreground mt-1">Onboard a new corporate partner to the security management ecosystem.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {TABS.map((tab, i) => (
                    <button
                        key={tab.label}
                        onClick={() => {
                            setActiveTab(i);
                            document.getElementById(tab.sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                            i === activeTab
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-card border text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {formError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                    ⚠ {formError}
                </div>
            )}

            {/* All sections rendered, scroll-style single page like screen-3 */}
            <div className="space-y-8">
                {/* Company Info */}
                <section id="section-company" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Company Name</label>
                            <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Global Tech Solutions" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Registration Number</label>
                            <input name="companyRegistrationNo" value={form.companyRegistrationNo} onChange={handleChange} placeholder="CR-2024-XXXX" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>VAT Number</label>
                            <input name="vatNumber" value={form.vatNumber} onChange={handleChange} placeholder="VAT-123456789" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Industry Type</label>
                            <select name="industryType" value={form.industryType} onChange={handleChange} className={inputClass}>
                                <option value="">Select industry...</option>
                                <option>Banking & Finance</option>
                                <option>Commercial Real Estate</option>
                                <option>Retail & Supermarkets</option>
                                <option>Manufacturing</option>
                                <option>Healthcare</option>
                                <option>Hospitality & Hotels</option>
                                <option>Logistics & Warehousing</option>
                                <option>Construction</option>
                                <option>Technology</option>
                                <option>Government</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Registered Address</label>
                            <textarea name="address" value={form.address} onChange={handleChange} placeholder="Enter full legal address" rows={3} className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section id="section-contact" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Full Name</label>
                            <input name="contactPersonName" value={form.contactPersonName} onChange={handleChange} placeholder="Enter contact name" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Designation</label>
                            <input name="contactPersonDesignation" value={form.contactPersonDesignation} onChange={handleChange} placeholder="e.g. Facilities Manager" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input name="contactPersonEmail" type="email" value={form.contactPersonEmail} onChange={handleChange} placeholder="email@company.com" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <input name="contactPersonPhone" value={form.contactPersonPhone} onChange={handleChange} placeholder="+1 (555) 000-0000" className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* Deployment */}
                <section id="section-deployment" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Service Location (Deployment Address)</label>
                            <input name="serviceLocation" value={form.serviceLocation} onChange={handleChange} placeholder="Physical deployment address" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>City</label>
                            <input name="city" value={form.city} onChange={handleChange} placeholder="City name" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Service Start Date</label>
                            <input name="serviceStartDate" type="date" value={form.serviceStartDate} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Contract Duration (Months)</label>
                            <input name="contractDurationMonths" type="number" min="1" value={form.contractDurationMonths} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* Staffing & Rates */}
                <section id="section-rates" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className={labelClass}>OIC Count</label>
                            <input name="oicCount" type="number" min="0" value={form.oicCount} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>OIC Rate (Per Shift)</label>
                            <input name="oicRatePerShift" type="number" min="0" step="0.01" value={form.oicRatePerShift} onChange={handleChange} placeholder="$ 0.00" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>JSO Count</label>
                            <input name="jsoCount" type="number" min="0" value={form.jsoCount} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>JSO Rate (Per Shift)</label>
                            <input name="jsoRatePerShift" type="number" min="0" step="0.01" value={form.jsoRatePerShift} onChange={handleChange} placeholder="$ 0.00" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>OIC OT Rate (Per Hour)</label>
                            <input name="oicOtRatePerHour" type="number" min="0" step="0.01" value={form.oicOtRatePerHour} onChange={handleChange} placeholder="Rs. 0.00" className={inputClass} />
                            <p className="text-xs text-muted-foreground mt-1">Overtime rate for Officer-in-Charge</p>
                        </div>
                        <div>
                            <label className={labelClass}>JSO OT Rate (Per Hour)</label>
                            <input name="jsoOtRatePerHour" type="number" min="0" step="0.01" value={form.jsoOtRatePerHour} onChange={handleChange} placeholder="Rs. 0.00" className={inputClass} />
                            <p className="text-xs text-muted-foreground mt-1">Overtime rate for Junior Security Officer</p>
                        </div>
                    </div>
                </section>

                {/* AI Risk */}
                <section id="section-ai-risk" className="bg-accent rounded-2xl border border-primary/20 shadow-sm p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">shield</span>
                        AI Risk Integration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Risk gauge card */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calculated Risk Level</p>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    riskScore < 40 ? "bg-emerald-100 text-emerald-700" :
                                        riskScore < 70 ? "bg-amber-100 text-amber-700" :
                                            riskScore < 90 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                }`}>
                  {riskLabel}
                </span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black">{riskScore}</span>
                                <span className="text-muted-foreground mb-1">/ 100</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        riskScore < 40 ? "bg-emerald-500" : riskScore < 70 ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${riskScore}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground italic">*Based on industry type and location historical data.</p>

                            {/* Hidden select for riskLevel */}
                            <select name="riskLevel" value={form.riskLevel} onChange={handleChange} className={inputClass}>
                                <option value="LOW">Low Risk</option>
                                <option value="MEDIUM">Medium Risk</option>
                                <option value="HIGH">High Risk</option>
                                <option value="CRITICAL">Critical Risk</option>
                            </select>
                        </div>

                        {/* Recommended officers */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recommended Officers</p>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">OICs (Level 3+)</span>
                                    <span className="font-bold text-primary">{String(Number(form.oicCount) || 2).padStart(2, "0")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">JSOs (Standard)</span>
                                    <span className="font-bold text-primary">{String(Number(form.jsoCount) || 6).padStart(2, "0")}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between">
                                    <span className="text-sm font-semibold">Total Staffing</span>
                                    <span className="text-2xl font-black">
                    {String((Number(form.oicCount) || 0) + (Number(form.jsoCount) || 0)).padStart(2, "0")}
                  </span>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Override Recommended Officers</label>
                                <input name="recommendedOfficers" type="number" min="1" value={form.recommendedOfficers} onChange={handleChange} placeholder="e.g. 8" className={inputClass} />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-4 pb-8">
                <button onClick={onBack} className="px-6 py-3 border rounded-xl font-semibold text-sm hover:bg-muted transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold px-8 py-3 rounded-xl transition-colors text-sm disabled:opacity-60 shadow-lg"
                >
                    {submitting ? "Registering..." : "Register Client"}
                </button>
            </div>
        </div>
    );
};

export default ClientRegistration;
