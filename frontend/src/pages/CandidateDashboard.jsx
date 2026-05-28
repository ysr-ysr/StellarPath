import { useQuery } from '@tanstack/react-query';
import { Briefcase, ClipboardList, FolderKanban, Star } from 'lucide-react';
import { jobsApi } from '../api/jobsApi';
import { skillsApi } from '../api/skillsApi';
import { projectsApi } from '../api/projectsApi';
import { applicationsApi } from '../api/applicationsApi';
import { StatCard } from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/EmptyState';

export function CandidateDashboard() {
  const skills = useQuery({ queryKey: ['skills'], queryFn: skillsApi.list });
  const projects = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const applications = useQuery({ queryKey: ['applications'], queryFn: applicationsApi.mine });

  const skillList = skills.data?.skills || [];
  const projectList = projects.data?.projects || [];
  const jobList = jobs.data?.jobs || [];
  const appList = applications.data?.applications || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Candidate Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your career workflow at a glance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Skills" value={skillList.length} icon={Star} />
        <StatCard title="Projects" value={projectList.length} icon={FolderKanban} />
        <StatCard title="Applications" value={appList.length} icon={ClipboardList} />
        <StatCard title="Open Jobs" value={jobList.length} icon={Briefcase} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Latest jobs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {jobList.slice(0, 5).map((job) => (
              <div key={job.id} className="rounded-md border p-3">
                <div className="font-medium">{job.title}</div>
                <div className="text-sm text-muted-foreground">{job.company} · {job.location || 'Remote'}</div>
              </div>
            ))}
            {jobList.length === 0 && <EmptyState title="No jobs available" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Latest applications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {appList.slice(0, 5).map((app) => (
              <div key={app.application_id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{app.title}</div>
                  <div className="text-sm text-muted-foreground">{app.company_name}</div>
                </div>
                <Badge tone="amber">{app.status}</Badge>
              </div>
            ))}
            {appList.length === 0 && <EmptyState title="No applications yet" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
