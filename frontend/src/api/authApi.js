import { apiClient } from './client';

export const authApi = {
  login: async (payload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },
  registerCandidate: async (payload) => {
    const { data } = await apiClient.post('/auth/register-candidate', payload);
    return data;
  },
  registerCompany: async (payload) => {
    const { data } = await apiClient.post('/auth/register-company', payload);
    return data;
  },
};
