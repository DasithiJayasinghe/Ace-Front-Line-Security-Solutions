import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User, Calculator, Settings, Lock, ChevronRight, ArrowLeft, Briefcase, Crown, Award, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const roles = [
  { id: "area-manager", label: "Area Manager", icon: User, desc: "Manage regions, reports & schedules" },
  { id: "security-officer", label: "Security Officer", icon: Shield, desc: "View paysheets, request leave & uniforms" },
  { id: "accountant", label: "Accountant", icon: Calculator, desc: "Payroll, invoices & financial reports" },
  { id: "admin", label: "Admin", icon: Settings, desc: "Management & oversight" },
];

const StaffLogin = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store user info in localStorage for future use
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("fullName", data.fullName);

        // Redirect based on the URL provided by the backend
        navigate(data.redirectUrl);
      } else {
        const errorData = await response.text();
        setError(errorData || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black text-accent-foreground">Staff Login</h1>
          <p className="text-accent-foreground/60 mt-2">Select your role and sign in</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card p-8 rounded-2xl shadow-2xl border space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRole === r.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
                  }`}
              >
                <r.icon className={`h-5 w-5 mb-2 ${selectedRole === r.id ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-bold text-foreground">{r.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                <div className="space-y-3 pt-2">
                  <input
                    className="w-full px-4 py-3 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    className="w-full px-4 py-3 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  <Lock className="h-4 w-4 mr-2" /> {loading ? "Signing In..." : "Sign In"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-muted-foreground">
            <a href="/" className="hover:text-primary">← Back to Home</a>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default StaffLogin;
