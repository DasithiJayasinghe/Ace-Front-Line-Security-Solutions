import { useEffect, useState } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { ShiftAssignmentModal } from "./ShiftAssignmentModal";

type Assignment = {
    id: number;
    shiftId: number;
    securityOfficerId: number;
    securityOfficerName: string;
};

type ShiftItem = {
    id: number;
    scheduleId: number;
    date: string;
    shiftType: "DAY" | "NIGHT";
    assignments: Assignment[];
};

type ScheduleData = {
    id: number;
    clientCompanyId: number;
    clientCompanyName: string;
    month: number;
    year: number;
    status: string;
    shifts?: ShiftItem[];
};

export const MonthlyCalendarView = ({
                                        scheduleId,
                                        month,
                                        year,
                                        isReadOnly = false,
                                        mode = "JSO",
                                    }: {
    scheduleId: number;
    month: number;
    year: number;
    isReadOnly?: boolean;
    mode?: "JSO" | "AREA_MANAGER";
}) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [shiftType, setShiftType] = useState<"DAY" | "NIGHT" | null>(null);
    const [schedule, setSchedule] = useState<ScheduleData | null>(null);
    const [searchOfficerId, setSearchOfficerId] = useState<string>("");

    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const loadSchedule = async () => {
        try {
            const data = await shiftScheduleApi.getScheduleById(scheduleId);
            setSchedule(data);
        } catch (error) {
            console.error("Failed to load schedule", error);
        }
    };

    useEffect(() => {
        loadSchedule();
    }, [scheduleId]);

    const openModal = (day: number, type: "DAY" | "NIGHT") => {
        if (isReadOnly) return;

        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setSelectedDate(dateStr);
        setShiftType(type);
    };

    const getShiftForDay = (day: number, type: "DAY" | "NIGHT") => {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return schedule?.shifts?.find(
            (shift) => shift.date === dateStr && shift.shiftType === type
        );
    };

    const isMatchingShift = (assignments: Assignment[]) => {
        if (!searchOfficerId.trim()) return false;

        return assignments.some(
            (a) => String(a.securityOfficerId) === searchOfficerId.trim()
        );
    };

    const getShiftButtonClass = (
        assignments: Assignment[],
        type: "DAY" | "NIGHT"
    ) => {
        const count = assignments.length;
        const matching = isMatchingShift(assignments);

        if (matching) {
            return "bg-[#D4AF37] text-black font-bold ring-2 ring-white";
        }

        if (count > 0) {
            return type === "DAY"
                ? "bg-yellow-700 text-white"
                : "bg-blue-700 text-white";
        }

        return "bg-[#1A1A1A] text-white";
    };

    return (
        <div className="bg-[#0D0D0D] text-white p-4 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-2xl text-[#D4AF37]">Calendar Map</h2>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search by Officer ID"
                        value={searchOfficerId}
                        onChange={(e) => setSearchOfficerId(e.target.value)}
                        className="bg-[#1A1A1A] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                        onClick={() => setSearchOfficerId("")}
                        className="px-3 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-[#D4AF37]"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                    const dayShift = getShiftForDay(day, "DAY");
                    const nightShift = getShiftForDay(day, "NIGHT");

                    const dayAssignments = dayShift?.assignments || [];
                    const nightAssignments = nightShift?.assignments || [];

                    return (
                        <div
                            key={day}
                            className="border border-gray-800 rounded p-2 flex flex-col items-center min-h-[150px]"
                        >
                            <span className="text-gray-400 text-sm mb-2">{day}</span>

                            <div className="w-full flex flex-col gap-2">
                                <button
                                    onClick={() => openModal(day, "DAY")}
                                    disabled={isReadOnly}
                                    className={`w-full text-xs py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getShiftButtonClass(
                                        dayAssignments,
                                        "DAY"
                                    )}`}
                                >
                                    Day ({dayAssignments.length})
                                </button>

                                {dayAssignments.length ? (
                                    <div className="text-[10px] text-gray-300 space-y-1">
                                        {dayAssignments.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`truncate ${
                                                    searchOfficerId.trim() &&
                                                    String(a.securityOfficerId) === searchOfficerId.trim()
                                                        ? "text-[#D4AF37] font-bold"
                                                        : ""
                                                }`}
                                            >
                                                {a.securityOfficerName} (ID: {a.securityOfficerId})
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <button
                                    onClick={() => openModal(day, "NIGHT")}
                                    disabled={isReadOnly}
                                    className={`w-full text-xs py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getShiftButtonClass(
                                        nightAssignments,
                                        "NIGHT"
                                    )}`}
                                >
                                    Night ({nightAssignments.length})
                                </button>

                                {nightAssignments.length ? (
                                    <div className="text-[10px] text-gray-300 space-y-1">
                                        {nightAssignments.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`truncate ${
                                                    searchOfficerId.trim() &&
                                                    String(a.securityOfficerId) === searchOfficerId.trim()
                                                        ? "text-[#D4AF37] font-bold"
                                                        : ""
                                                }`}
                                            >
                                                {a.securityOfficerName} (ID: {a.securityOfficerId})
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedDate && shiftType && (
                <ShiftAssignmentModal
                    isOpen={!!selectedDate}
                    onClose={() => {
                        setSelectedDate(null);
                        setShiftType(null);
                        loadSchedule();
                    }}
                    scheduleId={scheduleId}
                    date={selectedDate}
                    shiftType={shiftType}
                    isReadOnly={isReadOnly}
                    mode={mode}
                />
            )}
        </div>
    );
};