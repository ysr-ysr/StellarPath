import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CheckCircle2, Download, FileDown, Loader2 } from 'lucide-react';
import { artifactsApi } from '../api/artifactsApi';
import { getApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { ErrorState } from '../components/ErrorState';

export function ResumeAssistantPage() {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const onSubmit = async (values) => {
    setLoading(true);
    setErrorMessage('');
    setDownloadUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });

    try {
      const blob = await artifactsApi.generateResumePdf({
        job_description: values.job_description,
      });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'stellarpath-ats-resume.pdf';
      link.click();
      toast.success('Resume PDF generated');
    } catch (error) {
      const message = getApiError(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">AI Resume Assistant</h1><p className="text-sm text-muted-foreground">Paste a job description and StellarPath will tailor a resume from your saved profile.</p></div>
      <Card>
        <CardHeader><CardTitle>Generate tailored resume</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Textarea
              className="min-h-56"
              placeholder="Paste the job description here. Include responsibilities, required skills, and any preferred experience."
              {...register('job_description', { required: 'Paste a job description before generating a PDF.' })}
            />
            {errors.job_description && (
              <p className="text-sm text-destructive">{errors.job_description.message}</p>
            )}
            {errorMessage && <ErrorState message={errorMessage} />}
            {downloadUrl && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200">
                <span className="inline-flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Resume PDF is ready.
                </span>
                <Button asChild variant="outline" size="sm">
                  <a href={downloadUrl} download="stellarpath-ats-resume.pdf">
                    <FileDown className="h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              </div>
            )}
            <Button disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {loading ? 'Generating PDF...' : 'Generate PDF'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
