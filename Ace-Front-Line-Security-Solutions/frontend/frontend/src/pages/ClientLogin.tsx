import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ClientLogin = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/client/dashboard");
  };

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black text-accent-foreground">Client Login</h1>
          <p className="text-accent-foreground/60 mt-2">Access your security dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card p-8 rounded-2xl shadow-2xl border space-y-5">
          <input className="w-full px-4 py-3 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Email Address" />
          <input className="w-full px-4 py-3 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Password" type="password" />

          <Button type="submit" className="w-full" size="lg">
            <Lock className="h-4 w-4 mr-2" /> Sign In
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <a href="/" className="hover:text-primary">← Back to Home</a>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientLogin;
