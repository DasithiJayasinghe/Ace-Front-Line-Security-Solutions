import { useEffect, useState } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

type ScheduleItem = {
    id: number;
    clientCompanyId: number;
    clientCompanyName: string;
    month: number;
    year: number;
    status: "SUBMITTED" | "APPROVED";
    submittedDate: string | null;
    approvedDate: string | null;
};

export default function AreaManagerSchedulePage() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
    const [loading, setLoading] = useState(false);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    // 🔥 load schedules by month
    const loadSchedules = async () => {
        try {
            setLoading(true);
            const data = await shiftScheduleApi.getAreaManagerSchedulesForMonth(
                selectedMonth,
                selectedYear
            );
            setSchedules(data);
        } catch (error) {
            console.error(error);
            alert("Failed to load schedules.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, [selectedMonth, selectedYear]);

    // 🔥 navigation
    const handlePreviousMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear((prev) => prev - 1);
        } else {
            setSelectedMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear((prev) => prev + 1);
        } else {
            setSelectedMonth((prev) => prev + 1);
        }
    };

    // 🔥 open schedule
    const handleSelectSchedule = async (schedule: ScheduleItem) => {
        try {
            setLoading(true);
            const full = await shiftScheduleApi.getScheduleById(schedule.id);
            setSelectedSchedule(full);
        } catch (error) {
            console.error(error);
            alert("Failed to load schedule.");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 approve
    const handleApprove = async () => {
        if (!selectedSchedule) return;

        try {
            setLoading(true);
            await shiftScheduleApi.approveSchedule(selectedSchedule.id);
            alert("Schedule Approved!");

            const updated: ScheduleItem = await shiftScheduleApi.getScheduleById(selectedSchedule.id);
            setSelectedSchedule(updated);

            await loadSchedules();
        } catch (error: unknown) {
            let message = "Error approving.";

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
                Area Manager - Shift Schedules
            </h1>

            {/* 🔥 Month navigation */}
            <div className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded border border-gray-800 mb-6">
                <button
                    onClick={handlePreviousMonth}
                    className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] rounded hover:bg-[#D4AF37] hover:text-black"
                >
                    ← Previous
                </button>

                <div className="text-center">
                    <p className="text-lg font-bold text-[#D4AF37]">
                        {selectedMonth}/{selectedYear}
                    </p>
                </div>

                <button
                    onClick={handleNextMonth}
                    className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] rounded hover:bg-[#D4AF37] hover:text-black"
                >
                    Next →
                </button>
            </div>

            {!selectedSchedule ? (
                <div>
                    {loading ? (
                        <p className="text-gray-400">Loading schedules...</p>
                    ) : schedules.length === 0 ? (
                        <p className="text-gray-400">No schedules found for this month.</p>
                    ) : (
                        <div className="grid gap-4">
                            {schedules.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectSchedule(s)}
                                    className="bg-[#1A1A1A] p-4 rounded border border-gray-800 hover:border-[#D4AF37] cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="text-xl">
                                            {s.clientCompanyName} - {s.month}/{s.year}
                                        </h3>

                                        <p className="text-sm text-gray-500">
                                            Status:{" "}
                                            <span
                                                className={
                                                    s.status === "APPROVED"
                                                        ? "text-green-400"
                                                        : "text-blue-400"
                                                }
                                            >
                        {s.status}
                      </span>
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {s.status === "SUBMITTED"
                                                ? `Submitted: ${
                                                    s.submittedDate
                                                        ? new Date(s.submittedDate).toLocaleDateString()
                                                        : "N/A"
                                                }`
                                                : `Approved: ${
                                                    s.approvedDate
                                                        ? new Date(s.approvedDate).toLocaleDateString()
                                                        : "N/A"
                                                }`}
                                        </p>
                                    </div>

                                    <span className="text-[#D4AF37]">Open →</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <button
                        onClick={() => setSelectedSchedule(null)}
                        className="text-gray-400 hover:text-white"
                    >
                        ← Back
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

                        {selectedSchedule.status === "SUBMITTED" && (
                            <button
                                onClick={handleApprove}
                                disabled={loading}
                                className="bg-[#D4AF37] text-black px-6 py-2 rounded hover:bg-yellow-600 font-bold"
                            >
                                {loading ? "Approving..." : "Approve"}
                            </button>
                        )}
                    </div>

                    {/* 🔥 ALWAYS editable (even approved) */}
                    <MonthlyCalendarView
                        scheduleId={selectedSchedule.id}
                        month={selectedSchedule.month}
                        year={selectedSchedule.year}
                        isReadOnly={false}
                        mode="AREA_MANAGER"
                    />
                </div>
            )}
        </div>
    );
}