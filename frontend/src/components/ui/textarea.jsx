import { cn } from '../../utils/cn';

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30',
        className
      )}
      {...props}
    />
  );
}
