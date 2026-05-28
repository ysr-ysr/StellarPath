import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import { getApiError } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, formState } = useForm();

  const onSubmit = async (values) => {
    try {
      const data = await authApi.login(values);
      setAuth(data);
      toast.success('Welcome back');
      navigate(data.user.role === 'company' ? '/company/dashboard' : '/dashboard');
    } catch (error) {
      toast.error(getApiError(error));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <p className="text-sm text-muted-foreground">Access your StellarPath workspace.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input type="email" placeholder="Email" {...register('email', { required: true })} />
          <Input type="password" placeholder="Password" {...register('password', { required: true })} />
          <Button className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
          <Link className="text-primary" to="/register-candidate">Create candidate account</Link>
          <Link className="text-primary" to="/register-company">Create company account</Link>
        </div>
      </CardContent>
    </Card>
  );
}
