import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ClientLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/client/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('clientId', data.clientId);
        localStorage.setItem('companyName', data.companyName);

        navigate(data.redirectUrl);
      } else {
        const errorData = await response.text();
        setError(errorData || "Login failed");
      }
    } catch (err) {
      setError("Cannot connect to server");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
            <input
                className="w-full px-4 py-3 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              <Lock className="h-4 w-4 mr-2" /> {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="mt-4 text-xs text-muted-foreground">
              <p className="font-semibold">Test Account:</p>
              <p>Username: abc_corp</p>
              <p>Password: client123</p>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              <a href="/" className="hover:text-primary">← Back to Home</a>
            </p>
          </form>
        </motion.div>
      </div>
  );
};

export default ClientLogin;