import { Link } from "react-router-dom";
import { Shield, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logoImage from "@/assets/logo.png";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImage} alt="Ace Front Line Logo" className="h-24 w-24 mx-auto mb-4 rounded-full shadow-lg" />
          <h1 className="text-4xl font-black text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-lg">Select your login type to continue</p>
        </div>

        <div className="bg-card p-8 rounded-xl shadow-lg border border-border/60 space-y-4">
          <Button asChild size="lg" className="w-full gap-3 text-base bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all">
            <Link to="/staff-login">
              <Lock className="h-5 w-5" /> Staff Login
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full gap-3 text-base border border-border hover:bg-primary/5 rounded-lg transition-all">
            <Link to="/client-login">
              <Users className="h-5 w-5" /> Client Login
            </Link>
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            <Link to="/" className="text-primary hover:text-primary/80 transition-colors font-medium">← Back to Home</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
