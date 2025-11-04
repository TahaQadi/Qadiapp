import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, ClipboardList } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserMenuProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

export function UserMenu({ variant = 'default', className = '' }: UserMenuProps): JSX.Element {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const isAdmin = (user as any)?.isAdmin;

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  if (!user) {
    return <></>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`min-h-[44px] min-w-[44px] h-9 w-9 rounded-full hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all duration-300 ${className}`}
          title={language === 'ar' ? 'القائمة' : 'Menu'}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 dark:bg-[#d4af37]/10 text-primary dark:text-[#d4af37] font-semibold text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRTL ? 'start' : 'end'}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || user.nameEn || user.nameAr}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-3 cursor-pointer">
            <User className="h-4 w-4" />
            <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
          </Link>
        </DropdownMenuItem>
        {variant === 'default' && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/ordering" className="flex items-center gap-3 cursor-pointer">
                <ClipboardList className="h-4 w-4" />
                <span>{language === 'ar' ? 'نظام الطلبات' : 'Ordering System'}</span>
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-3 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>{language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={logout}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4 me-2 ms-0" />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

