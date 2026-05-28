import { cn } from '../../utils/cn';

export function Button({ className, variant = 'default', size = 'md', asChild = false, children, ...props }) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-muted text-foreground hover:bg-muted/80',
    outline: 'border bg-transparent hover:bg-muted',
    ghost: 'hover:bg-muted',
    destructive: 'bg-destructive text-white hover:opacity-90',
  };
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5',
    icon: 'h-10 w-10',
  };

  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  );

  if (asChild && children) {
    return <span className={classes} {...props}>{children}</span>;
  }

  return <button className={classes} {...props}>{children}</button>;
}
