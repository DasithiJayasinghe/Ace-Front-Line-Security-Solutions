import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Shield, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ClientLogin = () => {
    const [username, setUsername]     = useState("");
    const [password, setPassword]     = useState("");
    const [showPass, setShowPass]     = useState(false);
    const [remember, setRemember]     = useState(false);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8080/api/auth/client/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token",       data.token);
                localStorage.setItem("role",        data.role);
                localStorage.setItem("clientId",    String(data.clientId));
                localStorage.setItem("companyName", data.companyName);
                localStorage.setItem("username",    username);
                localStorage.removeItem("email");
                if (data.firstLogin) localStorage.setItem("isFirstLogin", "true");
                navigate(data.redirectUrl || "/client/dashboard");
            } else {
                const txt = await res.text();
                try { setError(JSON.parse(txt).message || "Login failed"); }
                catch { setError(txt || "Login failed"); }
            }
        } catch {
            setError("Cannot connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-accent flex flex-col">
            {/* Top bar */}
            <header className="flex items-center justify-center px-6 py-4" />

            {/* Login card */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[440px]"
                >
                    {/* Icon + title above card */}
                    <div className="text-center mb-8">
                        <img src="/logo.png" alt="Ace Front Line Security Logo" className="h-12 w-12 mx-auto mb-4" />
                        <h1 className="text-3xl font-black text-accent-foreground">Client Login</h1>
                        <p className="text-accent-foreground/60 mt-2">Access your security dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="bg-card p-8 rounded-2xl shadow-2xl border space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Username</label>
                            <input
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-foreground">Password</label>
                                <button type="button" className="text-xs font-semibold text-primary hover:underline">
                                    Forget Password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pr-12 px-4 py-3 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember */}
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-muted-foreground">Remember this device</span>
                        </label>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? (
                                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <><Lock className="h-4 w-4 mr-2" /> Login to Portal</>
                            )}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            <a href="/" className="hover:text-primary">← Back to Home</a>
                        </p>
                    </form>

                </motion.div>
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-xs text-accent-foreground/50 space-y-2 border-t border-accent-foreground/10">
                <p>© 2026 Ace Front Line Security Solutions. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default ClientLogin;