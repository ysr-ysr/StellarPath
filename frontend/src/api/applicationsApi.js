import { apiClient } from './client';

export const applicationsApi = {
  apply: async (jobId) => (await apiClient.post(`/applications/${jobId}/apply`)).data,
  mine: async () => (await apiClient.get('/applications/my-applications')).data,
};
