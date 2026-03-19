import { Link } from "react-router-dom";
import { Shield, Video, Truck, CheckCircle, Star, Phone, Mail, MapPin, ChevronRight, Menu, X, Lock, Users, Eye, Crosshair, UserCheck, Flame, Facebook, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import heroImage from "@/assets/hero-security.jpg";
import eagleImage from "@/assets/eagle-vision.jpg";
import logoImage from "@/assets/logo.png";
import companyProfile from "@/assets/company-profile.png";
import teamPhoto from "@/assets/team-photo.jpg";

const navItems = ["Home", "Services", "Careers", "Contact Us", "Inquiries"];

const stats = [
  { value: "500+", label: "Personnel", highlight: false },
  { value: "24/7", label: "Monitoring", highlight: true },
  { value: "50+", label: "Clients", highlight: false },
  { value: "9Y+", label: "Experience", highlight: true },
];

const coverageAreas = [
  "Colombo", "Biyagama", "Katunayake", "Nittambuwa", "Kurunegala", "Matale", "Southern Province", "Kalutara"
];

const services = [
  { icon: Shield, title: "Manned Guarding", desc: "Elite on-site security personnel including armed and unarmed guards, trained ex-military professionals for commercial and industrial sites.", detail: "Our manned guarding service provides highly trained security officers drawn from elite military backgrounds. Services include static guarding, mobile patrols, access control, perimeter security, and emergency response. All officers undergo rigorous training in threat assessment, conflict resolution, first aid, and fire safety. We deploy personnel equipped with modern communication devices and maintain strict supervision through area managers and operations coordinators." },
  { icon: Video, title: "CCTV Monitoring", desc: "Cutting-edge surveillance systems with expert monitoring teams, motion detection, glass breaking detection, and proximity access control.", detail: "Our CCTV monitoring solutions include installation, maintenance, and 24/7 remote monitoring of advanced surveillance systems. Features include HD/IP camera systems, motion detection alerts, glass break detection, proximity access control, night vision capabilities, and cloud-based storage. Our trained monitoring staff provide real-time incident response and detailed reporting for complete situational awareness." },
  { icon: Truck, title: "Cash in Transit", desc: "Secure armed escort services for cash transportation with GPS tracking and highly trained response teams.", detail: "Our Cash-in-Transit service provides secure transportation of cash and valuables with armed escort teams. All vehicles are GPS-tracked in real-time, and crews consist of highly trained ex-military personnel. We follow strict chain-of-custody protocols, use tamper-proof containers, and maintain insurance coverage for all consignments. Available for bank transfers, ATM replenishment, and corporate cash handling." },
  { icon: UserCheck, title: "VIP Protection", desc: "Personal bodyguards and drivers for VIP/VVIP protection, drawn from elite special forces with diplomatic mission experience.", detail: "Our VIP/VVIP protection service provides close protection officers (CPOs) drawn from elite special forces units with experience in diplomatic missions and high-risk environments. Services include personal bodyguards, secure transportation with trained drivers, advance security planning, threat assessments, and event security coordination. Each protection detail is customized based on the threat level and client requirements." },
  { icon: Crosshair, title: "Security Consultation", desc: "Comprehensive security assessments, survey reports, audits and tailored security solutions for any industry requirement.", detail: "Our security consultation services include comprehensive site surveys, vulnerability assessments, security audits, and risk analysis. We provide detailed reports with actionable recommendations tailored to your industry. Our consultants have decades of military and corporate security experience, offering solutions for physical security, electronic surveillance integration, emergency response planning, and regulatory compliance." },
  { icon: Flame, title: "Event Security", desc: "Specialized security coverage for private functions, residences, sporting events, cricket matches and corporate gatherings.", detail: "We provide specialized event security for private functions, corporate events, sporting events, exhibitions, and public gatherings. Our services include crowd management, access control, VIP area security, perimeter control, and emergency evacuation planning. All event security officers are briefed on event-specific protocols and coordinate with local law enforcement when required." },
];

const clients = [
  "CKT Apparel (Pvt) Ltd", "Hirdaramani Industries (Pvt) Ltd", "Hela Clothing (Pvt) Ltd",
  "Hela Intimates", "Foundation Garments (Pvt) Ltd", "Jinadasa Bennett (Pvt) Ltd",
  "Brandix Intimates Centre", "Sway Global Holdings (Pvt) Ltd", "Miami Clothing (Pvt) Ltd",
  "Associated CEAT (Private) Limited", "Eu-Retec (Pvt) Limited", "Workwear Lanka (Pvt) Ltd",
  "Midas Safety Lanka (Pvt) Ltd", "Snackings (Pvt) Ltd", "Lalan Rubbers (Pvt) Ltd",
  "Central Rubbers (Pvt) Ltd", "Lalan Energy Solutions (Pvt) Ltd", "Lalan Printing & Packaging (Pvt) Ltd",
  "Lalan Engineering Services (Pvt) Ltd", "Hivetz Nutri (Pvt) Ltd", "C W Mackie PLC",
  "Suntea (Pvt) Ltd", "Boehm Leckner Multi Moulds (Pvt) Ltd", "Micro Cars (Pvt) Ltd",
  "Wecare Hospital", "New May Fashion (Pvt) Ltd", "Sumanasekera Supermarket",
  "Institution of Incorporated Engineers Sri Lanka", "Ebony Holdings (Pvt) Ltd",
  "Kushmi Foods & Catering", "Buddhist Ladies College", "Incubate Labs",
  "Coco Fresh (Pvt) Ltd", "Ravi Breeding Farm", "Artisans H K (Pvt) Ltd",
  "Prasad Fashion", "Colombo City Centre Residences", "LANKASEAL (PVT) LTD",
  "Tasma International Multi Services (Pvt) Ltd", "S & S Clothing (Pvt) Ltd",
  "Senura Civil Engineering (Pvt) Ltd", "Ceylon Biscuits Limited",
  "JF & I Packaging (Pvt) Ltd",
];

const testimonials = [
  { name: "Hirdaramani Group", role: "Apparel Industry Client", quote: "Ace Front Line provides exceptional security services across our multiple factory locations. Their ex-military personnel bring unmatched professionalism and discipline." },
  { name: "Brandix Intimates", role: "Manufacturing Client", quote: "The reliability and training standards of Ace Front Line's security officers have significantly improved our facility security. Their 24/7 commitment is outstanding." },
  { name: "CEAT Kelani", role: "Industrial Client", quote: "Their comprehensive approach to security, combining manned guarding with electronic surveillance, gives us complete peace of mind for our operations." },
  { name: "Ceylon Biscuits Limited", role: "FMCG Client", quote: "Ace Front Line has been instrumental in maintaining the security standards at our facilities. Their officers are well-trained, punctual, and always professional." },
  { name: "Colombo City Centre", role: "Real Estate Client", quote: "The security team provided by Ace Front Line for our residential complex is exemplary. Residents feel safe and well-protected around the clock." },
  { name: "Buddhist Ladies College", role: "Education Client", quote: "We trust Ace Front Line with the safety of our students and staff. Their guards are courteous, vigilant, and highly dependable." },
];

const TESTIMONIALS_PER_PAGE = 3;

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedService, setExpandedService] = useState<number | null>(null);
  const [testimonialPage, setTestimonialPage] = useState(0);

  const totalTestimonialPages = Math.ceil(testimonials.length / TESTIMONIALS_PER_PAGE);
  const visibleTestimonials = testimonials.slice(
    testimonialPage * TESTIMONIALS_PER_PAGE,
    (testimonialPage + 1) * TESTIMONIALS_PER_PAGE
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoImage} alt="Ace Front Line Logo" className="h-10 w-10 rounded-full" />
              <div className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight uppercase text-foreground">Ace Front Line</span>
                <span className="text-[10px] tracking-[0.2em] font-medium text-muted-foreground uppercase">Security Solutions</span>
              </div>
            </Link>

            <nav className="hidden md:flex flex-1 justify-center gap-6">
              {navItems.map((item) => (
                <Button key={item} variant="nav" size="sm" asChild>
                  {item === "Careers" || item === "Inquiries" ? (
                    <Link to={`/${item.toLowerCase()}`}>{item}</Link>
                  ) : (
                    <a href={item === "Home" ? "#" : `#${item.toLowerCase().replace(/\s/g, "-")}`}>{item}</a>
                  )}
                </Button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button size="sm" asChild className="gap-2">
                <Link to="/login">
                  <Lock className="h-4 w-4" /> Login
                </Link>
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t bg-card px-4 py-4 space-y-2">
            {navItems.map((item) =>
              item === "Careers" || item === "Inquiries" ? (
                <Link key={item} to={`/${item.toLowerCase()}`} className="block py-2 text-sm font-semibold text-foreground hover:text-primary">{item}</Link>
              ) : (
                <a key={item} href={item === "Home" ? "#" : `#${item.toLowerCase().replace(/\s/g, "-")}`} className="block py-2 text-sm font-semibold text-foreground hover:text-primary">{item}</a>
              )
            )}
            <Button size="sm" asChild className="w-full gap-2">
              <Link to="/login">
                <Lock className="h-4 w-4" /> Login
              </Link>
            </Button>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative min-h-[600px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img alt="Professional security" className="w-full h-full object-cover" src={heroImage} />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/60 to-transparent" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30 w-fit">
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Trusted Protection</span>
              </div>
              <h1 className="text-charcoal-foreground text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
                World Class <span className="text-primary">Security Solutions</span>
              </h1>
              <p className="text-charcoal-foreground/70 text-lg md:text-xl font-normal max-w-lg leading-relaxed">
                Led by elite ex-military professionals with over 35 years of experience, providing comprehensive commercial, industrial and maritime security services across Sri Lanka.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/inquiries?tab=service">Get a Quote</Link>
                </Button>
                <Button variant="heroOutline" size="xl" className="text-charcoal-foreground" asChild>
                  <Link to="#services">View Services</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="relative z-20 -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card p-6 rounded-xl shadow-2xl border">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center p-4">
              <span className={`text-3xl font-black ${s.highlight ? "text-primary" : "text-foreground"}`}>{s.value}</span>
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <section id="services" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Professional Services</h2>
          <p className="text-4xl font-black text-foreground tracking-tight">Our Security Offerings</p>
          <div className="w-20 h-1.5 bg-primary mx-auto mt-6 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div key={i} whileHover={{ y: -8 }} className="group relative bg-card p-8 rounded-xl border hover:border-primary/50 transition-all duration-300">
              <div className="size-14 rounded-lg bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all mb-6">
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{s.desc}</p>
              <button
                className="inline-flex items-center text-sm font-bold text-foreground hover:text-primary transition-colors"
                onClick={() => setExpandedService(expandedService === i ? null : i)}
              >
                {expandedService === i ? "Show Less" : "Learn More"} <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${expandedService === i ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence>
                {expandedService === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 pt-4 border-t text-muted-foreground text-sm leading-relaxed">{s.detail}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Photo Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Our Team</h2>
              <h3 className="text-4xl font-extrabold leading-tight text-foreground mb-6">Professional Security Personnel</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                With over 500 trained security officers deployed across Sri Lanka, our team of ex-military professionals ensures the highest standards of protection for your assets and personnel.
              </p>
              <div className="flex flex-wrap gap-2">
                {coverageAreas.map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-full border border-primary/20">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <img alt="Ace Front Line security team" className="rounded-2xl shadow-2xl w-full object-cover" src={teamPhoto} />
            </div>
          </div>
        </div>
      </section>

      {/* Company Philosophy */}
      <section className="bg-accent py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img alt="Ace Front Line team" className="rounded-2xl shadow-2xl relative z-10" src={companyProfile} />
            <div className="absolute -top-6 -left-6 size-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 px-8 py-6 bg-primary text-primary-foreground rounded-xl shadow-xl z-20 hidden md:block">
              <p className="text-4xl font-black italic">"Excellence"</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Since 2016</p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em]">About Us</h2>
            <h3 className="text-4xl font-extrabold leading-tight text-accent-foreground">Ex-Military Leadership, World-Class Standards</h3>
            <p className="text-accent-foreground/60 text-lg leading-relaxed">
              Founded in 2016 by highly experienced retired senior military veterans, Ace Front Line Security Solutions provides unmatchable standards in security services with customized, modernized solutions for every client.
            </p>
            <ul className="flex flex-col gap-4">
              {["Registered under Ministry of Defence", "EPF/ETF & Insurance for all personnel", "Trained ex-servicemen from Elite Forces", "24-Hour Emergency Response Teams"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-accent-foreground">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-10 rounded-2xl border shadow-lg">
            <h3 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Our Vision</h3>
            <p className="text-2xl font-bold text-foreground leading-snug">Achieve world class in commercial, industrial and maritime security services.</p>
          </div>
          <div className="bg-card p-10 rounded-2xl border shadow-lg">
            <h3 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">To evolve and initiate new standards to become the most professional service provider in the business, becoming the benchmarked organization within the industry through a well-trained and highly motivated team headed by exemplary leadership.</p>
          </div>
        </div>
      </section>

      {/* Our Clients */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Our Clientele</h2>
            <p className="text-4xl font-black text-foreground tracking-tight">Trusted by 50+ Organizations</p>
            <div className="w-20 h-1.5 bg-primary mx-auto mt-6 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {clients.map((client) => (
              <div key={client} className="flex items-center gap-3 bg-background p-4 rounded-xl border hover:border-primary/40 transition-colors">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{client}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Testimonials</h2>
            <p className="text-4xl font-black text-foreground tracking-tight">What Our Clients Say</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleTestimonials.map((t, i) => (
              <div key={testimonialPage * TESTIMONIALS_PER_PAGE + i} className="bg-card p-8 rounded-2xl shadow-lg border flex flex-col gap-4">
                <div>
                  <h4 className="font-bold text-foreground">{t.name}</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.role}</p>
                </div>
                <div className="flex text-primary">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary" />)}
                </div>
                <blockquote className="text-muted-foreground italic leading-relaxed">"{t.quote}"</blockquote>
              </div>
            ))}
          </div>
          {totalTestimonialPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalTestimonialPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialPage(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${i === testimonialPage ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact-us" className="bg-accent py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-accent-foreground">
            <div className="flex items-center gap-4">
              <Phone className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-accent-foreground/60">Call Us</p>
                <p className="font-bold">0114848177 / 0112867359</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-accent-foreground/60">Email</p>
                <p className="font-bold">acefrontline@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-accent-foreground/60">Location</p>
                <p className="font-bold">189/2, Sandatenna Mawatha, Battaramulla</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Facebook className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-accent-foreground/60">Facebook</p>
                <a href="https://www.facebook.com/acefrontline/" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary transition-colors">Follow Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-charcoal-foreground/50 text-sm">© 2026 Ace Front Line Security Solutions (Pvt) Ltd. All rights reserved.</p>
          <a href="https://www.facebook.com/acefrontline/" target="_blank" rel="noopener noreferrer" className="text-charcoal-foreground/50 hover:text-primary transition-colors">
            <Facebook className="h-5 w-5" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
