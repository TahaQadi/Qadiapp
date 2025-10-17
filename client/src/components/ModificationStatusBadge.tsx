
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ModificationStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
  className?: string;
  animated?: boolean;
}

export function ModificationStatusBadge({ status, className, animated = true }: ModificationStatusBadgeProps) {
  const { i18n } = useTranslation();

  const statusConfig = {
    pending: {
      variant: "secondary" as const,
      icon: animated ? Loader2 : Clock,
      label: i18n.language === 'ar' ? 'قيد الانتظار' : 'Pending',
      iconClass: animated ? 'animate-spin' : '',
      bgClass: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
    },
    approved: {
      variant: "default" as const,
      icon: CheckCircle,
      label: i18n.language === 'ar' ? 'تمت الموافقة' : 'Approved',
      iconClass: animated ? 'animate-scale-in' : '',
      bgClass: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    },
    rejected: {
      variant: "destructive" as const,
      icon: XCircle,
      label: i18n.language === 'ar' ? 'مرفوض' : 'Rejected',
      iconClass: animated ? 'animate-scale-in' : '',
      bgClass: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "transition-all duration-300",
        config.bgClass,
        animated && "animate-fade-in",
        className
      )}
    >
      <Icon className={cn("w-3 h-3 mr-1", config.iconClass)} />
      {config.label}
    </Badge>
  );
}
