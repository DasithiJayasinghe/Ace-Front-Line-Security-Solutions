import { Link } from "react-router-dom";
import { Shield, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logoImage from "@/assets/logo.png";

const Login = () => {
  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImage} alt="Ace Front Line Logo" className="h-24 w-24 mx-auto mb-4 rounded-full" />
          <h1 className="text-3xl font-black text-accent-foreground">Welcome Back</h1>
          <p className="text-accent-foreground/60 mt-2">Select your login type to continue</p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-2xl border space-y-4">
          <Button asChild size="lg" className="w-full gap-3 text-base">
            <Link to="/staff-login">
              <Lock className="h-5 w-5" /> Staff Login
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full gap-3 text-base">
            <Link to="/client-login">
              <Users className="h-5 w-5" /> Client Login
            </Link>
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            <Link to="/" className="hover:text-primary">← Back to Home</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
