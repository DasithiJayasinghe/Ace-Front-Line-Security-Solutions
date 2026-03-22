import { useState, useEffect } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

type ScheduleItem = {
    id: number;
    clientCompanyId: number;
    clientCompanyName: string;
    month: number;
    year: number;
    status: string;
    submittedDate: string | null;
    approvedDate: string | null;
};

type ClientCompanyOption = {
    id: number;
    name: string;
};

type ViewMode = "submitted" | "approved";

export default function AreaManagerSchedulePage() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [approvedSchedules, setApprovedSchedules] = useState<ScheduleItem[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [clientCompanies, setClientCompanies] = useState<ClientCompanyOption[]>([]);
    const [selectedClientCompanyId, setSelectedClientCompanyId] = useState<number | null>(null);
    const [monthYearOptions, setMonthYearOptions] = useState<
        Array<{ month: number; year: number }>
    >([]);

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [viewMode, setViewMode] = useState<ViewMode>("submitted");

    const loadSchedules = async () => {
        try {
            setLoading(true);

            if (viewMode === "submitted") {
                const submittedData = selectedClientCompanyId
                    ? await shiftScheduleApi.getSubmittedByCompanyAndMonthYear(
                          selectedClientCompanyId,
                          selectedMonth,
                          selectedYear
                      )
                    : await shiftScheduleApi.getSubmittedAllByMonthYear(
                          selectedMonth,
                          selectedYear
                      );

                // Extra safety: even if the DB/endpoint still returns some
                // APPROVED rows under SUBMITTED, we can suppress them in UI.
                const approvedData = selectedClientCompanyId
                    ? await shiftScheduleApi.getApprovedByCompanyAndMonthYear(
                          selectedClientCompanyId,
                          selectedMonth,
                          selectedYear
                      )
                    : await shiftScheduleApi.getApprovedAllByMonthYear(
                          selectedMonth,
                          selectedYear
                      );

                const approvedCompanyIds = new Set(
                    (Array.isArray(approvedData) ? approvedData : []).map(
                        (s) => s.clientCompanyId
                    )
                );

                const filteredSubmitted = (Array.isArray(submittedData) ? submittedData : []).filter(
                    (s) =>
                        s.clientCompanyId != null && !approvedCompanyIds.has(s.clientCompanyId)
                );

                setApprovedSchedules(Array.isArray(approvedData) ? approvedData : []);
                setSchedules(filteredSubmitted);
            } else {
                const approvedData = selectedClientCompanyId
                    ? await shiftScheduleApi.getApprovedByCompanyAndMonthYear(
                          selectedClientCompanyId,
                          selectedMonth,
                          selectedYear
                      )
                    : await shiftScheduleApi.getApprovedAllByMonthYear(
                          selectedMonth,
                          selectedYear
                      );

                setApprovedSchedules([]);
                setSchedules(Array.isArray(approvedData) ? approvedData : []);
            }
        } catch (error) {
            console.error(error);
            alert(
                viewMode === "submitted"
                    ? "Failed to load submitted schedules."
                    : "Failed to load approved schedules."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const data: ClientCompanyOption[] = await shiftScheduleApi.getClientCompanies();
                setClientCompanies(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setClientCompanies([]);
            }
        };

        loadCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Let the user pick any month (even if a schedule doesn't exist yet),
        // so they can create/assign it on demand.
        const YEAR_START = 2020;
        const YEAR_END = 2030;

        const opts: Array<{ month: number; year: number }> = [];
        for (let y = YEAR_START; y <= YEAR_END; y++) {
            for (let m = 1; m <= 12; m++) {
                opts.push({ month: m, year: y });
            }
        }
        setMonthYearOptions(opts);

        const initialYear =
            currentYear < YEAR_START || currentYear > YEAR_END ? YEAR_START : currentYear;
        setSelectedYear(initialYear);
        setSelectedMonth(currentMonth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const displayCompanies = selectedClientCompanyId
        ? clientCompanies.filter((c) => c.id === selectedClientCompanyId)
        : clientCompanies;

    const scheduleByCompanyId = new Map<number, ScheduleItem>();
    schedules.forEach((s) => {
        if (s?.clientCompanyId == null) return;

        // Hard-filter by view to avoid any accidental mixing.
        if (viewMode === "submitted" && s.status !== "SUBMITTED") return;
        if (viewMode === "approved" && s.status !== "APPROVED") return;

        scheduleByCompanyId.set(s.clientCompanyId, s);
    });

    const approvedByCompanyId = new Map<number, ScheduleItem>();
    approvedSchedules.forEach((s) => {
        if (s?.clientCompanyId == null) return;
        approvedByCompanyId.set(s.clientCompanyId, s);
    });

    const visibleCompanies =
        viewMode === "approved"
            ? displayCompanies.filter((c) => scheduleByCompanyId.has(c.id))
            : displayCompanies.filter((c) => !approvedByCompanyId.has(c.id));

    const handleSelectOrCreateCompanySchedule = async (companyId: number) => {
        const existing = scheduleByCompanyId.get(companyId);
        if (existing) {
            await handleSelectSchedule(existing);
            return;
        }

        if (viewMode === "approved") return; // do not create in approved view

        try {
            setLoading(true);

            const created = await shiftScheduleApi.createSchedule({
                clientCompanyId: companyId,
                month: selectedMonth,
                year: selectedYear,
            });

            // Auto-submit so it appears in the "Submitted" list immediately.
            await shiftScheduleApi.submitSchedule(created.id);

            // Refresh the list so the created schedule shows up for this month/company.
            await loadSchedules();

            const full = await shiftScheduleApi.getScheduleById(created.id);
            setSelectedSchedule(full);
        } catch (e) {
            console.error(e);
            alert("Failed to create schedule for this company/month.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
        // Reload when the selected company changes.
    }, [viewMode, selectedClientCompanyId, selectedMonth, selectedYear]);

    const handleSelectSchedule = async (schedule: ScheduleItem) => {
        try {
            setLoading(true);
            const fullSchedule = await shiftScheduleApi.getScheduleById(schedule.id);
            setSelectedSchedule(fullSchedule);
        } catch (error) {
            console.error(error);
            alert("Failed to load schedule details.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedSchedule) return;

        try {
            setLoading(true);
            await shiftScheduleApi.approveSchedule(selectedSchedule.id);
            alert("Schedule Approved!");
            setSelectedSchedule(null);
            setViewMode("approved");
        } catch (error: unknown) {
            let message = "Error approving schedule.";

            if (typeof error === "object" && error !== null && "response" in error) {
                const err = error as {
                    response?: { data?: { message?: string } };
                };
                message = err.response?.data?.message || message;
            }

            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">
                {viewMode === "submitted" ? "Submitted Schedules Review" : "Approved Schedules"}
            </h1>

            {!selectedSchedule ? (
                <div className="space-y-4">
                    <div className="flex gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSchedule(null);
                                setViewMode("submitted");
                            }}
                            className={`px-4 py-2 rounded border ${
                                viewMode === "submitted"
                                    ? "border-[#D4AF37] text-[#D4AF37] bg-[#1A1A1A]"
                                    : "border-gray-800 text-white bg-[#0D0D0D]"
                            }`}
                        >
                            Submitted
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSchedule(null);
                                setViewMode("approved");
                            }}
                            className={`px-4 py-2 rounded border ${
                                viewMode === "approved"
                                    ? "border-[#D4AF37] text-[#D4AF37] bg-[#1A1A1A]"
                                    : "border-gray-800 text-white bg-[#0D0D0D]"
                            }`}
                        >
                            Approved Schedules
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#1A1A1A] p-4 rounded border border-gray-800 flex items-center gap-3">
                            <label className="text-xs text-[#D4AF37] w-[160px]">Client Company</label>
                            <select
                                value={selectedClientCompanyId ?? ""}
                                onChange={(e) =>
                                    setSelectedClientCompanyId(
                                        e.target.value
                                            ? parseInt(e.target.value, 10)
                                            : null
                                    )
                                }
                                className="flex-grow bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                            >
                                <option value="">All Companies</option>
                                {clientCompanies.length > 0 ? (
                                    clientCompanies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">Loading...</option>
                                )}
                            </select>
                        </div>

                        <div className="bg-[#1A1A1A] p-4 rounded border border-gray-800 flex items-center gap-3">
                            <label className="text-xs text-[#D4AF37] w-[160px]">Month</label>
                            <select
                                value={`${selectedMonth}-${selectedYear}`}
                                onChange={(e) => {
                                    const [mStr, yStr] = e.target.value.split("-");
                                    const m = parseInt(mStr, 10);
                                    const y = parseInt(yStr, 10);
                                    setSelectedSchedule(null);
                                    setSelectedMonth(m);
                                    setSelectedYear(y);
                                }}
                                className="flex-grow bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                            >
                                {monthYearOptions.length > 0 ? (
                                    monthYearOptions.map((o) => (
                                        <option key={`${o.month}-${o.year}`} value={`${o.month}-${o.year}`}>
                                            {o.month}/{o.year}
                                        </option>
                                    ))
                                ) : (
                                    <option value={`${currentMonth}-${currentYear}`}>Loading...</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-gray-400">Loading schedules...</p>
                    ) : clientCompanies.length === 0 ? (
                        <p className="text-gray-400">Loading companies...</p>
                    ) : (
                        <div className="grid gap-4">
                            {visibleCompanies.map((c) => {
                                const existing = scheduleByCompanyId.get(c.id);
                                const approved = approvedByCompanyId.get(c.id);
                                const disabled =
                                    viewMode === "submitted"
                                        ? approved != null
                                        : viewMode === "approved" && !existing;

                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => {
                                            if (disabled) return;
                                            handleSelectOrCreateCompanySchedule(c.id);
                                        }}
                                        className={`bg-[#1A1A1A] p-4 rounded border border-gray-800 hover:border-[#D4AF37] flex justify-between items-center transition ${
                                            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                        }`}
                                    >
                                        <div>
                                            <h3 className="text-xl text-white">
                                                {c.name} - {selectedMonth}/{selectedYear}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {viewMode === "submitted" ? (
                                                    approved ? (
                                                        approved.approvedDate
                                                            ? `Approved: ${new Date(approved.approvedDate).toLocaleDateString()}`
                                                            : "Approved already"
                                                    ) : existing?.submittedDate ? (
                                                        `Submitted: ${new Date(existing.submittedDate).toLocaleDateString()}`
                                                    ) : (
                                                        "Not submitted yet"
                                                    )
                                                ) : existing?.approvedDate ? (
                                                    `Approved: ${new Date(existing.approvedDate).toLocaleDateString()}`
                                                ) : (
                                                    ""
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-[#D4AF37]">
                                            {viewMode === "submitted"
                                                ? approved
                                                    ? "Approved"
                                                    : existing
                                                    ? "Review →"
                                                    : "Create & Assign →"
                                                : existing
                                                ? "View →"
                                                : "—"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <button
                        onClick={() => setSelectedSchedule(null)}
                        className="text-gray-400 hover:text-white"
                    >
                        ← Back to List
                    </button>

                    <div className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded border border-[#D4AF37]">
                        <div>
                            <h2 className="text-xl text-[#D4AF37]">
                                {selectedSchedule.clientCompanyName} ({selectedSchedule.month}/
                                {selectedSchedule.year})
                            </h2>
                            <p className="text-sm text-gray-400">
                                Status: {selectedSchedule.status}
                            </p>
                        </div>

                        <button
                            onClick={handleApprove}
                            disabled={loading || viewMode !== "submitted"}
                            className="bg-[#D4AF37] text-black px-6 py-2 rounded hover:bg-yellow-600 font-bold disabled:opacity-50"
                        >
                            {loading ? "Approving..." : "Approve Schedule"}
                        </button>
                    </div>

                    <MonthlyCalendarView
                        scheduleId={selectedSchedule.id}
                        month={selectedSchedule.month}
                        year={selectedSchedule.year}
                        isReadOnly={
                            viewMode === "approved"
                        }
                    />
                </div>
            )}
        </div>
    );
}