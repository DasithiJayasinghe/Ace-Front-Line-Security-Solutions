import { useState } from "react";
import { Role, Sex, ADMIN_ROLES } from "@/data/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { UserPlus, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";

interface AdminRegistrationProps {
  onBack?: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

export default function AdminRegistration({ onBack }: AdminRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSex, setSelectedSex] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [assignedArea, setAssignedArea] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    try {
      const form = e.currentTarget;
      const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value || "";

      if (!selectedRole) {
        setFieldErrors({ role: "Please select a role" });
        setLoading(false);
        return;
      }

      if (selectedRole === "AREA_MANAGER" && !assignedArea.trim()) {
        setFieldErrors({ assignedArea: "Please enter an assigned area for the Area Manager" });
        setLoading(false);
        return;
      }

      // For all roles, always send email
      const isSimplifiedRole = selectedRole === "CHAIRMAN" || selectedRole === "DIRECTOR";

      const data = {
        username: get("username"),
        password: get("password"),
        role: selectedRole,
        fullName: get("fullName"),
        nicNumber: isSimplifiedRole ? undefined : get("nicNumber"),
        sex: isSimplifiedRole ? undefined : (selectedSex || undefined),
        email: get("email"),
        mobileNumber: isSimplifiedRole ? undefined : get("mobileNumber"),
        dateOfBirth: isSimplifiedRole ? undefined : (get("dateOfBirth") || undefined),
        emergencyContact: isSimplifiedRole ? undefined : (get("emergencyContact") || undefined),
        emergencyContactPersonName: isSimplifiedRole ? undefined : (get("emergencyContactPersonName") || undefined),
        bloodGroup: isSimplifiedRole ? undefined : (selectedBloodGroup || undefined),
        residentialAddress: isSimplifiedRole ? undefined : (get("residentialAddress") || undefined),
        basicSalary: isSimplifiedRole ? undefined : (get("basicSalary") ? Number(get("basicSalary")) : undefined),
        assignedArea: selectedRole === "AREA_MANAGER" ? assignedArea.trim() : undefined,
        adminPosition: isSimplifiedRole ? undefined : (get("adminPosition") || undefined),
        professionalCertificate: isSimplifiedRole ? undefined : (get("professionalCertificate") || undefined),
        joinDate: isSimplifiedRole ? undefined : (get("joinDate") || undefined),
        specialSkills: isSimplifiedRole ? undefined : (get("specialSkills") || undefined),
        bankName: isSimplifiedRole ? undefined : (get("bankName") || undefined),
        bankAccountNumber: isSimplifiedRole ? undefined : (get("bankAccountNumber") || undefined),
        bankBranch: isSimplifiedRole ? undefined : (get("bankBranch") || undefined),
      };

      await authService.registerUser(data, photo || undefined);
      toast.success("Admin registered successfully! They can now log in with the provided credentials.");
      form.reset();
      setSelectedRole("");
      setSelectedSex("");
      setSelectedBloodGroup("");
      setPhoto(null);
      setAssignedArea("");
    } catch (err: any) {
      // Prefer structured field errors from API (via authService)
      const errors: FieldErrors = {};
      if (err?.fieldErrors && typeof err.fieldErrors === "object") {
        Object.assign(errors, err.fieldErrors);
      }

      // Fallback text error parsing
      const errorMessage = err.message || "Registration failed";
      if (Object.keys(errors).length === 0) {
        // Parse validation message text (legacy support)
        if (errorMessage.includes("Field validation errors:") || errorMessage.includes("validation errors")) {
          const match = errorMessage.match(/(?:Field\s+)?validation errors:?\s*(.*)/i);
          if (match) {
            const errorStr = match[1];
            const fieldPairs = errorStr.split(/[,;]/);
            fieldPairs.forEach(pair => {
              const [field, ...messageParts] = pair.trim().split(":");
              if (field && messageParts.length > 0) {
                errors[field.trim()] = messageParts.join(":").trim();
              }
            });
          }
        }

        if (Object.keys(errors).length === 0) {
          const errorMappings: Record<string, string[]> = {
            username: ["username", "user", "login"],
            password: ["password", "pwd"],
            email: ["email", "mail"],
            fullName: ["fullname", "name", "full_name"],
            nicNumber: ["nic", "nicer", "ic_number"],
            mobileNumber: ["mobile", "phone", "contact"],
            emergencyContact: ["emergency"],
          };
          let identified = false;
          for (const [field, keywords] of Object.entries(errorMappings)) {
            if (keywords.some(kw => errorMessage.toLowerCase().includes(kw))) {
              errors[field] = errorMessage;
              identified = true;
              break;
            }
          }
          if (!identified) {
            errors.general = errorMessage;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        const errorMessages = Object.values(errors).join("\n");
        toast.error(errorMessages);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        {onBack ? (
          <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        )}
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <UserPlus className="h-5 w-5" />
          </div>
          Admin Registration
        </h1>
        <p className="text-muted-foreground mt-1">Register new administration staff member</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Errors */}
        {fieldErrors.general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fieldErrors.general}</AlertDescription>
          </Alert>
        )}

        {/* Login Credentials */}
        <Section title="Login Credentials">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Username" name="username" required error={fieldErrors.username} />
            <Field label="Password" name="password" type="password" required error={fieldErrors.password} />
            <Field label="Full Name" name="fullName" required error={fieldErrors.fullName} />
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select required value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className={fieldErrors.role ? "border-destructive" : ""}><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.role && <p className="text-xs text-destructive">{fieldErrors.role}</p>}
            </div>
          </div>
          {selectedRole === "AREA_MANAGER" && (
            <div className="mt-4 space-y-2">
              <Label>Assigned Area <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Colombo North, Kandy Central"
                value={assignedArea}
                onChange={(e) => setAssignedArea(e.target.value)}
                required
                className={fieldErrors.assignedArea ? "border-destructive" : ""}
              />
              {fieldErrors.assignedArea && <p className="text-xs text-destructive">{fieldErrors.assignedArea}</p>}
              <p className="text-xs text-muted-foreground">The geographical area this manager will oversee</p>
            </div>
          )}
        </Section>

