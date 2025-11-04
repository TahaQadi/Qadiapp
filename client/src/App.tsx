import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient, initializeCachePersistence } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, lazy, Suspense } from "react";
import NotFoundPage from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage"; // Critical - keep eager loaded

// Lazy load all non-critical pages for better code splitting
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const LogoutPage = lazy(() => import("@/pages/LogoutPage"));
const OrderingPage = lazy(() => import("@/pages/OrderingPage"));
const ClientProfilePage = lazy(() => import("@/pages/ClientProfilePage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AdminProductsPage = lazy(() => import("@/pages/AdminProductsPage"));
const AdminVendorsPage = lazy(() => import("@/pages/AdminVendorsPage"));
const AdminClientsPage = lazy(() => 
  import("@/pages/AdminClientsPage").catch((error) => {
    console.error("Failed to load AdminClientsPage:", error);
    throw error;
  })
);
const AdminLtaListPage = lazy(() => import("@/pages/AdminLtaListPage"));
const AdminLtaDetailPage = lazy(() => import("@/pages/AdminLtaDetailPage"));
const AdminPriceRequestsPage = lazy(() => import('./pages/AdminPriceRequestsPage'));
const AdminPriceManagementPage = lazy(() => import('./pages/AdminPriceManagementPage'));
const AdminOrdersPage = lazy(() => import('@/pages/AdminOrdersPage'));
const AdminDocumentsPage = lazy(() => import('./pages/AdminDocumentsPage'));
const AdminDocumentListPage = lazy(() => import('./pages/AdminDocumentListPage'));
const OrderModificationsPage = lazy(() => import('./pages/admin/OrderModificationsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const PriceRequestPage = lazy(() => import('@/pages/PriceRequestPage'));
const ClientPriceOffersPage = lazy(() => import('@/pages/ClientPriceOffersPage'));
const ClientDocumentsPage = lazy(() => import('@/pages/ClientDocumentsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CatalogPage = lazy(() => import('@/pages/CatalogPage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const AdminDemoRequestsPage = lazy(() => import("@/pages/AdminDemoRequestsPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const DesignSystemPage = lazy(() => import("@/pages/admin/DesignSystemPage"));

// Lazy load Admin components with preload capability
const AdminErrorLogsPage = lazy(() => import('@/pages/admin/ErrorLogsPage'));
const IssueReportsPage = lazy(() => import('@/pages/admin/IssueReportsPage'));
const FeedbackDashboardPage = lazy(() => import('@/pages/admin/FeedbackDashboardPage'));
const CustomerFeedbackPage = lazy(() => import('@/pages/admin/CustomerFeedbackPage'));

// Loading fallback component for lazy-loaded routes
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-border" />
  </div>
);

import { ProtectedRoute } from '@/lib/protected-route';
import "./lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { NotificationPermission } from '@/components/NotificationPermission';
import { InstallPrompt } from '@/components/InstallPrompt';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { usePageTracking } from '@/lib/analytics';
import { errorMonitoring } from '@/lib/errorMonitoring';
import { performanceMonitoring } from '@/lib/performanceMonitoring';

function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user && !(user as any).isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Admin access required / مطلوب صلاحيات المسؤول",
        variant: "destructive",
      });
    }
  }, [isLoading, user, toast]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/landing" />
      </Route>
    );
  }

  if (!(user as any).isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Suspense fallback={<PageLoadingFallback />}>
        <Component />
      </Suspense>
    </Route>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/landing" component={LandingPage} />
      <Route path="/login">
        <Redirect to="/landing?auth=login" />
      </Route>
      <Route path="/onboarding">
        <Suspense fallback={<PageLoadingFallback />}>
          <OnboardingPage />
        </Suspense>
      </Route>
      <Route path="/logout">
        <Suspense fallback={<PageLoadingFallback />}>
          <LogoutPage />
        </Suspense>
      </Route>

      {/* Public product pages for SEO */}
      <Route path="/products/:sku">
        <Suspense fallback={<PageLoadingFallback />}>
          <ProductDetailPage />
        </Suspense>
      </Route>
      <Route path="/catalog/:category">
        <Suspense fallback={<PageLoadingFallback />}>
          <CatalogPage />
        </Suspense>
      </Route>
      <Route path="/catalog">
        <Suspense fallback={<PageLoadingFallback />}>
          <CatalogPage />
        </Suspense>
      </Route>

      {/* Protected client routes - always registered so ProtectedRoute can handle auth */}
      <ProtectedRoute path="/ordering" component={OrderingPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/price-request" component={PriceRequestPage} />
      <ProtectedRoute path="/price-offers" component={ClientPriceOffersPage} />
      <ProtectedRoute path="/documents" component={ClientDocumentsPage} />
      <ProtectedRoute path="/profile" component={ClientProfilePage} />

      {/* Root route - redirect based on auth status */}
      {isLoading ? (
        <Route path="/">
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <Route path="/">
          <Redirect to="/landing" />
        </Route>
      ) : (
        <Route path="/">
          {(user as any)?.isAdmin ? <Redirect to="/admin" /> : <Redirect to="/ordering" />}
        </Route>
      )}

      {/* Admin routes */}
      <AdminRoute path="/admin" component={AdminDashboardPage} />
      <AdminRoute path="/admin/features" component={AdminPage} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboardPage} />
      <AdminRoute path="/admin/products" component={AdminProductsPage} />
      <AdminRoute path="/admin/vendors" component={AdminVendorsPage} />
      <AdminRoute path="/admin/clients" component={AdminClientsPage} />
      <AdminRoute path="/admin/price-management" component={AdminPriceManagementPage} />
      <AdminRoute path="/admin/price-requests" component={AdminPriceRequestsPage} />
      <AdminRoute path="/admin/orders" component={AdminOrdersPage} />
      <AdminRoute path="/admin/order-modifications" component={OrderModificationsPage} />
      <AdminRoute path="/admin/issue-reports" component={IssueReportsPage} />
      <AdminRoute path="/admin/feedback" component={CustomerFeedbackPage} />
      <AdminRoute path="/admin/error-logs" component={AdminErrorLogsPage} />
      <AdminRoute path="/admin/documents" component={AdminDocumentsPage} />
      <AdminRoute path="/admin/ltas/:id" component={AdminLtaDetailPage} />
      <AdminRoute path="/admin/ltas" component={AdminLtaListPage} />
      <AdminRoute path="/admin/reports" component={AdminReportsPage} />
      <AdminRoute path="/admin/demo-requests" component={AdminDemoRequestsPage} />
      <AdminRoute path="/admin/design-system" component={DesignSystemPage} />

      <Route component={NotFoundPage} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect to onboarding if user needs it
  useEffect(() => {
    if (!isLoading && user && (user as any).needsOnboarding && location !== '/onboarding') {
      setLocation('/onboarding');
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
      <Toaster />
      <InstallPrompt />
      <NotificationPermission />
    </>
  );
}

function AppWithProviders() {
  const { isAuthenticated, isLoading } = useAuth();

  // Track page views
  usePageTracking();

  // Initialize cache persistence on mount
  useEffect(() => {
    initializeCachePersistence();
  }, []);

  // Initialize monitoring in production
  useEffect(() => {
    if (import.meta.env.PROD) {
      // Log performance metrics after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          const metrics = performanceMonitoring.getMetrics();
        }, 3000);
      });

      // Set up error monitoring context
      const originalCaptureError = errorMonitoring.captureError.bind(errorMonitoring);
      errorMonitoring.captureError = (error, context) => {
        originalCaptureError(error, {
          ...context,
          metadata: {
            ...context?.metadata,
            isAuthenticated,
          },
        });
      };
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithProviders />
    </QueryClientProvider>
  );
}

export default App;