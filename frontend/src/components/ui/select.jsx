import { cn } from '../../utils/cn';

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
