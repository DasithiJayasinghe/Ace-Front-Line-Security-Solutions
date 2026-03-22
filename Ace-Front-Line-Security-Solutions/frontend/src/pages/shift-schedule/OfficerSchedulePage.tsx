import { useEffect, useState } from "react";
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
    editedByAreaManager?: boolean;
    areaManagerEditedAt?: string | null;
};

export default function OfficerSchedulePage() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);

    const loadHistory = async (): Promise<void> => {
        try {
            const data: ScheduleItem[] = await shiftScheduleApi.getMyApproved();
            setSchedules(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        void loadHistory();
    }, []);

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">My Shift Schedules</h1>

            {!selectedSchedule ? (
                <div className="space-y-4">
                    <h2 className="text-xl text-gray-200 border-b border-gray-800 pb-2">
                        Approved Schedules
                    </h2>

                    {schedules.length === 0 ? (
                        <p className="text-gray-500">No schedules available yet.</p>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-4">
                            {schedules.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedSchedule(s)}
                                    className="bg-[#1A1A1A] p-4 rounded border border-gray-800 hover:border-[#D4AF37] cursor-pointer"
                                >
                                    <h3 className="text-lg text-white">
                                        {s.month}/{s.year} - {s.clientCompanyName}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">Status: {s.status}</p>
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
                        ← Back to List
                    </button>

                    <div className="bg-[#1A1A1A] p-4 rounded border border-[#D4AF37] space-y-2">
                        <h2 className="text-xl text-[#D4AF37]">
                            {selectedSchedule.clientCompanyName} ({selectedSchedule.month}/{selectedSchedule.year})
                        </h2>

                        <p className="text-sm text-gray-400">
                            Status: {selectedSchedule.status}
                        </p>

                        {selectedSchedule.editedByAreaManager &&
                            selectedSchedule.areaManagerEditedAt && (
                                <p className="text-sm text-orange-400">
                                    This schedule was updated by the Area Manager on{" "}
                                    {new Date(selectedSchedule.areaManagerEditedAt).toLocaleString()}.
                                </p>
                            )}
                    </div>

                    <MonthlyCalendarView
                        scheduleId={selectedSchedule.id}
                        month={selectedSchedule.month}
                        year={selectedSchedule.year}
                        isReadOnly={true}
                    />
                </div>
            )}
        </div>
    );
}