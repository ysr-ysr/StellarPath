import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../api/jobsApi';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, Td, Th } from '../components/ui/table';
import { EmptyState } from '../components/EmptyState';

export function CompanyApplicationsPage() {
  const [jobId, setJobId] = useState('');
  const jobs = useQuery({ queryKey: ['companyJobs'], queryFn: jobsApi.listCompany });
  const applications = useQuery({
    queryKey: ['jobApplications', jobId],
    queryFn: () => jobsApi.listApplications(jobId),
    enabled: Boolean(jobId),
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Application Review</h1><p className="text-sm text-muted-foreground">Review applications by job.</p></div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row">
          <Select value={jobId} onChange={(event) => setJobId(event.target.value)}>
            <option value="">Select job</option>
            {(jobs.data?.jobs || []).map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </Select>
          <Button variant="outline" disabled={!jobId} onClick={() => applications.refetch()}>Refresh</Button>
        </CardContent>
      </Card>
      {(applications.data?.applications || []).length ? (
        <Table>
          <thead><tr><Th>Candidate</Th><Th>Email</Th><Th>Status</Th><Th>Date</Th></tr></thead>
          <tbody>{applications.data.applications.map((app) => (
            <tr key={app.application_id}>
              <Td>{app.name}</Td>
              <Td>{app.email}</Td>
              <Td><Badge>{app.status}</Badge></Td>
              <Td>{new Date(app.created_at).toLocaleDateString()}</Td>
            </tr>
          ))}</tbody>
        </Table>
      ) : <EmptyState title={jobId ? 'No applications for this job' : 'Select a job'} />}
    </div>
  );
}
