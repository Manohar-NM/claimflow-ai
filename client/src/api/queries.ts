import { apiClient } from './client';
import { TPAQuery } from '../types';

export const queriesApi = {
  createQuery: async (claimId: string, queryText: string, deadline: string): Promise<TPAQuery> => {
    const res = await apiClient.post<{ success: boolean; data: TPAQuery }>('/queries', {
      claimId,
      queryText,
      deadline,
    });
    return res.data.data;
  },

  respondToQuery: async (
    queryId: string,
    responseText: string,
    supportingDocuments?: string[]
  ): Promise<TPAQuery> => {
    const res = await apiClient.post<{ success: boolean; data: TPAQuery }>(`/queries/${queryId}/respond`, {
      responseText,
      supportingDocuments,
    });
    return res.data.data;
  },

  resolveQuery: async (queryId: string): Promise<TPAQuery> => {
    const res = await apiClient.post<{ success: boolean; data: TPAQuery }>(`/queries/${queryId}/resolve`);
    return res.data.data;
  },

  reopenQuery: async (queryId: string, newDeadline?: string): Promise<TPAQuery> => {
    const res = await apiClient.post<{ success: boolean; data: TPAQuery }>(`/queries/${queryId}/reopen`, {
      newDeadline,
    });
    return res.data.data;
  },
};

