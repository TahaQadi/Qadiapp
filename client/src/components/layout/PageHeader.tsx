import { ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  showLogo?: boolean;
  logoUrl?: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  showLogo = false,
  logoUrl = "/logo.png",
  actions,
  className = "",
  titleClassName = "",
}: PageHeaderProps): JSX.Element {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm",
      className
    )}>
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 text-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:border-primary transition-all duration-300 flex-shrink-0"
              title={backLabel || (isRTL ? "العودة" : "Back")}
            >
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          )}
          
          {showLogo && (
            <img
              src={logoUrl}
              alt={isRTL ? "شعار الشركة" : "Company Logo"}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className={cn(
              "text-sm sm:text-lg lg:text-xl font-semibold sm:font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate",
              titleClassName
            )}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

