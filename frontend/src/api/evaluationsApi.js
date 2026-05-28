import { apiClient } from './client';

export const evaluationsApi = {
  create: async (payload) => (await apiClient.post('/evaluations', payload)).data,
  byJob: async (jobId) => (await apiClient.get(`/evaluations/job/${jobId}`)).data,
  sendEmail: async (id, type) => (await apiClient.post(`/evaluations/${id}/send-email`, { type })).data,
};
