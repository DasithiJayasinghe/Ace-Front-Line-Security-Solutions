import axios from "axios";

export interface NotificationDTO {
    id: number;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const api = axios.create({
    baseURL: "http://localhost:8081/api/notifications",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const notificationApi = {
    myNotifications: async (): Promise<NotificationDTO[]> => {
        const { data } = await api.get("/my");
        return data;
    },
    markAsRead: async (id: number): Promise<void> => {
        await api.put(`/${id}/read`);
    },
};
