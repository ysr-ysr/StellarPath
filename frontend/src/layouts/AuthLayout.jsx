import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function AuthLayout() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1fr_520px]">
      <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-xl font-semibold">StellarPath</div>
        <div className="max-w-xl">
          <p className="text-5xl font-semibold leading-tight">Recruitment intelligence for candidates and hiring teams.</p>
          <p className="mt-5 text-slate-300">Manage profiles, jobs, interviews, candidate evaluation, and AI-assisted resumes from one production workflow.</p>
        </div>
        <p className="text-sm text-slate-400">Built for focused hiring operations.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center p-6">
        <Outlet />
      </section>
    </main>
  );
}
