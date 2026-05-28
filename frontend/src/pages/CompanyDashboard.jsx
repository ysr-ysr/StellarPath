import { useQuery } from '@tanstack/react-query';
import { BarChart3, Briefcase, ClipboardList, Users } from 'lucide-react';
import { jobsApi } from '../api/jobsApi';
import { StatCard } from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { EmptyState } from '../components/EmptyState';

export function CompanyDashboard() {
  const jobs = useQuery({ queryKey: ['companyJobs'], queryFn: jobsApi.listCompany });
  const jobList = jobs.data?.jobs || [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Company Dashboard</h1><p className="text-sm text-muted-foreground">Hiring activity and open roles.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Jobs" value={jobList.length} icon={Briefcase} />
        <StatCard title="Applications" value="-" icon={ClipboardList} />
        <StatCard title="Candidates" value="-" icon={Users} />
        <StatCard title="Evaluations" value="-" icon={BarChart3} />
      </div>
      <Card>
        <CardHeader><CardTitle>Recent jobs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {jobList.slice(0, 6).map((job) => (
            <div key={job.id} className="rounded-md border p-3">
              <div className="font-medium">{job.title}</div>
              <div className="text-sm text-muted-foreground">{job.company} · {job.status}</div>
            </div>
          ))}
          {jobList.length === 0 && <EmptyState title="No company jobs yet" />}
        </CardContent>
      </Card>
    </div>
  );
}
