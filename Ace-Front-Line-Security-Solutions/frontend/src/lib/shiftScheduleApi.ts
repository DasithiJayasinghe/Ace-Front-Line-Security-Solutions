import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8081/api/shift-schedules",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const authApi = {
    login: (data: { email: string; password: string }) =>
        axios.post("http://localhost:8081/api/auth/login", data).then((res) => res.data),

    me: () =>
        axios
            .get("http://localhost:8081/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((res) => res.data),
};

export const shiftScheduleApi = {
    createSchedule: (data: {
        clientCompanyId: number;
        month: number;
        year: number;
    }) => api.post("", data).then((res) => res.data),

    getScheduleById: (id: number) =>
        api.get(`/${id}`).then((res) => res.data),

    getSubmitted: () => api.get("/submitted").then((res) => res.data),

    autoGenerate: (id: number) =>
        api.post(`/${id}/auto-generate`).then((res) => res.data),

    submitSchedule: (id: number) =>
        api.put(`/${id}/submit`).then((res) => res.data),

    approveSchedule: (id: number) =>
        api.put(`/${id}/approve`).then((res) => res.data),

    assignOfficers: (
        scheduleId: number,
        data: {
            date: string;
            shiftType: "DAY" | "NIGHT";
            securityOfficerIds: number[];
        }
    ) => api.post(`/${scheduleId}/assignments`, data).then((res) => res.data),

    removeAssignment: (assignmentId: number) =>
        api.delete(`/assignments/${assignmentId}`).then((res) => res.data),

    getScheduleByCompanyAndMonthYear: (
        clientCompanyId: number,
        month: number,
        year: number
    ) =>
        api
            .get("/by-company", {
                params: { clientCompanyId, month, year },
            })
            .then((res) => res.data),

    getAreaManagerSchedulesForMonth: (month: number, year: number) =>
        api.get("/area-manager/month", { params: { month, year } }).then((res) => res.data),

    getAreaManagerApprovedHistory: () =>
        api.get("/area-manager/history").then((res) => res.data),

    assignOfficersAsAreaManager: (
        scheduleId: number,
        data: {
            date: string;
            shiftType: "DAY" | "NIGHT";
            securityOfficerIds: number[];
        }
    ) => api.post(`/area-manager/${scheduleId}/assignments`, data).then((res) => res.data),

    removeAssignmentAsAreaManager: (assignmentId: number) =>
        api.delete(`/area-manager/assignments/${assignmentId}`).then((res) => res.data),

    getMyApproved: () => api.get("/my-approved").then((res) => res.data),

    getCompanyCurrent: (companyId: number) =>
        api.get(`/client/${companyId}/current`).then((res) => res.data),

    getFilter: (params: {
        branch?: string;
        company?: string;
        month?: string;
    }) => api.get("/filter", { params }).then((res) => res.data),

};