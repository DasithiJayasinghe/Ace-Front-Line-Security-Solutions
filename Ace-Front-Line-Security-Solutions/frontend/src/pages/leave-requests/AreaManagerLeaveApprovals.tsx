import { useEffect, useState } from "react";
import { leaveRequestApi, LeaveRequestDTO, AffectedShiftDTO, EligibleReplacementDTO } from "@/lib/leaveRequestApi";

export default function AreaManagerLeaveApprovals() {
    const [requests, setRequests] = useState<LeaveRequestDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Reassignment flow state
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequestDTO | null>(null);
    const [affectedShifts, setAffectedShifts] = useState<AffectedShiftDTO[]>([]);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [eligibleReplacements, setEligibleReplacements] = useState<EligibleReplacementDTO[]>([]);
    const [replacementOfficerId, setReplacementOfficerId] = useState<number | "">("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const reqs = await leaveRequestApi.branchRequests();
            if (!Array.isArray(reqs)) throw new Error("API returned an invalid data format for branch leave requests");
            setRequests(reqs);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load branch leave requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            setLoading(true);
            await leaveRequestApi.approveLeave(id);
            alert("Leave approved successfully");
            await loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to approve leave");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt("Enter a reason for rejection (optional):");
        if (reason === null) return; // Cancelled

        try {
            setLoading(true);
            await leaveRequestApi.rejectLeave(id, reason);
            alert("Leave rejected");
            await loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to reject leave");
        } finally {
            setLoading(false);
        }
    };

    const openReassignmentFlow = async (leave: LeaveRequestDTO) => {
        try {
            setLoading(true);
            const shifts = await leaveRequestApi.getAffectedShifts(leave.id);
            if (!Array.isArray(shifts)) throw new Error("API returned an invalid shifts format");
            setSelectedLeave(leave);
            setAffectedShifts(shifts);
            setSelectedShiftId(null);
            setSelectedAssignmentId(null);
            setEligibleReplacements([]);
        } catch (err: any) {
            alert(err.message || "Failed to load affected shifts");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectShiftForReassign = async (shift: AffectedShiftDTO) => {
        if (!selectedLeave) return;
        try {
            setLoading(true);
            setSelectedShiftId(shift.shiftId);
            setSelectedAssignmentId(shift.assignmentId);
            const replacements = await leaveRequestApi.getEligibleReplacements(selectedLeave.id, shift.assignmentId);
            if (!Array.isArray(replacements)) throw new Error("API returned an invalid replacements format");
            setEligibleReplacements(replacements);
            setReplacementOfficerId("");
        } catch (err: any) {
            alert(err.message || "Failed to load eligible replacements");
        } finally {
            setLoading(false);
        }
    };

    const submitReassignment = async () => {
        if (!selectedLeave || !selectedAssignmentId || replacementOfficerId === "") return;
        try {
            setLoading(true);
            await leaveRequestApi.reassignShift(selectedLeave.id, selectedAssignmentId, {
                replacementOfficerId: Number(replacementOfficerId)
            });
            alert("Shift reassigned successfully!");
            
            // Reload shifts for this leave to see what's remaining
            const shifts = await leaveRequestApi.getAffectedShifts(selectedLeave.id);
            if (shifts.length === 0) {
                // All shifts reassigned, leave is now fully approved
                alert("All shifts fully reassigned. Leave is now APPROVED.");
                setSelectedLeave(null);
                await loadData();
            } else {
                if (!Array.isArray(shifts)) throw new Error("API returned an invalid shifts format after reassignment");
                setAffectedShifts(shifts);
                setSelectedShiftId(null);
                setEligibleReplacements([]);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to reassign shift");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "text-yellow-400";
            case "PENDING_REASSIGNMENT": return "text-orange-400";
            case "APPROVED": return "text-green-400";
            case "REJECTED": return "text-red-400";
            default: return "text-gray-400";
        }
    };

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">Leave Approvals</h1>

            <div className="bg-[#1A1A1A] rounded border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#0D0D0D] border-b border-gray-800">
                        <tr>
                            <th className="p-4 text-gray-400 font-normal">Officer</th>
                            <th className="p-4 text-gray-400 font-normal">Client</th>
                            <th className="p-4 text-gray-400 font-normal">Dates</th>
                            <th className="p-4 text-gray-400 font-normal w-1/4">Reason</th>
                            <th className="p-4 text-gray-400 font-normal">Status</th>
                            <th className="p-4 text-gray-400 font-normal text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {error ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-red-500 bg-red-900/20">
                                    Error loading requests: {error}
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    No branch leave requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((r) => (
                                <tr key={r.id} className="border-b border-gray-800 last:border-0 hover:bg-[#222]">
                                    <td className="p-4">{r.employeeName}</td>
                                    <td className="p-4">{r.clientCompanyName}</td>
                                    <td className="p-4">
                                        {r.startDate} <br/><span className="text-gray-500">to</span><br/> {r.endDate}
                                    </td>
                                    <td className="p-4 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                                    <td className={`p-4 font-medium ${getStatusColor(r.status)}`}>
                                        {r.status === "PENDING_REASSIGNMENT" ? "REASSIGNMENT REQUIRED" : r.status}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {r.status === "PENDING" && (
                                            <>
                                                <button 
                                                    onClick={() => handleApprove(r.id)}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-[#D4AF37] text-black font-medium border border-[#D4AF37] hover:bg-yellow-600 rounded text-sm disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(r.id)}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-transparent text-gray-400 border border-gray-600 hover:text-red-400 hover:border-red-400 rounded text-sm disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {r.status === "PENDING_REASSIGNMENT" && (
                                            <button 
                                                onClick={() => openReassignmentFlow(r)}
                                                disabled={loading}
                                                className="px-3 py-1 bg-orange-600 text-white font-medium hover:bg-orange-500 rounded text-sm disabled:opacity-50"
                                            >
                                                Reassign Shifts
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reassignment Modal */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1A1A] rounded-lg w-full max-w-4xl border border-[#D4AF37] flex overflow-hidden max-h-[90vh]">
                        {/* Left Side: Affected Shifts */}
                        <div className="w-1/2 p-6 border-r border-gray-800 overflow-y-auto">
                            <h2 className="text-xl font-bold text-[#D4AF37] mb-2">Affected Shifts</h2>
                            <p className="text-sm text-gray-400 mb-6">Select a shift to reassign to a replacement officer.</p>

                            <div className="space-y-3">
                                {affectedShifts.length === 0 ? (
                                    <p className="text-gray-500">No remaining shifts to reassign.</p>
                                ) : (
                                    affectedShifts.map(shift => (
                                        <div 
                                            key={shift.shiftId}
                                            onClick={() => handleSelectShiftForReassign(shift)}
                                            className={`p-3 border rounded cursor-pointer transition ${selectedShiftId === shift.shiftId ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-gray-700 hover:border-gray-500'}`}
                                        >
                                            <p className="font-bold">{shift.date} — {shift.shiftType}</p>
                                            <p className={`text-sm ${selectedShiftId === shift.shiftId ? 'text-gray-800' : 'text-gray-400'}`}>
                                                Officer: {shift.currentOfficerName}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Side: Eligible Replacements */}
                        <div className="w-1/2 p-6 flex flex-col">
                            <h2 className="text-xl font-bold text-[#D4AF37] mb-4">Eligible Replacements</h2>
                            
                            {!selectedShiftId ? (
                                <p className="text-gray-500 flex-grow">Select a shift on the left to view available replacement officers.</p>
                            ) : (
                                <div className="flex-grow flex flex-col">
                                    <p className="text-sm text-gray-400 mb-4">
                                        These officers have been validated against the 60-shifts/month, 7-consecutive-day, and duplicate-shift rules.
                                    </p>
                                    
                                    {eligibleReplacements.length === 0 ? (
                                        <div className="p-4 bg-red-900/20 border border-red-900 rounded text-red-400">
                                            No eligible replacement officers available for this shift. All available officers either exceed monthly limits or consecutive working days.
                                        </div>
                                    ) : (
                                        <select 
                                            value={replacementOfficerId}
                                            onChange={(e) => setReplacementOfficerId(e.target.value === "" ? "" : Number(e.target.value))}
                                            className="w-full bg-[#0D0D0D] border border-[#D4AF37] text-white p-3 rounded mb-6"
                                        >
                                            <option value="" disabled>--- Select Replacement Officer ---</option>
                                            {eligibleReplacements.map(officer => (
                                                <option key={officer.officerId} value={officer.officerId}>
                                                    {officer.officerName} (ID: {officer.officerId})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    <div className="mt-auto flex justify-end">
                                        <button 
                                            onClick={submitReassignment}
                                            disabled={loading || replacementOfficerId === ""}
                                            className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded hover:bg-yellow-600 disabled:opacity-50"
                                        >
                                            {loading ? "Reassigning..." : "Confirm Reassignment"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                                <button 
                                    onClick={() => setSelectedLeave(null)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
