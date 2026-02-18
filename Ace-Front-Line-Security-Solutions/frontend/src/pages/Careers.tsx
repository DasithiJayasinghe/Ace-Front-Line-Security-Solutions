import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
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

      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-4xl font-black text-foreground mb-4">Careers</h1>
          <p className="text-muted-foreground text-lg">Coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default Careers;
