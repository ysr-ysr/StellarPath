import { apiClient } from './client';

export const interviewApi = {
  start: async (payload) => (await apiClient.post('/interview/start', payload)).data,
  answer: async (payload) => (await apiClient.post('/interview/answer', payload)).data,
  report: async (sessionId) => (await apiClient.get(`/interview/report/${sessionId}`)).data,
};
