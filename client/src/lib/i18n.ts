import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "selectClient": "Select Client",
      "searchProducts": "Search products...",
      "cart": "Cart",
      "templates": "Templates",
      "history": "History",
      "language": "Language",

      // Product
      "addToCart": "Add to Cart",
      "sku": "SKU",

      // Cart
      "yourCart": "Your Cart",
      "emptyCart": "Your cart is empty",
      "startShopping": "Start adding products to your cart",
      "subtotal": "Subtotal",
      "tax": "Tax",
      "total": "Total",
      "submitOrder": "Submit Order",
      "saveAsTemplate": "Save as Template",
      "remove": "Remove",
      "clearCart": "Clear Cart",

      // Templates
      "orderTemplates": "Order Templates",
      "noTemplates": "No templates saved",
      "createTemplate": "Create your first template from your cart",
      "templateName": "Template Name",
      "lastUsed": "Last used",
      "items": "items",
      "loadTemplate": "Load",
      "deleteTemplate": "Delete",
      "saveTemplate": "Save Template",
      "cancel": "Cancel",

      // Order History
      "orderHistory": "Order History",
      "noOrders": "No orders yet",
      "placeFirstOrder": "Place your first order to see it here",
      "orderDate": "Date",
      "orderId": "Order ID",
      "status": "Status",
      "itemsSummary": "Items",
      "amount": "Amount",
      "actions": "Actions",
      "viewDetails": "View Details",
      "reorder": "Reorder",
      "pending": "Pending",
      "confirmed": "Confirmed",
      "shipped": "Shipped",
      "delivered": "Delivered",

      // Notifications
      "notifications": "Notifications",
      "noNotifications": "No notifications",
      "markAllAsRead": "Mark all as read",
      "markAsRead": "Mark as read",
      "deleteNotification": "Delete",

      // Messages
      "orderSubmitted": "Order submitted successfully",
      "templateSaved": "Template saved successfully",
      "templateLoaded": "Template loaded",
      "templateDeleted": "Template deleted",
      "itemAdded": "Item added to cart",
      "itemRemoved": "Item removed from cart",

      // Theme
      "darkMode": "Dark Mode",
      "lightMode": "Light Mode",
    }
  },
  ar: {
    translation: {
      // Navigation
      "selectClient": "اختر العميل",
      "searchProducts": "البحث عن المنتجات...",
      "cart": "السلة",
      "templates": "القوالب",
      "history": "السجل",
      "language": "اللغة",

      // Product
      "addToCart": "أضف للسلة",
      "sku": "رمز المنتج",

      // Cart
      "yourCart": "سلة المشتريات",
      "emptyCart": "السلة فارغة",
      "startShopping": "ابدأ بإضافة المنتجات إلى سلتك",
      "subtotal": "المجموع الفرعي",
      "tax": "الضريبة",
      "total": "الإجمالي",
      "submitOrder": "تقديم الطلب",
      "saveAsTemplate": "حفظ كقالب",
      "remove": "إزالة",
      "clearCart": "إفراغ السلة",

      // Templates
      "orderTemplates": "قوالب الطلبات",
      "noTemplates": "لا توجد قوالب محفوظة",
      "createTemplate": "أنشئ أول قالب من سلتك",
      "templateName": "اسم القالب",
      "lastUsed": "آخر استخدام",
      "items": "عناصر",
      "loadTemplate": "تحميل",
      "deleteTemplate": "حذف",
      "saveTemplate": "حفظ القالب",
      "cancel": "إلغاء",

      // Order History
      "orderHistory": "سجل الطلبات",
      "noOrders": "لا توجد طلبات",
      "placeFirstOrder": "قدم طلبك الأول لرؤيته هنا",
      "orderDate": "التاريخ",
      "orderId": "رقم الطلب",
      "status": "الحالة",
      "itemsSummary": "العناصر",
      "amount": "المبلغ",
      "actions": "الإجراءات",
      "viewDetails": "عرض التفاصيل",
      "reorder": "إعادة الطلب",
      "pending": "قيد الانتظار",
      "confirmed": "مؤكد",
      "shipped": "تم الشحن",
      "delivered": "تم التسليم",

      // Notifications
      "notifications": "الإشعارات",
      "noNotifications": "لا توجد إشعارات",
      "markAllAsRead": "وضع علامة مقروء على الكل",
      "markAsRead": "وضع علامة مقروء",
      "deleteNotification": "حذف",

      // Messages
      "orderSubmitted": "تم تقديم الطلب بنجاح",
      "templateSaved": "تم حفظ القالب بنجاح",
      "templateLoaded": "تم تحميل القالب",
      "templateDeleted": "تم حذف القالب",
      "itemAdded": "تمت إضافة العنصر إلى السلة",
      "itemRemoved": "تمت إزالة العنصر من السلة",

      // Theme
      "darkMode": "الوضع الداكن",
      "lightMode": "الوضع الفاتح",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;