import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export function ErrorState({ message = 'Unable to load data.', onRetry }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" />
        {message}
      </div>
      {onRetry && (
        <Button className="mt-3" variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
