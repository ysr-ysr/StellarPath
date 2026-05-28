import { cn } from '../../utils/cn';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30',
        className
      )}
      {...props}
    />
  );
}
