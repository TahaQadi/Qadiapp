/**
 * Query Key Factory
 * Centralized query keys for consistent cache management across the application
 * 
 * Benefits:
 * - Type-safe query keys
 * - Consistent cache invalidation
 * - Easy to find all queries for a resource
 * - Hierarchical cache structure
 * 
 * Usage:
 * const { data } = useQuery({ queryKey: queryKeys.products.list() });
 * queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
 */

export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // LTAs (Long-Term Agreements)
  ltas: {
    all: ['ltas'] as const,
    lists: () => [...queryKeys.ltas.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.ltas.lists(), filters] as const,
    details: () => [...queryKeys.ltas.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.ltas.details(), id] as const,
    products: (ltaId: string) => [...queryKeys.ltas.detail(ltaId), 'products'] as const,
    clients: (ltaId: string) => [...queryKeys.ltas.detail(ltaId), 'clients'] as const,
    documents: (ltaId: string) => [...queryKeys.ltas.detail(ltaId), 'documents'] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    departments: (clientId: string) => [...queryKeys.clients.detail(clientId), 'departments'] as const,
    locations: (clientId: string) => [...queryKeys.clients.detail(clientId), 'locations'] as const,
    ltas: (clientId: string) => [...queryKeys.clients.detail(clientId), 'ltas'] as const,
  },

  // Company Users
  companyUsers: {
    all: ['company-users'] as const,
    lists: () => [...queryKeys.companyUsers.all, 'list'] as const,
    list: (companyId?: string) => [...queryKeys.companyUsers.lists(), companyId] as const,
    details: () => [...queryKeys.companyUsers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companyUsers.details(), id] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    items: (orderId: string) => [...queryKeys.orders.detail(orderId), 'items'] as const,
    modifications: (orderId: string) => [...queryKeys.orders.detail(orderId), 'modifications'] as const,
  },

  // Order Modifications
  orderModifications: {
    all: ['order-modifications'] as const,
    lists: () => [...queryKeys.orderModifications.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.orderModifications.lists(), filters] as const,
    pending: () => [...queryKeys.orderModifications.all, 'pending'] as const,
  },

  // Order Templates
  orderTemplates: {
    all: ['order-templates'] as const,
    lists: () => [...queryKeys.orderTemplates.all, 'list'] as const,
    list: (clientId?: string) => [...queryKeys.orderTemplates.lists(), clientId] as const,
    details: () => [...queryKeys.orderTemplates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orderTemplates.details(), id] as const,
  },

  // Price Requests
  priceRequests: {
    all: ['price-requests'] as const,
    lists: () => [...queryKeys.priceRequests.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.priceRequests.lists(), filters] as const,
    details: () => [...queryKeys.priceRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.priceRequests.details(), id] as const,
    pending: () => [...queryKeys.priceRequests.all, 'pending'] as const,
  },

  // Price Offers
  priceOffers: {
    all: ['price-offers'] as const,
    lists: () => [...queryKeys.priceOffers.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.priceOffers.lists(), filters] as const,
    details: () => [...queryKeys.priceOffers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.priceOffers.details(), id] as const,
    items: (offerId: string) => [...queryKeys.priceOffers.detail(offerId), 'items'] as const,
    drafts: () => [...queryKeys.priceOffers.all, 'drafts'] as const,
  },

  // Templates (for PDF generation)
  templates: {
    all: ['templates'] as const,
    lists: () => [...queryKeys.templates.all, 'list'] as const,
    list: (type?: string) => [...queryKeys.templates.lists(), type] as const,
    details: () => [...queryKeys.templates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.templates.details(), id] as const,
    active: (type: string) => [...queryKeys.templates.all, 'active', type] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.documents.lists(), filters] as const,
  },

  // Feedback
  feedback: {
    all: ['feedback'] as const,
    lists: () => [...queryKeys.feedback.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.feedback.lists(), filters] as const,
    analytics: () => [...queryKeys.feedback.all, 'analytics'] as const,
  },

  // Statistics & Analytics
  stats: {
    all: ['stats'] as const,
    dashboard: () => [...queryKeys.stats.all, 'dashboard'] as const,
    orders: () => [...queryKeys.stats.all, 'orders'] as const,
    products: () => [...queryKeys.stats.all, 'products'] as const,
    clients: () => [...queryKeys.stats.all, 'clients'] as const,
  },
} as const;

/**
 * Helper function to invalidate all queries for a resource
 * 
 * @example
 * // Invalidate all product queries
 * await invalidateResource(queryClient, queryKeys.products.all);
 * 
 * // Invalidate specific product detail
 * await invalidateResource(queryClient, queryKeys.products.detail(productId));
 */
export async function invalidateResource(
  queryClient: any,
  queryKey: readonly unknown[]
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey });
}

/**
 * Helper function to prefetch data
 * 
 * @example
 * await prefetchResource(queryClient, queryKeys.products.list());
 */
export async function prefetchResource(
  queryClient: any,
  queryKey: readonly unknown[]
): Promise<void> {
  await queryClient.prefetchQuery({ queryKey });
}
