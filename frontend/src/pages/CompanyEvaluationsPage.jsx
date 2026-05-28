import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail, Trophy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { evaluationsApi } from '../api/evaluationsApi';
import { getApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, Td, Th } from '../components/ui/table';
import { EmptyState } from '../components/EmptyState';

export function CompanyEvaluationsPage() {
  const [jobId, setJobId] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  const ranking = useQuery({
    queryKey: ['evaluationsByJob', jobId],
    queryFn: () => evaluationsApi.byJob(jobId),
    enabled: Boolean(jobId),
  });

  const evaluate = useMutation({
    mutationFn: (values) => evaluationsApi.create({ candidate_id: Number(values.candidate_id), job_id: Number(values.job_id) }),
    onSuccess: (data) => {
      setLastEvaluation(data);
      setJobId(String(data.job_id));
      ranking.refetch();
      reset();
      toast.success('Candidate evaluated');
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const email = useMutation({
    mutationFn: ({ id, type }) => evaluationsApi.sendEmail(id, type),
    onSuccess: () => toast.success('Email sent'),
    onError: (error) => toast.error(getApiError(error)),
  });

  const evaluations = ranking.data?.evaluations || [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Candidate Evaluation</h1><p className="text-sm text-muted-foreground">Score, rank, accept, and reject candidates.</p></div>
      <Card>
        <CardHeader><CardTitle>Evaluate candidate</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit((values) => evaluate.mutate(values))}>
            <Input type="number" placeholder="Candidate ID" {...register('candidate_id', { required: true })} />
            <Input type="number" placeholder="Job ID" {...register('job_id', { required: true })} />
            <Button disabled={evaluate.isPending}>{evaluate.isPending ? 'Evaluating...' : 'Evaluate'}</Button>
          </form>
        </CardContent>
      </Card>
      {lastEvaluation && (
        <div className="grid gap-4 md:grid-cols-5">
          <ScoreCard title="Skills" value={lastEvaluation.skills_score} />
          <ScoreCard title="Projects" value={lastEvaluation.projects_score} />
          <ScoreCard title="Interview" value={lastEvaluation.interview_score} />
          <ScoreCard title="Overall" value={lastEvaluation.overall_score} large />
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recommendation</p><Badge className="mt-3">{lastEvaluation.recommendation}</Badge></CardContent></Card>
        </div>
      )}
      <Card>
        <CardHeader><CardTitle>Candidate ranking</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input type="number" placeholder="Job ID" value={jobId} onChange={(event) => setJobId(event.target.value)} />
            <Button variant="outline" disabled={!jobId} onClick={() => ranking.refetch()}>Load ranking</Button>
          </div>
          {evaluations.length ? (
            <Table>
              <thead><tr><Th>Rank</Th><Th>Candidate</Th><Th>Skills</Th><Th>Projects</Th><Th>Interview</Th><Th>Overall</Th><Th>Recommendation</Th><Th>Email</Th></tr></thead>
              <tbody>{evaluations.map((item, index) => (
                <tr key={item.id} className={index === 0 ? 'bg-primary/5' : ''}>
                  <Td>{index === 0 ? <span className="inline-flex items-center gap-1"><Trophy className="h-4 w-4 text-primary" /> 1</span> : index + 1}</Td>
                  <Td>{item.candidate_name || item.candidate_id}</Td>
                  <Td>{item.skills_score}%</Td>
                  <Td>{item.projects_score}%</Td>
                  <Td>{item.interview_score}%</Td>
                  <Td className="font-semibold">{item.overall_score}%</Td>
                  <Td><Badge>{item.recommendation}</Badge></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => email.mutate({ id: item.id, type: 'accepted' })}><Mail className="h-4 w-4" /> Accept</Button>
                      <Button size="sm" variant="ghost" onClick={() => email.mutate({ id: item.id, type: 'rejected' })}>Reject</Button>
                    </div>
                  </Td>
                </tr>
              ))}</tbody>
            </Table>
          ) : <EmptyState title={jobId ? 'No evaluations for this job' : 'Enter a job ID'} />}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({ title, value, large }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} /></div>
        <p className={large ? 'mt-3 text-4xl font-semibold' : 'mt-3 text-2xl font-semibold'}>{value}%</p>
      </CardContent>
    </Card>
  );
}
