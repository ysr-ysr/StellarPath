import { apiClient } from './client';
import { normalizeArrayField } from '../utils/arrayFields';

function assertProjectId(id) {
  if (id === undefined || id === null || id === '') {
    throw new Error('Project id is required.');
  }
}

function normalizeProject(project) {
  return {
    ...project,
    tech_stack: normalizeArrayField(project.tech_stack),
    key_achievements: normalizeArrayField(project.key_achievements),
  };
}

function normalizeProjectsResponse(data) {
  return {
    ...data,
    projects: (data.projects || []).map(normalizeProject),
    project: data.project ? normalizeProject(data.project) : data.project,
  };
}

function normalizeProjectPayload(payload) {
  return {
    name: payload.name?.trim(),
    description: payload.description?.trim() || null,
    tech_stack: normalizeArrayField(payload.tech_stack),
    key_achievements: normalizeArrayField(payload.key_achievements),
  };
}

export const projectsApi = {
  list: async () => normalizeProjectsResponse((await apiClient.get('/projects')).data),
  create: async (payload) => normalizeProjectsResponse((await apiClient.post('/projects', normalizeProjectPayload(payload))).data),
  update: async (id, payload) => {
    assertProjectId(id);
    return normalizeProjectsResponse((await apiClient.put(`/projects/${id}`, normalizeProjectPayload(payload))).data);
  },
  remove: async (id) => {
    assertProjectId(id);
    return (await apiClient.delete(`/projects/${id}`)).data;
  },
};
