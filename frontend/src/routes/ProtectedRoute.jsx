import { AppLayout } from '../layouts/AppLayout';

export function CandidateRoute() {
  return <AppLayout allowedRole="candidate" />;
}

export function CompanyRoute() {
  return <AppLayout allowedRole="company" />;
}
