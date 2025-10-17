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
  LucideIcon
} from 'lucide-react';

/**
 * Category icon mapping configuration
 * Maps category keywords to their corresponding Lucide icons
 */
const categoryIconMap: Record<string, LucideIcon> = {
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
};

/**
 * Get the appropriate icon for a category based on keyword matching
 * @param category - Category name to match
 * @returns Lucide icon component
 */
export function getCategoryIcon(category: string): LucideIcon {
  const categoryLower = category.toLowerCase();
  
  // Find first matching keyword in the category name
  const matchedKey = Object.keys(categoryIconMap).find(key => 
    categoryLower.includes(key)
  );
  
  return matchedKey ? categoryIconMap[matchedKey] : Package;
}
