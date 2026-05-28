import { cn } from '../../utils/cn';

export function Badge({ className, tone = 'default', ...props }) {
  const tones = {
    default: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    red: 'bg-red-500/10 text-red-600 dark:text-red-300',
    slate: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', tones[tone], className)} {...props} />
  );
}
