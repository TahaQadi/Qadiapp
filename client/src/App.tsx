import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, lazy, Suspense } from "react";
import NotFoundPage from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import OnboardingPage from "@/pages/OnboardingPage";
import LoginPage from "@/pages/LoginPage";
import LogoutPage from "@/pages/LogoutPage";
import OrderingPage from "@/pages/OrderingPage";
import ClientProfilePage from "@/pages/ClientProfilePage";
import AdminPage from "@/pages/AdminPage";
import AdminProductsPage from "@/pages/AdminProductsPage";
import AdminVendorsPage from "@/pages/AdminVendorsPage";
import AdminClientsPage from "@/pages/AdminClientsPage";
import AdminLtaListPage from "@/pages/AdminLtaListPage";
import AdminLtaDetailPage from "@/pages/AdminLtaDetailPage";
import AdminPriceRequestsPage from './pages/AdminPriceRequestsPage';
import AdminPriceOffersPage from './pages/AdminPriceOffersPage';
import AdminPriceManagementPage from './pages/AdminPriceManagementPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminTemplatesPage from './pages/AdminTemplatesPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import AdminDocumentListPage from './pages/AdminDocumentListPage';
import OrderModificationsPage from './pages/admin/OrderModificationsPage';
import OrdersPage from './pages/OrdersPage';
import PriceRequestPage from '@/pages/PriceRequestPage';
import ClientPriceOffersPage from '@/pages/ClientPriceOffersPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CatalogPage from '@/pages/CatalogPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminDemoRequestsPage from "@/pages/AdminDemoRequestsPage";
import { ProtectedRoute } from '@/lib/protected-route';
import "./lib/i18n";
import { HelmetProvider } from 'react-helmet-async';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { InstallPrompt } from '@/components/InstallPrompt';
import { NotificationPermission } from '@/components/NotificationPermission';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { usePageTracking } from '@/lib/analytics';
import { errorMonitoring } from '@/lib/errorMonitoring';
import { performanceMonitoring } from '@/lib/performanceMonitoring';

// Lazy load Admin components with preload capability
const AdminOrderModificationsPage = lazy(() => import('@/pages/admin/OrderModificationsPage'));
const AdminErrorLogsPage = lazy(() => import('@/pages/admin/ErrorLogsPage'));
const IssueReportsPage = lazy(() => import('@/pages/admin/IssueReportsPage'));
const FeedbackDashboardPage = lazy(() => import('@/pages/admin/FeedbackDashboardPage'));


function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
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

  return <Route path={path} component={Component} />;
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/landing" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/logout" component={LogoutPage} />

      {/* Public product pages for SEO */}
      <Route path="/products/:subCategory/:productName" component={ProductDetailPage} />
      <Route path="/catalog/:category" component={CatalogPage} />
      <Route path="/catalog" component={CatalogPage} />

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
        <>
          <Route path="/">
            {(user as any)?.isAdmin ? <Redirect to="/admin" /> : <Redirect to="/ordering" />}
          </Route>
          <ProtectedRoute path="/ordering" component={OrderingPage} />
          <ProtectedRoute path="/orders" component={OrdersPage} />
          <Route path="/profile" component={ClientProfilePage} />
        </>
      )}

      {/* Admin routes */}
      <AdminRoute path="/admin" component={AdminPage} />
      <AdminRoute path="/admin/products" component={AdminProductsPage} />
      <AdminRoute path="/admin/vendors" component={AdminVendorsPage} />
      <AdminRoute path="/admin/clients" component={AdminClientsPage} />
      <AdminRoute path="/admin/price-management" component={AdminPriceManagementPage} />
      <AdminRoute path="/admin/price-requests" component={AdminPriceRequestsPage} />
      <AdminRoute path="/admin/price-offers" component={AdminPriceOffersPage} />
      <AdminRoute path="/admin/orders" component={AdminOrdersPage} />
      <AdminRoute path="/admin/order-modifications" component={AdminOrderModificationsPage} />
      <AdminRoute path="/admin/issue-reports" component={IssueReportsPage} />
      <AdminRoute path="/admin/feedback" component={lazy(() => import("@/pages/admin/CustomerFeedbackPage"))} />
      <AdminRoute path="/admin/error-logs" component={AdminErrorLogsPage} />
      <AdminRoute path="/admin/templates/documents" component={AdminTemplatesPage} />
      <AdminRoute path="/admin/documents" component={AdminDocumentListPage} />
      <AdminRoute path="/admin/ltas/:id" component={AdminLtaDetailPage} />
      <AdminRoute path="/admin/ltas" component={AdminLtaListPage} />
      <AdminRoute path="/admin/reports" component={AdminReportsPage} />
      <AdminRoute path="/admin/demo-requests" component={AdminDemoRequestsPage} />

      <ProtectedRoute path="/price-request" component={PriceRequestPage} />
      <ProtectedRoute path="/price-offers" component={ClientPriceOffersPage} />

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

  // Initialize monitoring in production
  useEffect(() => {
    if (import.meta.env.PROD) {
      // Log performance metrics after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          const metrics = performanceMonitoring.getMetrics();
          console.log('[Performance] Core Web Vitals:', metrics);
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