import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, ChevronDown, Upload, X, Briefcase, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo.png";
import heroImage from "@/assets/hero-security.jpg";

const jobPositions = [
  {
    id: "junior-officer",
    title: "Junior Security Officer",
    icon: Shield,
    requirements: [
      "G.C.E. O/L qualification or above",
      "Age between 18–35 years",
      "No criminal record",
      "Physically fit and healthy",
      "Ability to work shifts (day/night)",
    ],
    experience: "No prior experience required – full training provided",
  },
  {
    id: "security-officer",
    title: "Security Officer",
    icon: Briefcase,
    requirements: [
      "G.C.E. O/L or A/L qualification",
      "Minimum 1 year experience in security or related field",
      "Good communication and observation skills",
      "Clean police report",
      "Willingness to be deployed island-wide",
    ],
    experience: "1–3 years of security or military/police experience preferred",
  },
  {
    id: "officer-in-charge",
    title: "Officer in Charge",
    icon: Award,
    requirements: [
      "G.C.E. A/L or higher qualification",
      "Minimum 3 years in a supervisory security role",
      "Strong leadership and decision-making skills",
      "Excellent report writing and communication",
      "Knowledge of security systems and protocols",
    ],
    experience: "3–5+ years of experience with proven leadership in security operations",
  },
];

const Careers = () => {
  const [selectedJob, setSelectedJob] = useState<typeof jobPositions[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const vacanciesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleApply = (job: typeof jobPositions[0]) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
    setCvFile(null);
    setCertFile(null);
  };

  const scrollToVacancies = () => {
    vacanciesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Application Submitted",
      description: `Your application for ${selectedJob?.title} has been received. We'll contact you soon.`,
    });
    setIsDialogOpen(false);
    setSelectedJob(null);
    setCvFile(null);
    setCertFile(null);
  };

  return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-card/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <img src={logoImage} alt="Ace Front Line Logo" className="h-10 w-10 rounded-full" />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-extrabold tracking-tight uppercase text-foreground">Ace Front Line</span>
                  <span className="text-[10px] tracking-[0.2em] font-medium text-muted-foreground uppercase">Security Solutions</span>
                </div>
              </Link>
              <Button variant="outline" size="sm" asChild>
                <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="Security team" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-accent/80" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Now Hiring</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-accent-foreground mb-6 tracking-tight">
              Join Our Security Team
            </h1>
            <p className="text-lg md:text-xl text-accent-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Be part of Sri Lanka's trusted private security provider. We offer professional training,
              career growth, and the opportunity to protect what matters most.
            </p>
            <Button variant="hero" size="xl" onClick={scrollToVacancies}>
              View Vacancies <ChevronDown className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </section>

        {/* Vacancies Section */}
        <section ref={vacanciesRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">Open Positions</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Explore our current vacancies and find the role that matches your skills and ambition.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {jobPositions.map((job) => {
              const Icon = job.icon;
              return (
                  <Card key={job.id} className="group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/40 flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground">{job.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">Requirements</h4>
                        <ul className="space-y-1.5">
                          {job.requirements.map((req, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                {req}
                              </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wide">Experience</h4>
                        <p className="text-sm text-muted-foreground">{job.experience}</p>
                      </div>
                      <div className="mt-auto">
                        <Button className="w-full" onClick={() => handleApply(job)}>
                          Apply Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              );
            })}
          </div>
        </section>

        {/* Application Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Apply for {selectedJob?.title}</DialogTitle>
              <DialogDescription>Fill in your details below. Fields marked * are required.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" placeholder="Enter your full name" required maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nic">NIC Number *</Label>
                <Input id="nic" placeholder="e.g. 200012345678" required maxLength={12} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="07X XXXX XXX" required maxLength={15} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address *</Label>
                <Textarea id="address" placeholder="Your residential address" required maxLength={500} className="min-h-[60px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experience">Experience</Label>
                <Textarea id="experience" placeholder="Briefly describe your relevant experience" maxLength={1000} className="min-h-[60px]" />
              </div>

              {/* CV Upload */}
              <div className="space-y-1.5">
                <Label>Upload CV (PDF) *</Label>
                <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
                <div
                    onClick={() => cvInputRef.current?.click()}
                    className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {cvFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                        <Upload className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[200px]">{cvFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setCvFile(null); }} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        <span className="text-sm">Click to upload your CV</span>
                      </div>
                  )}
                </div>
              </div>

              {/* Certificates Upload */}
              <div className="space-y-1.5">
                <Label>Upload Certificates (optional)</Label>
                <input
                    ref={certInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                />
                <div
                    onClick={() => certInputRef.current?.click()}
                    className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {certFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                        <Upload className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[200px]">{certFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setCertFile(null); }} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        <span className="text-sm">Click to upload certificates</span>
                      </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Submit Application
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default Careers;
