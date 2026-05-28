import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { applicationsApi } from '../api/applicationsApi';
import { getApiError } from '../api/client';
import { jobsApi } from '../api/jobsApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ErrorState } from '../components/ErrorState';

export function JobDetailsPage() {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['job', id], queryFn: () => jobsApi.get(id) });
  const job = data?.job;
  const apply = useMutation({
    mutationFn: () => applicationsApi.apply(id),
    onSuccess: () => toast.success('Application submitted'),
    onError: (err) => toast.error(getApiError(err)),
  });

  if (error) return <ErrorState message={getApiError(error)} onRetry={refetch} />;
  if (isLoading || !job) return <Card className="h-80" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{job.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{job.company} · {job.location || 'Remote'}</p>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-6">{job.description || 'No description provided.'}</div>
          <Button className="mt-6" onClick={() => apply.mutate()} disabled={apply.isPending}>
            {apply.isPending ? 'Applying...' : 'Apply'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
