import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { skillsApi } from '../api/skillsApi';
import { projectsApi } from '../api/projectsApi';
import { useAuthStore } from '../store/authStore';
import { decodeJwt } from '../utils/jwt';

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function useCandidateIdentity() {
  const user = useAuthStore((state) => state.user);
  const decodedToken = useAuthStore((state) => state.decodedToken);
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  const enabled = role === 'candidate';
  const skills = useQuery({
    queryKey: ['skills', 'candidateIdentity'],
    queryFn: skillsApi.list,
    enabled,
    retry: 1,
  });
  const projects = useQuery({
    queryKey: ['projects', 'candidateIdentity'],
    queryFn: projectsApi.list,
    enabled,
    retry: 1,
  });

  const candidateId = useMemo(() => {
    const tokenPayload = decodedToken || decodeJwt(token);
    const directCandidates = [
      user?.candidate_id,
      user?.candidateId,
      tokenPayload?.candidate_id,
      tokenPayload?.candidateId,
    ];

    for (const value of directCandidates) {
      const id = positiveInteger(value);
      if (id) return id;
    }

    const skill = (skills.data?.skills || []).find((item) => positiveInteger(item.candidate_id));
    if (skill) return positiveInteger(skill.candidate_id);

    const project = (projects.data?.projects || []).find((item) => positiveInteger(item.candidate_id));
    if (project) return positiveInteger(project.candidate_id);

    return null;
  }, [decodedToken, projects.data, skills.data, token, user]);

  return {
    candidateId,
    isLoading: skills.isLoading || projects.isLoading,
    error: skills.error || projects.error,
    canResolve: Boolean(candidateId),
  };
}
