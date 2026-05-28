import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '../api/applicationsApi';
import { Badge } from '../components/ui/badge';
import { Table, Td, Th } from '../components/ui/table';
import { EmptyState } from '../components/EmptyState';

function tone(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('accept')) return 'green';
  if (value.includes('reject')) return 'red';
  if (value.includes('review')) return 'amber';
  return 'slate';
}

export function ApplicationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['applications'], queryFn: applicationsApi.mine });
  const applications = data?.applications || [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Applications</h1><p className="text-sm text-muted-foreground">Track your recruitment progress.</p></div>
      {isLoading ? <div className="h-40 rounded-lg border bg-card" /> : applications.length ? (
        <Table>
          <thead><tr><Th>Job</Th><Th>Company</Th><Th>Status</Th><Th>Date</Th></tr></thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.application_id}>
                <Td>{app.title}</Td>
                <Td>{app.company_name}</Td>
                <Td><Badge tone={tone(app.status)}>{app.status || 'Pending'}</Badge></Td>
                <Td>{app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <EmptyState title="No applications yet" />}
    </div>
  );
}
