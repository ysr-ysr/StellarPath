import { apiClient } from './client';

function assertSkillId(id) {
  if (id === undefined || id === null || id === '') {
    throw new Error('Skill id is required.');
  }
}

function normalizeSkillPayload(payload) {
  return {
    category: payload.category?.trim() || null,
    name: payload.name?.trim(),
    level: payload.level?.trim() || null,
  };
}

export const skillsApi = {
  list: async () => (await apiClient.get('/skills')).data,
  create: async (payload) => (await apiClient.post('/skills', normalizeSkillPayload(payload))).data,
  update: async (id, payload) => {
    assertSkillId(id);
    return (await apiClient.put(`/skills/${id}`, normalizeSkillPayload(payload))).data;
  },
  remove: async (id) => {
    assertSkillId(id);
    return (await apiClient.delete(`/skills/${id}`)).data;
  },
};
