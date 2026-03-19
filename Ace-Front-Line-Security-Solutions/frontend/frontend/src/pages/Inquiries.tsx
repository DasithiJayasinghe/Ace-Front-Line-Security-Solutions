import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, MessageCircle, Send, MapPin, Shield, Phone, Mail, Clock, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo.png";

const Inquiries = () => {
  const { toast } = useToast();
  const query = new URLSearchParams(window.location.search);
  const defaultTab = query.get("tab") || "service";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [serviceDuration, setServiceDuration] = useState("");

  const handleServiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      companyName: (form.elements.namedItem("companyName") as HTMLInputElement).value,
      contactPerson: (form.elements.namedItem("contactPerson") as HTMLInputElement).value,
      email: (form.elements.namedItem("svcEmail") as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem("svcPhone") as HTMLInputElement).value,
      numberOfOfficers: parseInt((form.elements.namedItem("officersRequired") as HTMLInputElement).value, 10),
      companyAddress: (form.elements.namedItem("companyAddress") as HTMLInputElement).value,
      serviceLocation: (form.elements.namedItem("serviceLocation") as HTMLInputElement).value,
      serviceDuration: serviceDuration,
      additionalNotes: (form.elements.namedItem("svcNotes") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/inquiries/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      toast({
        title: "Service Inquiry Submitted",
        description: "We've received your request. Our team will contact you within 24 hours.",
      });
      form.reset();
      setServiceDuration("");
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: "Unable to send inquiry. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleGeneralSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      fullName: (form.elements.namedItem("genFullName") as HTMLInputElement).value,
      email: (form.elements.namedItem("genEmail") as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem("genPhone") as HTMLInputElement).value,
      subject: (form.elements.namedItem("genSubject") as HTMLInputElement).value,
      message: (form.elements.namedItem("genMessage") as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch("/api/inquiries/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      toast({
        title: "Inquiry Submitted",
        description: "Thank you for reaching out. We'll respond to your inquiry shortly.",
      });
      form.reset();
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: "Unable to send inquiry. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#FFD700]/30 bg-[#1A1A1B]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoImage} alt="Ace Front Line Logo" className="h-10 w-10 rounded-full" />
              <div className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight uppercase text-white">Ace Front Line</span>
                <span className="text-[10px] tracking-[0.2em] font-medium text-[#FFD700]/60 uppercase">Security Solutions</span>
              </div>
            </Link>
            <Button variant="outline" size="sm" asChild className="border-[#FFD700] text-[#1A1A1B] hover:bg-[#FFD700] hover:text-[#1A1A1B]">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - enhanced */}
      <section className="relative bg-[#1A1A1B] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#FFD700]/15 via-[#FFD700]/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-20 -translate-y-1/2 w-60 h-60 bg-[#FFD700]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-[#FFD700]/5 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#FFD700]/30 mb-6">
            <Shield className="h-4 w-4 text-[#FFD700]" />
            <span className="text-[#FFD700] text-xs font-bold uppercase tracking-widest">24/7 Support Available</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            How Can We <span className="text-[#FFD700]">Help You?</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Whether you need security services for your business or have a general question,
            our dedicated team is ready to assist you.
          </p>

          {/* Quick info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="bg-[#FFD700]/20 p-2 rounded-lg">
                <Phone className="h-5 w-5 text-[#FFD700]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/50 font-medium">Call Us</p>
                <p className="text-sm font-bold">0114848177</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="bg-[#FFD700]/20 p-2 rounded-lg">
                <Mail className="h-5 w-5 text-[#FFD700]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/50 font-medium">Email</p>
                <p className="text-sm font-bold">acefrontline@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="bg-[#FFD700]/20 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-[#FFD700]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/50 font-medium">Response Time</p>
                <p className="text-sm font-bold">Within 24 hrs</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <a
              href="https://maps.app.goo.gl/gm6SibQrDqco4Pj3A"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#FFD700] hover:text-white transition-colors text-sm font-semibold"
            >
              <MapPin className="h-4 w-4" /> 189/2, Sandatenna Mawatha, Battaramulla - View on Map
            </a>
          </div>
        </div>
      </section>

      {/* Why Contact Us - trust signals */}
      <section className="bg-muted/30 py-12 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: "MOD Registered", desc: "Licensed & Authorized" },
              { icon: CheckCircle, label: "50+ Clients", desc: "Trusted Partner" },
              { icon: Clock, label: "Quick Response", desc: "24/7 Availability" },
              { icon: HelpCircle, label: "Free Consultation", desc: "No Obligation" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-2 p-4">
                <div className="bg-[#1A1A1B]/10 p-3 rounded-full">
                  <item.icon className="h-6 w-6 text-[#1A1A1B]" />
                </div>
                <p className="font-bold text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-foreground tracking-tight">
            Submit Your Inquiry
          </h2>
          <p className="text-muted-foreground mt-2">Choose the type of inquiry that best fits your needs</p>
          <div className="w-16 h-1 bg-[#1A1A1B] mx-auto mt-4 rounded-full" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-[#F4F7F6] rounded-xl p-1 border border-border">
            <TabsTrigger
              value="service"
              className="gap-2 py-3 text-base font-bold rounded-lg data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <Building2 className="h-5 w-5" /> Service Inquiry
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="gap-2 py-3 text-base font-bold rounded-lg data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <MessageCircle className="h-5 w-5" /> General Inquiry
            </TabsTrigger>
          </TabsList>

          {/* Service Inquiry Tab */}
          <TabsContent value="service">
            <Card className="shadow-xl border-0 bg-card overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-[#1A1A1B]/10 p-2 rounded-lg">
                    <Building2 className="h-6 w-6 text-[#1A1A1B]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Request Security Services</CardTitle>
                    <CardDescription className="mt-1">For companies looking to hire security officers. Fill in your requirements below.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleServiceSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="font-semibold">Company Name *</Label>
                    <Input id="companyName" name="companyName" placeholder="Your company name" required maxLength={200} className="h-11" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contactPerson" className="font-semibold">Contact Person Name *</Label>
                      <Input id="contactPerson" name="contactPerson" placeholder="Full name" required maxLength={100} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="svcEmail" className="font-semibold">Email Address *</Label>
                      <Input id="svcEmail" name="svcEmail" type="email" placeholder="you@company.com" required maxLength={255} className="h-11" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="svcPhone" className="font-semibold">Phone Number *</Label>
                      <Input id="svcPhone" name="svcPhone" type="tel" placeholder="07X XXXX XXX" required maxLength={15} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="officersRequired" className="font-semibold">No. of Officers Required *</Label>
                      <Input id="officersRequired" name="officersRequired" type="number" placeholder="e.g. 5" required min={1} max={500} className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyAddress" className="font-semibold">Company Address *</Label>
                    <Input id="companyAddress" name="companyAddress" placeholder="Full company address" required maxLength={500} className="h-11" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="serviceLocation" className="font-semibold">Service Location *</Label>
                      <Input id="serviceLocation" name="serviceLocation" placeholder="Where officers are needed" required maxLength={200} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="serviceDuration" className="font-semibold">Service Duration *</Label>
                      <Select value={serviceDuration} onValueChange={setServiceDuration} required>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short-term">Short-term</SelectItem>
                          <SelectItem value="long-term">Long-term</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="svcNotes" className="font-semibold">Additional Notes</Label>
                    <Textarea id="svcNotes" name="svcNotes" placeholder="Any specific requirements or details..." maxLength={1000} className="min-h-[100px]" />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all bg-[#1A1A1B] hover:bg-[#FFD700] hover:text-[#1A1A1B] text-white" size="lg">
                    <Send className="h-5 w-5 mr-2" /> Submit Service Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Inquiry Tab */}
          <TabsContent value="general">
            <Card className="shadow-xl border-0 bg-card overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-[#FFD700]/10 p-2 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-[#FFD700]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">General Inquiry</CardTitle>
                    <CardDescription className="mt-1">For security officers, visitors, or anyone with a question. We're happy to help.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGeneralSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="genFullName" className="font-semibold">Full Name *</Label>
                    <Input id="genFullName" name="genFullName" placeholder="Your full name" required maxLength={100} className="h-11" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="genEmail" className="font-semibold">Email Address *</Label>
                      <Input id="genEmail" name="genEmail" type="email" placeholder="you@example.com" required maxLength={255} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="genPhone" className="font-semibold">Phone Number *</Label>
                      <Input id="genPhone" name="genPhone" type="tel" placeholder="07X XXXX XXX" required maxLength={15} className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="genSubject" className="font-semibold">Inquiry Subject *</Label>
                    <Input id="genSubject" name="genSubject" placeholder="What is your inquiry about?" required maxLength={200} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="genMessage" className="font-semibold">Message / Question *</Label>
                    <Textarea id="genMessage" name="genMessage" placeholder="Type your message here..." required maxLength={2000} className="min-h-[140px]" />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all bg-[#1A1A1B] hover:bg-[#FFD700] hover:text-[#1A1A1B] text-white" size="lg">
                    <Send className="h-5 w-5 mr-2" /> Submit Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#1A1A1B] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Need Immediate Assistance?</h3>
          <p className="text-[#FFD700]/60 mb-6">Our operations team is available around the clock for urgent security needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:0114848177" className="inline-flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFD700]/80 text-[#1A1A1B] px-6 py-3 rounded-lg font-bold transition-colors">
              <Phone className="h-5 w-5" /> Call Now
            </a>
            <a href="mailto:acefrontline@gmail.com" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-bold transition-colors border border-[#FFD700]/40">
              <Mail className="h-5 w-5" /> Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Inquiries;
