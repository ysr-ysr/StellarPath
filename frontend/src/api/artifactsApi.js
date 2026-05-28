import { apiClient } from './client';

async function parseBlobError(error) {
  const data = error.response?.data;

  if (data instanceof Blob) {
    const text = await data.text();

    try {
      const parsed = JSON.parse(text);
      error.response.data = parsed;
    } catch {
      error.response.data = { message: text || error.message };
    }
  }

  throw error;
}

export const artifactsApi = {
  generateResumePdf: async (payload) => {
    try {
      const response = await apiClient.post('/cv/generate', payload, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      return parseBlobError(error);
    }
  },
  analyzeJob: async (jobId, payload) => (await apiClient.post(`/ai/analyze-job/${jobId}`, payload)).data,
};
