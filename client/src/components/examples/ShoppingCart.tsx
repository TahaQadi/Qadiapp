import { useState } from 'react';
import { LanguageProvider } from '../LanguageProvider';
import { ShoppingCart as ShoppingCartComponent, CartItem } from '../ShoppingCart';
import { Button } from '@/components/ui/button';
import '../../lib/i18n';

const mockItems: CartItem[] = [
  { productId: '1', nameEn: 'Office Chair', nameAr: 'كرسي مكتب', price: '299.99', quantity: 2, sku: 'CHAIR-001' },
  { productId: '2', nameEn: 'Standing Desk', nameAr: 'مكتب واقف', price: '599.99', quantity: 1, sku: 'DESK-001' },
];

export default function ShoppingCartExample() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(mockItems);

  return (
    <LanguageProvider>
      <div className="p-4">
        <Button onClick={() => setOpen(true)}>Open Cart</Button>
        <ShoppingCartComponent
          items={items}
          open={open}
          onOpenChange={setOpen}
          onUpdateQuantity={(id, qty) => {
            setItems(items.map(item => 
              item.productId === id ? { ...item, quantity: qty } : item
            ));
            console.log('Updated quantity:', id, qty);
          }}
          onRemoveItem={(id) => {
            setItems(items.filter(item => item.productId !== id));
            console.log('Removed item:', id);
          }}
          onClearCart={() => {
            setItems([]);
            console.log('Cart cleared');
          }}
          onSubmitOrder={() => console.log('Order submitted')}
          onSaveTemplate={() => console.log('Template saved')}
          currency="USD"
        />
      </div>
    </LanguageProvider>
  );
}
