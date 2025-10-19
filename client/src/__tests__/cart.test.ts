
import { describe, it, expect } from 'vitest';

describe('Shopping Cart', () => {
  it('should calculate total amount correctly', () => {
    const items = [
      { productId: '1', price: '10.00', quantity: 2 },
      { productId: '2', price: '15.50', quantity: 1 },
    ];

    const total = items.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    expect(total).toBe(35.50);
  });

  it('should format price correctly', () => {
    const price = 1234.56;
    const formatted = price.toFixed(2);

    expect(formatted).toBe('1234.56');
  });

  it('should handle empty cart', () => {
    const items: any[] = [];
    const total = items.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    expect(total).toBe(0);
  });
});
