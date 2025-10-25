import { 
  Laptop, 
  Printer, 
  Monitor, 
  Keyboard, 
  Mouse, 
  Headphones, 
  Cable, 
  Speaker, 
  Camera, 
  Smartphone, 
  Tablet, 
  Watch, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Wifi, 
  Router, 
  Package,
  Cog,
  Sparkles,
  UtensilsCrossed,
  ShoppingBag,
  Shield,
  FileText,
  Droplets,
  Apple,
  Grid3x3,
  LucideIcon
} from 'lucide-react';

/**
 * Category icon mapping configuration
 * Maps category names (exact match) and keywords to their corresponding Lucide icons
 */
const categoryIconMap: Record<string, LucideIcon> = {
  // Arabic category names (exact match)
  'أجهزة وموزعات': Cog,
  'أدوات تنظيف احترافية': Sparkles,
  'أدوات تنظيف عامة': Sparkles,
  'أدوات مائدة': UtensilsCrossed,
  'أكياس نايلون وبلاستيك': ShoppingBag,
  'تعبئة وتغليف': Package,
  'عناية شخصية': Sparkles,
  'ملابس ومستلزمات وقاية': Shield,
  'منتجات ورقية صحية': FileText,
  'مواد تنظيف': Droplets,
  'مواد غذائية ومشروبات': Apple,
  'نثريات ومستهلكات': Grid3x3,
  
  // English keywords (partial match)
  'computer': Laptop,
  'laptop': Laptop,
  'printer': Printer,
  'monitor': Monitor,
  'display': Monitor,
  'keyboard': Keyboard,
  'mouse': Mouse,
  'headphone': Headphones,
  'audio': Headphones,
  'cable': Cable,
  'wire': Cable,
  'speaker': Speaker,
  'camera': Camera,
  'phone': Smartphone,
  'mobile': Smartphone,
  'tablet': Tablet,
  'watch': Watch,
  'storage': HardDrive,
  'drive': HardDrive,
  'processor': Cpu,
  'cpu': Cpu,
  'memory': MemoryStick,
  'ram': MemoryStick,
  'network': Wifi,
  'wifi': Wifi,
  'router': Router,
  'devices': Cog,
  'cleaning': Sparkles,
  'tableware': UtensilsCrossed,
  'dining': UtensilsCrossed,
  'bags': ShoppingBag,
  'packaging': Package,
  'personal care': Sparkles,
  'protective': Shield,
  'safety': Shield,
  'paper': FileText,
  'sanitary': FileText,
  'food': Apple,
  'beverages': Apple,
  'drink': Apple,
  'miscellaneous': Grid3x3,
};

/**
 * Get the appropriate icon for a category based on exact match or keyword matching
 * @param category - Category name to match
 * @returns Lucide icon component
 */
export function getCategoryIcon(category: string): LucideIcon {
  // First try exact match (for Arabic categories)
  if (categoryIconMap[category]) {
    return categoryIconMap[category];
  }
  
  // Then try keyword matching (for English or partial matches)
  const categoryLower = category.toLowerCase();
  const matchedKey = Object.keys(categoryIconMap).find(key => 
    categoryLower.includes(key.toLowerCase())
  );
  
  return matchedKey ? categoryIconMap[matchedKey] : Package;
}
