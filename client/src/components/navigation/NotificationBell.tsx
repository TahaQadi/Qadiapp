import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useLanguage } from '@/components/LanguageProvider';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps): JSX.Element {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <NotificationCenter variant="sidebar" />
    </div>
  );
}

