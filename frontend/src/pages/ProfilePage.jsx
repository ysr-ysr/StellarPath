import { User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent } from '../components/ui/card';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Account details from the authenticated session.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-9 w-9" />
          </div>
          <div className="grid gap-2">
            <p className="text-lg font-semibold">{user?.name || user?.companyName || user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm capitalize text-muted-foreground">{user?.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
