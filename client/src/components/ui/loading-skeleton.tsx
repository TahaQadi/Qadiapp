
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'circle' | 'product' | 'table' | 'list'
  count?: number
}

export function LoadingSkeleton({ className, variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const baseClasses = "animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:1000px_100%]"
  
  if (variant === 'product') {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className={cn(baseClasses, "h-48 rounded-lg")} />
        <div className={cn(baseClasses, "h-4 w-3/4 rounded")} />
        <div className={cn(baseClasses, "h-4 w-1/2 rounded")} />
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn(baseClasses, "h-16 rounded-lg")} />
        ))}
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(baseClasses, "h-12 w-12 rounded-full")} />
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, "h-4 w-3/4 rounded")} />
              <div className={cn(baseClasses, "h-3 w-1/2 rounded")} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'circle') {
    return <div className={cn(baseClasses, "rounded-full", className)} />
  }

  if (variant === 'text') {
    return <div className={cn(baseClasses, "h-4 rounded", className)} />
  }

  return <div className={cn(baseClasses, "rounded-lg", className)} />
}
