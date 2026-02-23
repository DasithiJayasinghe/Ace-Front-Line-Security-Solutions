import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, MessageCircle, Send } from "lucide-react";
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
  const [serviceDuration, setServiceDuration] = useState("");

  const handleServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Service Inquiry Submitted",
      description: "We've received your request. Our team will contact you within 24 hours.",
    });
    (e.target as HTMLFormElement).reset();
    setServiceDuration("");
  };

  const handleGeneralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Inquiry Submitted",
      description: "Thank you for reaching out. We'll respond to your inquiry shortly.",
    });
    (e.target as HTMLFormElement).reset();
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

        {/* Hero */}
        <section className="bg-accent text-accent-foreground py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Get In Touch</h1>
            <p className="text-lg text-accent-foreground/80 max-w-2xl mx-auto">
              Whether you're a company looking for security services or an individual with a question,
              we're here to help.
            </p>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Tabs defaultValue="service" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="service" className="gap-2">
                <Building2 className="h-4 w-4" /> Service Inquiry
              </TabsTrigger>
              <TabsTrigger value="general" className="gap-2">
                <MessageCircle className="h-4 w-4" /> General Inquiry
              </TabsTrigger>
            </TabsList>

            {/* Service Inquiry Tab */}
            <TabsContent value="service">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Request Security Services</CardTitle>
                  <CardDescription>For companies looking to hire security officers. Fill in your requirements below.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleServiceSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input id="companyName" placeholder="Your company name" required maxLength={200} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="contactPerson">Contact Person Name *</Label>
                        <Input id="contactPerson" placeholder="Full name" required maxLength={100} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="svcEmail">Email Address *</Label>
                        <Input id="svcEmail" type="email" placeholder="you@company.com" required maxLength={255} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="svcPhone">Phone Number *</Label>
                        <Input id="svcPhone" type="tel" placeholder="07X XXXX XXX" required maxLength={15} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="officersRequired">No. of Officers Required *</Label>
                        <Input id="officersRequired" type="number" placeholder="e.g. 5" required min={1} max={500} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="companyAddress">Company Address *</Label>
                      <Input id="companyAddress" placeholder="Full company address" required maxLength={500} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="serviceLocation">Service Location *</Label>
                        <Input id="serviceLocation" placeholder="Where officers are needed" required maxLength={200} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="serviceDuration">Service Duration *</Label>
                        <Select value={serviceDuration} onValueChange={setServiceDuration} required>
                          <SelectTrigger>
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
                      <Label htmlFor="svcNotes">Additional Notes</Label>
                      <Textarea id="svcNotes" placeholder="Any specific requirements or details..." maxLength={1000} className="min-h-[80px]" />
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      <Send className="h-4 w-4 mr-2" /> Submit Service Inquiry
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Inquiry Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">General Inquiry</CardTitle>
                  <CardDescription>For security officers, visitors, or anyone with a question. We're happy to help.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGeneralSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="genFullName">Full Name *</Label>
                      <Input id="genFullName" placeholder="Your full name" required maxLength={100} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="genEmail">Email Address *</Label>
                        <Input id="genEmail" type="email" placeholder="you@example.com" required maxLength={255} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="genPhone">Phone Number *</Label>
                        <Input id="genPhone" type="tel" placeholder="07X XXXX XXX" required maxLength={15} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="genSubject">Inquiry Subject *</Label>
                      <Input id="genSubject" placeholder="What is your inquiry about?" required maxLength={200} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="genMessage">Message / Question *</Label>
                      <Textarea id="genMessage" placeholder="Type your message here..." required maxLength={2000} className="min-h-[120px]" />
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      <Send className="h-4 w-4 mr-2" /> Submit Inquiry
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
  );
};

export default Inquiries;
