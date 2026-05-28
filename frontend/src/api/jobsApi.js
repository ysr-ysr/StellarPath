import { apiClient } from './client';

export const jobsApi = {
  list: async () => (await apiClient.get('/jobs')).data,
  get: async (id) => (await apiClient.get(`/jobs/${id}`)).data,
  create: async (payload) => (await apiClient.post('/company/jobs', payload)).data,
  update: async (id, payload) => (await apiClient.put(`/company/jobs/${id}`, payload)).data,
  remove: async (id) => (await apiClient.delete(`/company/jobs/${id}`)).data,
  listCompany: async () => (await apiClient.get('/company/jobs')).data,
  listApplications: async (jobId) => (await apiClient.get(`/company/jobs/${jobId}/applications`)).data,
};
