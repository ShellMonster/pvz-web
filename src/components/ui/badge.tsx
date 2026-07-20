import { cn } from '@/lib/cn'

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-lime-800/80 px-2 py-0.5 text-xs font-medium text-lime-50',
        className,
      )}
      {...props}
    />
  )
}
