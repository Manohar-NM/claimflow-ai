import { apiClient } from './client';
import { User } from '../types';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface DemoAccount {
  role: string;
  label: string;
  email: string;
  organization: string;
  description: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return res.data;
  },

  getCurrentUser: async (): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return res.data;
  },

  getDemoAccounts: async (): Promise<{ success: boolean; data: DemoAccount[] }> => {
    const res = await apiClient.get<{ success: boolean; data: DemoAccount[] }>('/auth/demo-accounts');
    return res.data;
  },
};

