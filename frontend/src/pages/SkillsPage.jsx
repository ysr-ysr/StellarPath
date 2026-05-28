import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { skillsApi } from '../api/skillsApi';
import { getApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

export function SkillsPage() {
  const queryClient = useQueryClient();
  const [formSkill, setFormSkill] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['skills'], queryFn: skillsApi.list });
  const skills = data?.skills || [];

  const save = useMutation({
    mutationFn: (values) => formSkill?.id ? skillsApi.update(formSkill.id, values) : skillsApi.create(values),
    onSuccess: () => {
      toast.success(formSkill?.id ? 'Skill updated' : 'Skill created');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setFormSkill(null);
      reset();
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const remove = useMutation({
    mutationFn: skillsApi.remove,
    onSuccess: () => {
      toast.success('Skill deleted');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const openForm = (skill = null) => {
    setFormSkill(skill || { id: null });
    reset(skill || { category: '', name: '', level: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Skills</h1><p className="text-sm text-muted-foreground">Maintain your candidate skill inventory.</p></div>
        <Button onClick={() => openForm()}><Plus className="h-4 w-4" /> Add skill</Button>
      </div>
      {error && <ErrorState message={getApiError(error)} onRetry={refetch} />}
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map((i) => <Card key={i} className="h-28" />)}</div> : (
        skills.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill.id}>
              <CardHeader><CardTitle>{skill.name}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{skill.category || 'Uncategorized'}</p>
                <p className="mt-1 text-sm">{skill.level || 'No level set'}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openForm(skill)}><Edit className="h-4 w-4" /> Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(skill)}><Trash2 className="h-4 w-4" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div> : <EmptyState title="No skills yet" description="Add your technical and professional skills." />
      )}
      <Dialog open={Boolean(formSkill)} title={formSkill?.id ? 'Edit skill' : 'Create skill'} onClose={() => setFormSkill(null)}>
        <form className="space-y-4" onSubmit={handleSubmit((values) => save.mutate(values))}>
          <Input placeholder="Category" {...register('category')} />
          <Input placeholder="Skill name" {...register('name', { required: true })} />
          <Input placeholder="Level" {...register('level')} />
          <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save skill'}</Button>
        </form>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} title="Delete skill" description="This skill will be removed from your profile." onClose={() => setDeleting(null)} onConfirm={() => deleting?.id && remove.mutate(deleting.id)} loading={remove.isPending} />
    </div>
  );
}
