import { useState } from 'react';
import { LanguageProvider } from '../LanguageProvider';
import { ClientSelector as ClientSelectorComponent } from '../ClientSelector';
import '../../lib/i18n';

const mockClients = [
  { id: '1', nameEn: 'Acme Corporation', nameAr: 'شركة أكمي' },
  { id: '2', nameEn: 'Global Trading Co.', nameAr: 'شركة التجارة العالمية' },
  { id: '3', nameEn: 'Tech Solutions Inc.', nameAr: 'شركة الحلول التقنية' },
];

export default function ClientSelectorExample() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  return (
    <LanguageProvider>
      <div className="p-4">
        <ClientSelectorComponent
          clients={mockClients}
          selectedClientId={selectedClientId}
          onClientSelect={(id) => {
            setSelectedClientId(id);
            console.log('Client selected:', id);
          }}
        />
      </div>
    </LanguageProvider>
  );
}
