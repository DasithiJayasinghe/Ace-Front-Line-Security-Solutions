export type ClientStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED" | "EXPIRED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Client {
    clientId: number;
    clientCode: string;
    companyName: string;
    companyRegistrationNo: string;
    vatNumber?: string;
    industryType: string;
    address: string;
    serviceLocation?: string;
    city: string;
    contactPersonName: string;
    contactPersonDesignation?: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    username: string;
    serviceStartDate: string;
    contractDurationMonths: number;
    contractEndDate?: string;
    oicCount?: number;
    jsoCount?: number;
    oicRatePerShift?: number;
    jsoRatePerShift?: number;
    otRatePerHour?: number;
    oicOtRatePerHour?: number;
    jsoOtRatePerHour?: number;
    recommendedOfficers: number;
    activeOfficersCount: number;
    totalOutstanding: number;
    riskLevel?: RiskLevel;
    status: ClientStatus;
    registeredAt: string;
    updatedAt: string;
}

export interface ClientRegistrationRequest {
    companyName: string;
    companyRegistrationNo: string;
    vatNumber?: string;
    industryType: string;
    address: string;
    serviceLocation?: string;
    city: string;
    contactPersonName: string;
    contactPersonDesignation?: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    serviceStartDate: string;
    contractDurationMonths: number;
    oicCount?: number;
    jsoCount?: number;
    oicRatePerShift?: number;
    jsoRatePerShift?: number;
    otRatePerHour?: number;
    oicOtRatePerHour?: number;
    jsoOtRatePerHour?: number;
    riskLevel?: string;
    recommendedOfficers?: number;
}

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
    serviceLocation?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    contractStatus?: string;
    oicCount?: number;
    jsoCount?: number;
    currentInvoiceStatus?: string;
    currentInvoiceAmount?: number;
    nextDueDate?: string;
    lastPaymentDate?: string;
    daysUntilDue?: number;
}

/** Matches backend InvoiceResponse DTO */
export interface Invoice {
    invoiceId: number;
    invoiceNumber: string;
    clientId?: number;
    companyName?: string;
    clientVatNumber?: string;
    serviceLocation?: string;
    billingMonth?: number;
    billingYear?: number;
    periodFrom?: string;
    periodTo?: string;
    issueDate?: string;
    dueDate?: string;
    subtotal?: number;
    deductionsTotal?: number;
    netSubtotal?: number;
    otherCharges?: number;
    invoiceAmount?: number;
    ssclAmount?: number;
    vatAmount?: number;
    totalAmount?: number;
    paidAmount?: number;
    balanceAmount?: number;
    lateFee?: number;
    invoiceType?: string;
    status: string;
    notes?: string;
    manualReason?: string;
    disputeReason?: string;
    approvedAt?: string;
    issuedAt?: string;
    verifiedAt?: string;
    createdAt?: string;
    items?: InvoiceItem[];
    payments?: PaymentRecord[];
}

/** Matches backend InvoiceItemResponse DTO */
export interface InvoiceItem {
    itemId?: number;
    itemType?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
    taxPercentage?: number;
}

/** Matches backend PaymentResponse DTO */
export interface PaymentRecord {
    paymentId?: number;
    invoiceId?: number;
    invoiceNumber?: string;
    clientId?: number;
    companyName?: string;
    amountPaid?: number;
    paymentDate?: string;
    paymentMethod?: string;
    transactionReference?: string;
    paymentProofPath?: string;
    verificationStatus?: string;
    remarks?: string;
    rejectionReason?: string;
    proofUploadedAt?: string;
    verifiedAt?: string;
    verifiedBy?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface SuccessData {
    companyName: string;
    username: string;
    temporaryPassword?: string;
    contactPersonEmail: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
