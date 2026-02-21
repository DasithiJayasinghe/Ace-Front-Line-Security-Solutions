import api from './api';

export interface ClientDashboardData {
    clientId: number;
    companyName: string;
    status: string;
    activeOfficersCount: number;
    totalOutstanding: number;
    overdueInvoicesCount: number;
    pendingPaymentsCount: number;
    monthlyBaseFee: number;
    riskLevel: string;
}

export interface Invoice {
    invoiceId: number;
    invoiceNumber: string;
    billingMonth: number;
    billingYear: number;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
}

export interface OfficerAssignment {
    assignmentId: number;
    officerName: string;
    shiftType: string;
    assignedFrom: string;
    assignedTo: string | null;
    location: string;
    duties: string;
}

export const clientService = {
    // Get dashboard stats
    getDashboard: async (clientId: number) => {
        const response = await api.get(`/dashboard/client/${clientId}`);
        return response.data.data as ClientDashboardData;
    },

    // Get client invoices
    getInvoices: async (clientId: number) => {
        const response = await api.get(`/invoices/client/${clientId}`);
        return response.data.data as Invoice[];
    },

    // Get assigned officers
    getAssignedOfficers: async (clientId: number) => {
        const response = await api.get(`/officer-assignments/client/${clientId}/active`);
        return response.data.data as OfficerAssignment[];
    },

    // Submit feedback
    submitFeedback: async (clientId: number, data: {
        rating: number;
        serviceCategory: string;
        comments: string;
        improvements?: string;
    }) => {
        const response = await api.post(`/feedback/client/${clientId}`, data);
        return response.data;
    },

    // Upload payment
    uploadPayment: async (formData: FormData) => {
        const response = await api.post('/payments', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};