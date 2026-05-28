import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { projectsApi } from '../api/projectsApi';
import { getApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Badge } from '../components/ui/badge';
import { arrayFieldToInput, normalizeArrayField } from '../utils/arrayFields';

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [formProject, setFormProject] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  const { data, error, refetch } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });
  const projects = data?.projects || [];

  const save = useMutation({
    mutationFn: (values) => {
      const payload = {
        ...values,
        tech_stack: normalizeArrayField(values.tech_stack),
        key_achievements: normalizeArrayField(values.key_achievements),
      };
      return formProject?.id ? projectsApi.update(formProject.id, payload) : projectsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(formProject?.id ? 'Project updated' : 'Project created');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setFormProject(null);
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const remove = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const openForm = (project = null) => {
    setFormProject(project || { id: null });
    reset(project ? {
      ...project,
      tech_stack: arrayFieldToInput(project.tech_stack),
      key_achievements: arrayFieldToInput(project.key_achievements, '\n'),
    } : { name: '', description: '', tech_stack: '', key_achievements: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Projects</h1><p className="text-sm text-muted-foreground">Projects sync to AI memory for matching.</p></div>
        <Button onClick={() => openForm()}><Plus className="h-4 w-4" /> Add project</Button>
      </div>
      {error && <ErrorState message={getApiError(error)} onRetry={refetch} />}
      {projects.length ? <div className="grid gap-4 xl:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader><CardTitle>{project.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
              <ProjectTags title="Tech stack" values={project.tech_stack} />
              <ProjectAchievements values={project.key_achievements} />
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openForm(project)}><Edit className="h-4 w-4" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(project)}><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> : <EmptyState title="No projects yet" description="Add projects to improve matching and resume generation." />}
      <Dialog open={Boolean(formProject)} title={formProject?.id ? 'Edit project' : 'Create project'} onClose={() => setFormProject(null)}>
        <form className="space-y-4" onSubmit={handleSubmit((values) => save.mutate(values))}>
          <Input placeholder="Project name" {...register('name', { required: true })} />
          <Textarea placeholder="Description" {...register('description')} />
          <Input placeholder="Tech stack, comma separated" {...register('tech_stack')} />
          <Textarea placeholder="Achievements, one per line" {...register('key_achievements')} />
          <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save project'}</Button>
        </form>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} title="Delete project" description="This project will be removed from your profile." onClose={() => setDeleting(null)} onConfirm={() => deleting?.id && remove.mutate(deleting.id)} loading={remove.isPending} />
    </div>
  );
}

function ProjectTags({ title, values }) {
  const items = normalizeArrayField(values);

  if (items.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{title}: Not listed</p>;
  }

  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item} tone="slate">{item}</Badge>)}
      </div>
    </div>
  );
}

function ProjectAchievements({ values }) {
  const items = normalizeArrayField(values);

  if (items.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">Achievements: Not listed</p>;
  }

  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium">Achievements</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
