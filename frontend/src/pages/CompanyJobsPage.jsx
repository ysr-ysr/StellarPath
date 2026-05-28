import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { jobsApi } from '../api/jobsApi';
import { getApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { Dialog } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

export function CompanyJobsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  const { data } = useQuery({ queryKey: ['companyJobs'], queryFn: jobsApi.listCompany });
  const jobs = data?.jobs || [];

  const save = useMutation({
    mutationFn: (values) => editing?.id ? jobsApi.update(editing.id, values) : jobsApi.create(values),
    onSuccess: () => {
      toast.success(editing?.id ? 'Job updated' : 'Job created');
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setEditing(null);
    },
    onError: (error) => toast.error(getApiError(error)),
  });
  const remove = useMutation({
    mutationFn: jobsApi.remove,
    onSuccess: () => {
      toast.success('Job deleted');
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const openForm = (job = null) => {
    setEditing(job || {});
    reset(job || { title: '', company: '', location: '', description: '', url: '', status: 'OPEN' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Company Jobs</h1><p className="text-sm text-muted-foreground">Create and manage company-owned roles.</p></div>
        <Button onClick={() => openForm()}><Plus className="h-4 w-4" /> Create job</Button>
      </div>
      {jobs.length ? <div className="grid gap-4 xl:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader><CardTitle>{job.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{job.company} · {job.location || 'Remote'} · {job.status}</p>
              <p className="mt-3 line-clamp-3 text-sm">{job.description}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openForm(job)}><Edit className="h-4 w-4" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(job)}><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> : <EmptyState title="No jobs yet" description="Create your first job to begin collecting applications." />}
      <Dialog open={Boolean(editing)} title={editing?.id ? 'Edit job' : 'Create job'} onClose={() => setEditing(null)}>
        <form className="space-y-4" onSubmit={handleSubmit((values) => save.mutate(values))}>
          <Input placeholder="Title" {...register('title', { required: true })} />
          <Input placeholder="Company" {...register('company', { required: true })} />
          <Input placeholder="Location" {...register('location')} />
          <Textarea placeholder="Description" {...register('description')} />
          <Input placeholder="URL" {...register('url')} />
          <Select {...register('status')}>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="PAUSED">Paused</option>
          </Select>
          <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save job'}</Button>
        </form>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} title="Delete job" description="This job and linked applications may be removed." onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} loading={remove.isPending} />
    </div>
  );
}
