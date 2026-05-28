import { Inbox } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function EmptyState({ title = 'Nothing here yet', description = 'Once data is available, it will appear here.' }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
