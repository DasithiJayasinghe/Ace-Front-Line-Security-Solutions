import { useState } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

type ScheduleItem = {
    id: number;
    clientCompanyId: number;
    clientCompanyName: string;
    month: number;
    year: number;
    status: string;
    submittedDate?: string | null;
    approvedDate?: string | null;
    editedByAreaManager?: boolean;
    areaManagerEditedAt?: string | null;
};

type FilterState = {
    branch: string;
    company: string;
    month: string;
};

export default function ExecutiveSchedulePage() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        branch: "",
        company: "",
        month: "",
    });

    const handleSearch = async (): Promise<void> => {
        try {
            const data: ScheduleItem[] = await shiftScheduleApi.getFilter(filters);
            setSchedules(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">
                Shift Schedules Overview
            </h1>

            {!selectedSchedule ? (
                <div className="space-y-6">
                    <div className="bg-[#1A1A1A] p-4 rounded border border-gray-800 flex gap-4 items-end">
                        <div className="flex-grow">
                            <label className="text-xs text-[#D4AF37]">Branch ID</label>
                            <input
                                type="text"
                                value={filters.branch}
                                onChange={(e) =>
                                    setFilters({ ...filters, branch: e.target.value })
                                }
                                className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                            />
                        </div>

                        <div className="flex-grow">
                            <label className="text-xs text-[#D4AF37]">Company ID</label>
                            <input
                                type="text"
                                value={filters.company}
                                onChange={(e) =>
                                    setFilters({ ...filters, company: e.target.value })
                                }
                                className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                            />
                        </div>

                        <div className="flex-grow">
                            <label className="text-xs text-[#D4AF37]">Month (1-12)</label>
                            <input
                                type="number"
                                value={filters.month}
                                onChange={(e) =>
                                    setFilters({ ...filters, month: e.target.value })
                                }
                                className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                            />
                        </div>

                        <button
                            onClick={handleSearch}
                            className="bg-[#D4AF37] text-black px-6 py-2 rounded font-bold hover:bg-yellow-600 h-[42px]"
                        >
                            Search
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {schedules.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedSchedule(s)}
                                className="bg-[#1A1A1A] p-4 rounded border border-gray-800 hover:border-[#D4AF37] cursor-pointer"
                            >
                                <h3 className="text-xl text-white">{s.clientCompanyName}</h3>
                                <p className="text-gray-400">
                                    {s.month}/{s.year} - Status: {s.status}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <button
                        onClick={() => setSelectedSchedule(null)}
                        className="text-[#D4AF37] hover:text-white"
                    >
                        ← Back to Search
                    </button>

                    <div className="bg-[#1A1A1A] p-4 rounded border border-[#D4AF37] space-y-2">
                        <h2 className="text-xl text-[#D4AF37]">
                            {selectedSchedule.clientCompanyName} ({selectedSchedule.month}/
                            {selectedSchedule.year})
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