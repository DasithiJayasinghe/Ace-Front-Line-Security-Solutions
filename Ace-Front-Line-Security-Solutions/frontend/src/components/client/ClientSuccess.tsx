import type { SuccessData } from "@/types/client";

interface ClientSuccessProps {
    data: SuccessData;
    onBackToList: () => void;
    onRegisterAnother: () => void;
}

const ClientSuccess = ({ data, onBackToList, onRegisterAnother }: ClientSuccessProps) => {
    return (
        <div className="max-w-2xl mx-auto py-12 space-y-6">
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                {/* Green header */}
                <div className="bg-success px-8 py-6 text-success-foreground">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">✓</div>
                        <div>
                            <h2 className="text-2xl font-bold">Client Registered Successfully</h2>
                            <p className="text-success-foreground/80 text-sm mt-1">
                                Login credentials have been sent to the client's email
                            </p>
                        </div>
                    </div>
                </div>

                {/* Credentials */}
                <div className="px-8 py-6 space-y-4">
                    <p className="text-muted-foreground text-sm">
                        Please save these credentials. The password will not be shown again.
                    </p>
                    <div className="rounded-xl bg-muted/40 border p-4 space-y-3">
                        {[
                            ["Company", data.companyName],
                            ["Username", data.username],
                            ["Temporary Password", data.temporaryPassword || "Sent via email"],
                            ["Email Sent To", data.contactPersonEmail],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                    {label === "Username" || label === "Temporary Password" ? (
                                        <code className="bg-foreground text-primary px-3 py-1 rounded font-mono text-sm">{value}</code>
                                    ) : (
                                        <span className="font-semibold">{value}</span>
                                    )}
                                </div>
                                <div className="border-t last:hidden" />
                            </div>
                        ))}
                    </div>

                    <div className="rounded-lg bg-accent border border-primary/20 p-4 text-sm">
                        <strong>What happens next:</strong>
                        <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Client receives email with login credentials</li>
                            <li>Client logs in and is prompted to change their password</li>
                            <li>You can now assign officers to this client</li>
                            <li>Generate their first invoice from the Invoices section</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t bg-muted/20 flex gap-3">
                    <button onClick={onBackToList} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors">
                        ← Back to Client List
                    </button>
                    <button onClick={onRegisterAnother} className="border hover:bg-muted font-semibold py-2.5 px-6 rounded-lg transition-colors">
                        Register Another
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientSuccess;
