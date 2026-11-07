import { apiClient } from './client';
import { AIExtraction, Claim } from '../types';

export const aiApi = {
  runExtraction: async (claimId: string, documentId: string): Promise<AIExtraction> => {
    const res = await apiClient.post<{ success: boolean; data: AIExtraction; message: string }>('/ai/extract', {
      claimId,
      documentId,
    });
    return res.data.data;
  },

  manualOverride: async (
    extractionId: string,
    fieldName: string,
    correctedValue: any,
    correctionReason: string
  ): Promise<{ extraction: AIExtraction; claim: Claim }> => {
    const res = await apiClient.post<{
      success: boolean;
      data: { extraction: AIExtraction; claim: Claim };
    }>('/ai/override', {
      extractionId,
      fieldName,
      correctedValue,
      correctionReason,
    });
    return res.data.data;
  },
};
