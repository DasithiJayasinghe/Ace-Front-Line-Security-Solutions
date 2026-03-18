import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User, Calculator, Settings, Lock, ChevronRight, ArrowLeft, Briefcase, Crown, Award, Building2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { extractUserRole } from "@/lib/roleUtils";

const roles = [
  { id: "area-manager", label: "Area Manager", icon: User, desc: "Manage regions, reports & schedules" },
  { id: "security-officer", label: "Security Officer", icon: Shield, desc: "View paysheets, request leave & uniforms" },
  { id: "account-executive", label: "Account Executive", icon: Calculator, desc: "Payroll, invoices & financial reports" },
  { id: "admin", label: "Admin", icon: Settings, desc: "Management & oversight" },
];

// Role mapping: frontend role -> allowed backend roles
const roleMapping: Record<string, string[]> = {
  "area-manager": ["AREA_MANAGER"],
  "security-officer": ["SECURITY_OFFICER"],
  "account-executive": ["ACCOUNT_EXECUTIVE", "ACCOUNTANT"],
  "admin": ["OPERATION_MANAGER", "CHAIRMAN", "DIRECTOR", "EXECUTIVE_OFFICER"],
};

const StaffLogin = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      if (!selectedRole) {
        setError("Please select a role before signing in.");
        setLoading(false);
        return;
      }
      if (!username || !username.trim()) {
        setError("Username is required.");
        setLoading(false);
        return;
      }
      // Enforce that staff login is by username only (not email)
      if (username.includes("@")) {
        setError("Please enter your username (not an email address).");
        setLoading(false);
        return;
      }
      if (!password || !password.trim()) {
        setError("Password is required.");
        setLoading(false);
        return;
      }

      console.log("Attempting staff login with username:", username, "and role:", selectedRole);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      console.log("Response status:", response.status);
      
      // Handle response text first to safely parse JSON
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      let apiResponse;
      try {
        apiResponse = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        setError("Server error: Invalid response format. Please ensure the backend is running correctly.");
        setLoading(false);
        return;
      }

      console.log("Response body:", apiResponse);

      if (response.ok && apiResponse.success) {
        const data = apiResponse.data;
        // Extract role using utility function - handles strings, objects, enum-like structures
        const userRole = extractUserRole(data.role);
        const allowedRoles = roleMapping[selectedRole];

        console.log("User role from backend:", userRole, "Allowed roles:", allowedRoles);

        // Validate that the user's role matches the selected role
        if (!allowedRoles.includes(userRole)) {
          setError(
            `Invalid role. You selected "${roles.find(r => r.id === selectedRole)?.label}" ` +
            `but your account is registered as "${userRole}". Please select the correct role.`
          );
          setLoading(false);
          return;
        }
        
        // Store user information in localStorage
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("token", data.token);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("role", userRole);
        localStorage.setItem("userId", String(data.userId));
        
        // Map roles to dashboard routes and navigate directly
        const roleRoutes: Record<string, string> = {
          "AREA_MANAGER": "/area-manager",
          "EXECUTIVE_OFFICER": "/executive-officer",
          "OPERATION_MANAGER": "/operational-manager",
          "OPERATIONAL_MANAGER": "/operational-manager",
          "ACCOUNT_EXECUTIVE": "/account-executive",
          "ACCOUNTANT": "/account-executive",
          "DIRECTOR": "/director",
          "CHAIRMAN": "/chairman",
          "SECURITY_OFFICER": "/security-officer",
        };

        const targetRoute = roleRoutes[userRole] || "/staff-login";
        console.log("Login successful. Navigating to:", targetRoute);
        navigate(targetRoute, { replace: true });
      } else {
        console.log("Login failed:", apiResponse);
        setError(apiResponse?.message || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Show more specific error message
      if (err?.message === "Failed to fetch") {
        setError("Cannot connect to server. Please ensure the backend is running.");
      } else {
        setError(err?.message || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-2">Staff Login</h1>
          <p className="text-muted-foreground text-lg">Select your role and sign in</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card p-8 rounded-xl shadow-lg border border-border/60 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${selectedRole === r.id
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/30 hover:bg-card/80"
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
                <div className="space-y-4 pt-4">
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none transition-ring"
                    placeholder="Username (not email)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none transition-ring"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-amber-500 hover:text-amber-600 transition-colors font-semibold underline decoration-amber-500/30 hover:decoration-amber-500/50"
                  >
                    Forgotten your password?
                  </button>
                </div>

                <Button type="submit" className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all" size="lg" disabled={loading}>
                  <Lock className="h-4 w-4 mr-2" /> {loading ? "Signing In..." : "Sign In"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-muted-foreground border-t border-border/50 pt-4">
            <a href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">← Back</a>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default StaffLogin;
