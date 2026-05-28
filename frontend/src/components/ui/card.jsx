import { cn } from '../../utils/cn';

export function Card({ className, ...props }) {
  return <div className={cn('rounded-lg border bg-card text-card-foreground shadow-soft', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-5 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-base font-semibold', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-2', className)} {...props} />;
}
