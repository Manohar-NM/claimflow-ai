import { apiClient } from './client';
import { AuditLogItem, TPAQuery } from '../types';

export interface HospitalDashboardData {
  metrics: {
    totalClaims: number;
    draftClaims: number;
    submittedClaims: number;
    underReviewClaims: number;
    queryRaisedClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    sanctionedClaims: number;
    settledClaims: number;
  };
  financials: {
    totalClaimed: number;
    totalApproved: number;
    totalSanctioned: number;
  };
  pendingQueries: TPAQuery[];
  recentActivity: AuditLogItem[];
}

export interface TPADashboardData {
  metrics: {
    incomingClaims: number;
    pendingReview: number;
    queryRaised: number;
    approved: number;
    rejected: number;
    sanctioned: number;
    settled: number;
    overdueClaims: number;
  };
  financials: {
    totalRequestedAmount: number;
    totalAuthorizedAmount: number;
    totalSanctionedAmount: number;
  };
  urgentQueries: TPAQuery[];
}

export const dashboardApi = {
  getHospitalMetrics: async (): Promise<HospitalDashboardData> => {
    const res = await apiClient.get<{ success: boolean; data: HospitalDashboardData }>('/dashboard/hospital');
    return res.data.data;
  },

  getTPAMetrics: async (): Promise<TPADashboardData> => {
    const res = await apiClient.get<{ success: boolean; data: TPADashboardData }>('/dashboard/tpa');
    return res.data.data;
  },
};

