import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { jobsApi } from '../api/jobsApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { EmptyState } from '../components/EmptyState';

const PAGE_SIZE = 6;

export function JobsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const jobs = data?.jobs || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((job) => [job.title, job.company, job.location, job.description].join(' ').toLowerCase().includes(q));
  }, [jobs, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Job Explorer</h1><p className="text-sm text-muted-foreground">Search open opportunities and apply.</p></div>
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by title, company, location..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      </div>
      {isLoading ? <Card className="h-40" /> : visible.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((job) => (
            <Card key={job.id}>
              <CardHeader><CardTitle>{job.title}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job.company} · {job.location || 'Remote'}</p>
                <p className="mt-3 line-clamp-4 text-sm">{job.description || 'No description provided.'}</p>
                <Button className="mt-4" asChild>
                  <Link to={`/jobs/${job.id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No jobs match your filters" />}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
        <Button variant="outline" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>
    </div>
  );
}
