import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ClientLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate inputs
    if (!username || !username.trim()) {
      setError("Username is required.");
      setLoading(false);
      return;
    }
    if (!password || !password.trim()) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting client login with username:", username);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      console.log("Response status:", response.status);
      const apiResponse = await response.json();
      console.log("Response body:", apiResponse);

      if (response.ok && apiResponse.success) {
        const data = apiResponse.data;
        
        // Store user information in localStorage
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("token", data.token);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userId", String(data.userId));
        
        // Redirect to client dashboard
        navigate("/client/dashboard");
      } else {
        console.log("Client login failed:", apiResponse);
        setError(apiResponse?.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Client login error:", err);
      setError("An error occurred. Please try again.");
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
          <h1 className="text-4xl font-black text-foreground mb-2">Client Login</h1>
          <p className="text-muted-foreground text-lg">Access your security dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card p-8 rounded-xl shadow-lg border border-border/60 space-y-5">
          <input
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-accent outline-none transition-ring"
            placeholder="Username"
            type="text"
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

          {error && <p className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

          <Button type="submit" className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all" size="lg" disabled={loading}>
            <Lock className="h-4 w-4 mr-2" /> {loading ? "Signing In..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground border-t border-border/50 pt-4">
            <a href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">← Back to Login Options</a>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientLogin;