        {/* Personal Information */}
        <Section title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <Field label="NIC Number" name="nicNumber" required error={fieldErrors.nicNumber} />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" ? (
              <div className="space-y-2">
                <Label>Sex <span className="text-destructive">*</span></Label>
                <Select required value={selectedSex} onValueChange={setSelectedSex}>
                  <SelectTrigger className={fieldErrors.sex ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {Object.values(Sex).map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.sex && <p className="text-xs text-destructive">{fieldErrors.sex}</p>}
              </div>
            ) : null}
            <Field label="Email" name="email" type="email" required error={fieldErrors.email} />
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <Field label="Mobile Number" name="mobileNumber" required error={fieldErrors.mobileNumber} />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <Field label="Date of Birth" name="dateOfBirth" type="date" required error={fieldErrors.dateOfBirth} />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" ? (
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <Field label="Emergency Contact Number" name="emergencyContact" required error={fieldErrors.emergencyContact} />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <Field label="Emergency Contact Person Name" name="emergencyContactPersonName" required error={fieldErrors.emergencyContactPersonName} />
            )}
          </div>
          {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" ? (
            <div className="mt-4 space-y-2">
              <Label>Residential Address <span className="text-destructive">*</span></Label>
              <Textarea name="residentialAddress" className={`mt-2 ${fieldErrors.residentialAddress ? "border-destructive" : ""}`} required />
              {fieldErrors.residentialAddress && <p className="text-xs text-destructive">{fieldErrors.residentialAddress}</p>}
            </div>
          ) : null}
        </Section>

        {/* Professional Details */}
        {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
        <Section title="Professional Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Admin Position" name="adminPosition" error={fieldErrors.adminPosition} />
            <Field label="Professional Certificate" name="professionalCertificate" error={fieldErrors.professionalCertificate} />
            <Field label="Join Date" name="joinDate" type="date" error={fieldErrors.joinDate} />
            <Field label="Basic Salary" name="basicSalary" type="number" error={fieldErrors.basicSalary} />
            <Field label="Special Skills" name="specialSkills" error={fieldErrors.specialSkills} />
          </div>
        </Section>
        )}

        {/* Bank Details */}
        {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
        <Section title="Bank Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bank Name" name="bankName" error={fieldErrors.bankName} />
            <Field label="Account Number" name="bankAccountNumber" error={fieldErrors.bankAccountNumber} />
            <Field label="Branch" name="bankBranch" error={fieldErrors.bankBranch} />
          </div>
        </Section>
        )}

        {/* Photo Upload */}
        {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
        <Section title="Photo">
          <Input type="file" accept="image/*" className="max-w-sm" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </Section>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? "Registering..." : `Register ${selectedRole ? selectedRole.replace(/_/g, " ") : "Admin"}`}
          </Button>
          <Button type="reset" variant="outline">Reset</Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground border-b border-border pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, name, type = "text", required = false, error }: { label: string; name: string; type?: string; required?: boolean; error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Input 
        id={name} 
        name={name} 
        type={type} 
        required={required}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
