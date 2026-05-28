import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CheckCircle2, FileDown } from 'lucide-react';
import { interviewApi } from '../api/interviewApi';
import { getApiError } from '../api/client';
import { apiFileUrl } from '../constants/api';
import { useCandidateIdentity } from '../hooks/useCandidateIdentity';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { ErrorState } from '../components/ErrorState';

export function InterviewPage() {
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(null);
  const identity = useCandidateIdentity();
  const startForm = useForm({ defaultValues: { question_count: 3, difficulty: 'beginner' } });
  const answerForm = useForm();

  const currentQuestion = session?.questions?.[currentIndex];
  const progress = useMemo(() => session ? `${Math.min(currentIndex + 1, session.questions.length)}/${session.questions.length}` : '0/0', [currentIndex, session]);

  const start = useMutation({
    mutationFn: (values) => interviewApi.start({
      candidate_id: identity.candidateId,
      job_description: values.job_description,
      question_count: Number(values.question_count),
      difficulty: values.difficulty,
    }),
    onSuccess: (data, values) => {
      const requestedCount = Number(values.question_count);
      const generatedCount = data.questions?.length || 0;

      if (generatedCount !== requestedCount) {
        toast.error(`Expected ${requestedCount} questions, but received ${generatedCount}. Please try again.`);
        return;
      }

      setSession({ id: data.session.id, questions: data.questions });
      setCurrentIndex(0);
      setAnswers([]);
      setReport(null);
      toast.success('Interview started');
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const submitAnswer = useMutation({
    mutationFn: (values) => interviewApi.answer({
      session_id: session.id,
      question_id: currentQuestion.id,
      answer: values.answer,
    }),
    onSuccess: (data) => {
      setFeedback(data);
      setAnswers((items) => [...items, data]);
      answerForm.reset({ answer: '' });
      toast.success('Answer submitted');
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const loadReport = useMutation({
    mutationFn: () => interviewApi.report(session.id),
    onSuccess: (data) => {
      setReport(data);
      toast.success('Report generated');
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const nextQuestion = () => {
    setFeedback(null);
    setCurrentIndex((index) => index + 1);
  };

  const handleStartInterview = (values) => {
    if (!identity.candidateId) {
      toast.error('Your profile is not ready yet. Add at least one skill or project, then try again.');
      return;
    }

    start.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Interview Coach</h1><p className="text-sm text-muted-foreground">Practice interview questions based on the job you want and your saved profile.</p></div>
      {!session && (
        <Card>
          <CardHeader><CardTitle>Start interview</CardTitle></CardHeader>
          <CardContent>
            {!identity.canResolve && !identity.isLoading && (
              <ErrorState message="Your profile needs at least one saved skill or project before interview questions can be generated." />
            )}
            <form className="grid gap-4" onSubmit={startForm.handleSubmit(handleStartInterview)}>
              <Textarea className="min-h-44" placeholder="Paste the job description you want to practice for." {...startForm.register('job_description', { required: true })} />
              <Input type="number" min="1" max="10" placeholder="How many questions? Example: 5" {...startForm.register('question_count', { required: true })} />
              <Select aria-label="Interview difficulty" {...startForm.register('difficulty')}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
              <Button disabled={start.isPending || identity.isLoading || !identity.canResolve}>{start.isPending ? 'Starting...' : 'Start interview'}</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {session && !report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Question {progress}</CardTitle>
              <Badge>{answers.length} answered</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {currentQuestion ? (
              <div className="space-y-4">
                <p className="rounded-md bg-muted p-4 font-medium">{currentQuestion.question}</p>
                <form className="space-y-4" onSubmit={answerForm.handleSubmit((values) => submitAnswer.mutate(values))}>
                  <Textarea placeholder="Write your answer" {...answerForm.register('answer', { required: true })} disabled={Boolean(feedback)} />
                  {!feedback && <Button disabled={submitAnswer.isPending}>{submitAnswer.isPending ? 'Submitting...' : 'Submit answer'}</Button>}
                </form>
                {feedback && (
                  <div className="rounded-md border p-4">
                    <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-primary" /> {feedback.acceptable ? 'Acceptable' : 'Needs improvement'}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{feedback.feedback}</p>
                    {currentIndex + 1 < session.questions.length ? (
                      <Button className="mt-4" onClick={nextQuestion}>Next question</Button>
                    ) : (
                      <Button className="mt-4" onClick={() => loadReport.mutate()} disabled={loadReport.isPending}>{loadReport.isPending ? 'Generating...' : 'Generate report'}</Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={() => loadReport.mutate()}>Generate report</Button>
            )}
          </CardContent>
        </Card>
      )}
      {report && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-3">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interview score</p>
                <p className="text-5xl font-semibold">{report.score.percentage}%</p>
              </div>
              <Button onClick={() => window.open(apiFileUrl(`/interview/report/${session.id}/pdf`), '_blank')}>
                <FileDown className="h-4 w-4" /> Download PDF
              </Button>
            </CardContent>
          </Card>
          <ReportList title="Strengths" items={report.strengths} />
          <ReportList title="Weaknesses" items={report.weaknesses} />
          <ReportList title="Recommendations" items={report.recommendations} />
        </div>
      )}
    </div>
  );
}

function ReportList({ title, items }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {(items || []).map((item) => <li key={item} className="rounded-md bg-muted p-3">{item}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
