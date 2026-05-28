import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { CandidateRoute, CompanyRoute } from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { RegisterCandidatePage } from './pages/RegisterCandidatePage';
import { RegisterCompanyPage } from './pages/RegisterCompanyPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { SkillsPage } from './pages/SkillsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { InterviewPage } from './pages/InterviewPage';
import { InterviewReportPage } from './pages/InterviewReportPage';
import { ResumeAssistantPage } from './pages/ResumeAssistantPage';
import { ProfilePage } from './pages/ProfilePage';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { CompanyJobsPage } from './pages/CompanyJobsPage';
import { CompanyApplicationsPage } from './pages/CompanyApplicationsPage';
import { CompanyEvaluationsPage } from './pages/CompanyEvaluationsPage';
import { CompanyCandidatesPage } from './pages/CompanyCandidatesPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-candidate" element={<RegisterCandidatePage />} />
            <Route path="/register-company" element={<RegisterCompanyPage />} />
          </Route>

          <Route element={<CandidateRoute />}>
            <Route path="/dashboard" element={<CandidateDashboard />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/interview/report" element={<InterviewReportPage />} />
            <Route path="/resume-assistant" element={<ResumeAssistantPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<CompanyRoute />}>
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/jobs" element={<CompanyJobsPage />} />
            <Route path="/company/applications" element={<CompanyApplicationsPage />} />
            <Route path="/company/evaluations" element={<CompanyEvaluationsPage />} />
            <Route path="/company/candidates" element={<CompanyCandidatesPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
