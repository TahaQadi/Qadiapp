import { ReactNode, useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/navigation/UserMenu";
import { NotificationBell } from "@/components/navigation/NotificationBell";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

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
  breadcrumbs?: BreadcrumbItem[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  showUserMenu?: boolean;
  showNotifications?: boolean;
  variant?: 'default' | 'transparent' | 'elevated';
  scrollEffect?: boolean;
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
  breadcrumbs,
  searchPlaceholder,
  onSearch,
  showSearch = false,
  showUserMenu = false,
  showNotifications = false,
  variant = 'default',
  scrollEffect = false,
}: PageHeaderProps): JSX.Element {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!scrollEffect) return;
    
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollEffect]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'transparent':
        return scrollEffect && !scrolled
          ? 'bg-transparent border-transparent shadow-none'
          : 'bg-background/95 dark:bg-black/80 border-border/50 dark:border-[#d4af37]/20 shadow-sm';
      case 'elevated':
        return 'bg-background/98 dark:bg-black/95 border-border/50 dark:border-[#d4af37]/20 shadow-lg';
      default:
        return 'bg-background/95 dark:bg-black/80 border-border/50 dark:border-[#d4af37]/20 shadow-sm';
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300",
      getVariantStyles(),
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="min-h-[44px] min-w-[44px] h-9 w-9 text-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:border-primary transition-all duration-300 flex-shrink-0"
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
          
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <span className="text-muted-foreground/50">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}

          {/* Title Section */}
          <div className="min-w-0 flex-1">
            <h1 className={cn(
              "text-base sm:text-lg lg:text-xl font-semibold sm:font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate",
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

        {/* Center Section - Search */}
        {showSearch && (
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder || (isRTL ? 'بحث...' : 'Search...')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 h-9 bg-background/50 dark:bg-background/30 border-border/50"
              />
            </div>
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-h-[44px] min-w-[44px] h-9 w-9"
              title={isRTL ? 'بحث' : 'Search'}
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          
          {showNotifications && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}
          
          {showUserMenu && (
            <div className="hidden sm:block">
              <UserMenu />
            </div>
          )}
          
          {actions}
        </div>
      </div>
    </header>
  );
}

