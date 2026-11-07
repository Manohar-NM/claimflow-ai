import { apiClient } from './client';
import { AIExtraction, AuditLogItem, Claim, DocumentItem, FinancialValidation, TPAQuery } from '../types';

export interface ClaimsFilterParams {
  status?: string;
  tpaProvider?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ClaimDetailsResponse {
  success: boolean;
  data: {
    claim: Claim;
    documents: DocumentItem[];
    aiExtractions: AIExtraction[];
    queries: TPAQuery[];
    auditLogs: AuditLogItem[];
    financialValidation: FinancialValidation;
  };
}

export const claimsApi = {
  getClaims: async (params?: ClaimsFilterParams) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Claim[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/claims', { params });
    return res.data;
  },

  getClaimById: async (id: string): Promise<ClaimDetailsResponse> => {
    const res = await apiClient.get<ClaimDetailsResponse>(`/claims/${id}`);
    return res.data;
  },

  createClaim: async (payload: any) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Claim }>('/claims', payload);
    return res.data;
  },

  updateClaim: async (id: string, payload: any) => {
    const res = await apiClient.put<{ success: boolean; message: string; data: Claim }>(`/claims/${id}`, payload);
    return res.data;
  },

  submitClaim: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Claim }>(`/claims/${id}/submit`);
    return res.data;
  },

  startReview: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Claim }>(`/claims/${id}/review`);
    return res.data;
  },

  approveClaim: async (id: string, authorizedAmount: number, remarks?: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Claim }>(`/claims/${id}/approve`, {
      authorizedAmount,
      remarks,
    });
    return res.data;
  },

  sanctionClaim: async (id: string, sanctionedAmount: number, remarks?: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Claim }>(`/claims/${id}/sanction`, {
      sanctionedAmount,
      remarks,
    });
    return res.data;
  },

  settleClaim: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Claim }>(`/claims/${id}/settle`);
    return res.data;
  },

  rejectClaim: async (id: string, rejectionReason: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Claim }>(`/claims/${id}/reject`, {
      rejectionReason,
    });
    return res.data;
  },
};
