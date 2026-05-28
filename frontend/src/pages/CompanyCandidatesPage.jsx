import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../api/jobsApi';
import { Card, CardContent } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Table, Td, Th } from '../components/ui/table';
import { EmptyState } from '../components/EmptyState';

export function CompanyCandidatesPage() {
  const [jobId, setJobId] = useState('');
  const jobs = useQuery({ queryKey: ['companyJobs'], queryFn: jobsApi.listCompany });
  const applications = useQuery({
    queryKey: ['candidateApplications', jobId],
    queryFn: () => jobsApi.listApplications(jobId),
    enabled: Boolean(jobId),
  });
  const candidates = applications.data?.applications || [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Candidates</h1><p className="text-sm text-muted-foreground">View candidates that applied to your company jobs.</p></div>
      <Card>
        <CardContent className="p-5">
          <Select value={jobId} onChange={(event) => setJobId(event.target.value)}>
            <option value="">Select job</option>
            {(jobs.data?.jobs || []).map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </Select>
        </CardContent>
      </Card>
      {candidates.length ? (
        <Table>
          <thead><tr><Th>Candidate ID</Th><Th>Name</Th><Th>Email</Th><Th>Application Status</Th></tr></thead>
          <tbody>{candidates.map((candidate) => (
            <tr key={candidate.application_id}>
              <Td>{candidate.candidate_id}</Td>
              <Td>{candidate.name}</Td>
              <Td>{candidate.email}</Td>
              <Td>{candidate.status}</Td>
            </tr>
          ))}</tbody>
        </Table>
      ) : <EmptyState title={jobId ? 'No candidates for this job' : 'Select a job'} description="The backend exposes candidates through job applications." />}
    </div>
  );
}
