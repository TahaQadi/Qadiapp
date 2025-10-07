import { LanguageProvider } from '../LanguageProvider';
import { OrderHistoryTable as OrderHistoryTableComponent } from '../OrderHistoryTable';
import '../../lib/i18n';

const mockOrders = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    itemCount: 5,
    totalAmount: '1250.00',
    status: 'delivered' as const,
    currency: 'USD',
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    itemCount: 3,
    totalAmount: '890.50',
    status: 'shipped' as const,
    currency: 'USD',
  },
];

export default function OrderHistoryTableExample() {
  return (
    <LanguageProvider>
      <div className="p-4">
        <OrderHistoryTableComponent
          orders={mockOrders}
          onViewDetails={(id) => console.log('View order:', id)}
          onReorder={(id) => console.log('Reorder:', id)}
        />
      </div>
    </LanguageProvider>
  );
}
