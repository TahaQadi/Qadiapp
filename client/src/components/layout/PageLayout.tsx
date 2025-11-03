import { ReactNode, HTMLAttributes } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";

interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  showAnimatedBackground?: boolean;
}

export function PageLayout({ 
  children, 
  showAnimatedBackground = true,
  className = "",
  ...props
}: PageLayoutProps): JSX.Element {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div 
      className={cn(
        "min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
      {...props}
    >
      {/* Animated background elements */}
      {showAnimatedBackground && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary/20 rounded-full animate-float"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

