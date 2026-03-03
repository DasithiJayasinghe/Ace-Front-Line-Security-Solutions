import { useState, useMemo } from "react";
import { clientApi } from "@/lib/api";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";

interface ChangePasswordModalProps {
    clientId: number;
    onClose: () => void;
}

const ChangePasswordModal = ({ clientId, onClose }: ChangePasswordModalProps) => {
    const isFirstLogin = localStorage.getItem("isFirstLogin") === "true";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const checks = useMemo(() => ({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    }), [newPassword]);

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const strengthLabel = passedChecks <= 1 ? "Weak" : passedChecks === 2 ? "Medium" : passedChecks === 3 ? "Good" : "Strong";

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (passedChecks < 4) {
            setError("Password does not meet security requirements.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            await clientApi.changePassword(clientId, { currentPassword, newPassword, confirmPassword });
            onClose();
        } catch (e: any) {
            setError(e?.message || "Failed to change password.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full bg-muted/50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm focus:bg-card focus:border-primary focus:ring-0 transition-all outline-none pr-12";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-[420px] bg-card rounded-2xl shadow-2xl border overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="material-symbols-outlined text-base">lock</span>
                        </div>
                        <span className="text-sm font-extrabold uppercase tracking-tight">Change Password</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">

                    {/* Title */}
                    <div className="space-y-1">
                        <h2 className="text-xl font-black tracking-tight">
                            {isFirstLogin ? "Set Your New Password" : "Change Password"}
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {isFirstLogin
                                ? "Please set a new password to secure your account."
                                : "Update your password to keep your account secure."}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Fields */}
                    <div className="space-y-3">
                        {/* Current */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    className={inputClass}
                                    placeholder="Enter current password"
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <button
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* New */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    className={inputClass}
                                    placeholder="Min. 8 characters"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* Strength bars */}
                            <div className="pt-2 space-y-2">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 flex-1 rounded-full ${
                                                i < passedChecks ? "bg-primary shadow-sm shadow-primary/20" : "bg-muted"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                                        Strength: {strengthLabel}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground">
                                        {strengthLabel === "Strong" ? "Excellent" : strengthLabel === "Good" ? "Good" : "Needs improvement"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Policy */}
                        <div className="bg-muted/50 rounded-xl p-3 space-y-2 border">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Password Requirements</p>
                            <ul className="grid grid-cols-2 gap-1.5">
                                {[
                                    { label: "At least 8 characters", ok: checks.length },
                                    { label: "At least one uppercase letter", ok: checks.uppercase },
                                    { label: "At least one number", ok: checks.number },
                                    { label: "At least one special character", ok: checks.special },
                                ].map((rule) => (
                                    <li key={rule.label} className={`flex items-center gap-1.5 text-[11px] ${rule.ok ? "font-bold" : "font-medium text-muted-foreground"}`}>
                    <span className={`material-symbols-outlined text-sm ${rule.ok ? "text-emerald-500" : ""}`}>
                      {rule.ok ? "check_circle" : "radio_button_unchecked"}
                    </span>
                                        {rule.label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Confirm */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    className={inputClass}
                                    placeholder="Repeat new password"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-sm disabled:opacity-60"
                        >
                            {submitting ? "Changing..." : "Change Password"}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <p className="text-center text-xs font-medium text-muted-foreground">
                            Having trouble?{" "}
                            <a className="text-primary font-bold hover:underline" href="#">Contact Support</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
