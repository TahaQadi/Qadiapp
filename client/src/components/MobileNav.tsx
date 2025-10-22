
import { Home, ShoppingCart, ClipboardList, User, Menu } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useLanguage } from './LanguageProvider';
import { Badge } from './ui/badge';

interface MobileNavProps {
  cartItemCount?: number;
  onMenuClick?: () => void;
}

export function MobileNav({ cartItemCount = 0, onMenuClick }: MobileNavProps) {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { icon: Home, label: t('nav.home'), path: '/' },
    { icon: ShoppingCart, label: t('nav.cart'), path: '/ordering', badge: cartItemCount },
    { icon: ClipboardList, label: t('nav.orders'), path: '/orders' },
    { icon: User, label: t('nav.profile'), path: '/profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "touch-target flex flex-col items-center justify-center gap-1 relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 min-w-4 p-0 flex items-center justify-center text-xs"
                    variant="destructive"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-mobile-xs font-medium">{item.label}</span>
            </button>
          );
        })}
        
        <button
          onClick={onMenuClick}
          className="touch-target flex flex-col items-center justify-center gap-1 text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          <span className="text-mobile-xs font-medium">{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  );
}
