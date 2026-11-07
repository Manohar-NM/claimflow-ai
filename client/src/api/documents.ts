import { apiClient } from './client';
import { DocumentItem } from '../types';

export const documentsApi = {
  uploadDocument: async (claimId: string, documentType: string, file: File): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('claimId', claimId);
    formData.append('documentType', documentType);
    formData.append('file', file);

    const res = await apiClient.post<{ success: boolean; data: DocumentItem }>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
  },

  getDocumentFileUrl: (documentId: string): string => {
    return `/api/documents/${documentId}/file`;
  },
};
