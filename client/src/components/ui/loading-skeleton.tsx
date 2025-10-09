
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'circle' | 'product'
}

export function LoadingSkeleton({ className, variant = 'card' }: LoadingSkeletonProps) {
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

  if (variant === 'circle') {
    return <div className={cn(baseClasses, "rounded-full", className)} />
  }

  if (variant === 'text') {
    return <div className={cn(baseClasses, "h-4 rounded", className)} />
  }

  return <div className={cn(baseClasses, "rounded-lg", className)} />
}
