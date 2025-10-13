import { LanguageProvider } from '../LanguageProvider';
import { ProductCard as ProductCardComponent } from '../ProductCard';
import '../../lib/i18n';

export default function ProductCardExample() {
  return (
    <LanguageProvider>
      <div className="p-4 max-w-xs">
        <ProductCardComponent
          id="1"
          nameEn="Premium Office Chair"
          nameAr="كرسي مكتب فاخر"
          descriptionEn="Ergonomic design with lumbar support"
          descriptionAr="تصميم مريح مع دعم قطني"
          price="299.99"
          currency="USD"
          sku="CHAIR-001"
          onAddToCart={() => {}}
        />
      </div>
    </LanguageProvider>
  );
}
