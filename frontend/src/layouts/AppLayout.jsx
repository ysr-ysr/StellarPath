import { useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Star,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/cn';

const candidateNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/applications', label: 'Applications', icon: ClipboardList },
  { to: '/skills', label: 'Skills', icon: Star },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/interview', label: 'Interview Coach', icon: GraduationCap },
  { to: '/resume-assistant', label: 'Resume Assistant', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

const companyNav = [
  { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/company/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/company/candidates', label: 'Candidates', icon: Users },
  { to: '/company/applications', label: 'Applications', icon: ClipboardList },
  { to: '/company/evaluations', label: 'Evaluations', icon: BarChart3 },
];

function Sidebar({ navItems, onNavigate }) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { dark, setDark } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex h-full flex-col border-r bg-card">
      <div className="border-b p-5">
        <div className="text-xl font-semibold">StellarPath</div>
        <div className="text-xs text-muted-foreground">Recruitment Platform</div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
                isActive && 'bg-primary/10 text-primary'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t p-3">
        <Button className="w-full justify-start" variant="ghost" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? 'Light mode' : 'Dark mode'}
        </Button>
        <Button className="w-full justify-start" variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

export function AppLayout({ allowedRole }) {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'company' ? '/company/dashboard' : '/dashboard'} replace />;
  }

  const navItems = role === 'company' ? companyNav : candidateNav;

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden fixed inset-y-0 left-0 w-72 lg:block">
        <Sidebar navItems={navItems} />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            <Sidebar navItems={navItems} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div>
            <p className="text-sm font-medium">{user?.email || 'Account'}</p>
            <p className="text-xs capitalize text-muted-foreground">{role}</p>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
