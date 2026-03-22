import axios from "axios";

export type LeaveRequestStatus = "PENDING" | "PENDING_REASSIGNMENT" | "APPROVED" | "REJECTED";

export interface LeaveRequestDTO {
    id: number;
    employeeId: number;
    employeeName: string;
    clientCompanyId: number;
    clientCompanyName: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveRequestStatus;
    rejectionReason?: string;
    createdAt: string;
    reviewedAt?: string;
    reviewedById?: number;
    reviewedByName?: string;
    replacementHandled: boolean;
}

export interface CreateLeaveRequestDTO {
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveSummaryDTO {
    monthlyLimit: number;
    usedLeaves: number;
    remainingLeaves: number;
    month: number;
    year: number;
}

export interface AffectedShiftDTO {
    shiftId: number;
    date: string;
    shiftType: string;
    currentOfficerId: number;
    currentOfficerName: string;
    assignmentId: number;
}

export interface EligibleReplacementDTO {
    officerId: number;
    officerName: string;
}

export interface ReassignShiftRequestDTO {
    replacementOfficerId: number;
}

const api = axios.create({
    baseURL: "http://localhost:8081/api/leaves",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const leaveRequestApi = {
    myRequests: async (): Promise<LeaveRequestDTO[]> => {
        const { data } = await api.get("/my");
        return data;
    },

    mySummary: async (month: number, year: number): Promise<LeaveSummaryDTO> => {
        const { data } = await api.get(`/my/summary?month=${month}&year=${year}`);
        return data;
    },

    createRequest: async (dto: CreateLeaveRequestDTO): Promise<LeaveRequestDTO> => {
        const { data } = await api.post("", dto);
        return data;
    },

    branchRequests: async (status?: LeaveRequestStatus): Promise<LeaveRequestDTO[]> => {
        const url = status ? `/branch?status=${status}` : "/branch";
        const { data } = await api.get(url);
        return data;
    },

    approveLeave: async (id: number): Promise<void> => {
        await api.put(`/${id}/approve`);
    },

    rejectLeave: async (id: number, reason?: string): Promise<void> => {
        const url = reason ? `/${id}/reject?reason=${encodeURIComponent(reason)}` : `/${id}/reject`;
        await api.put(url);
    },

    getAffectedShifts: async (id: number): Promise<AffectedShiftDTO[]> => {
        const { data } = await api.get(`/${id}/affected-shifts`);
        return data;
    },

    getEligibleReplacements: async (id: number, shiftId: number): Promise<EligibleReplacementDTO[]> => {
        const { data } = await api.get(`/${id}/eligible-replacements/${shiftId}`);
        return data;
    },

    reassignShift: async (id: number, assignmentId: number, dto: ReassignShiftRequestDTO): Promise<void> => {
        await api.put(`/${id}/assignments/${assignmentId}/reassign`, dto);
    },
};
