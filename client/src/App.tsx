import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import OrderingPage from "@/pages/OrderingPage";
import ClientProfilePage from "@/pages/ClientProfilePage";
import AdminPage from "@/pages/AdminPage";
import AdminProductsPage from "@/pages/AdminProductsPage";
import AdminVendorsPage from "@/pages/AdminVendorsPage";
import AdminClientsPage from "@/pages/AdminClientsPage";
import AdminLtaListPage from "@/pages/AdminLtaListPage";
import AdminLtaDetailPage from "@/pages/AdminLtaDetailPage";
import AdminPriceRequestsPage from '@/pages/AdminPriceRequestsPage';
import AdminPriceOffersPage from '@/pages/AdminPriceOffersPage';
import PriceRequestPage from '@/pages/PriceRequestPage';
import ClientPriceOffersPage from '@/pages/ClientPriceOffersPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CatalogPage from '@/pages/CatalogPage';
import { ProtectedRoute } from '@/lib/protected-route';
import "./lib/i18n";
import { HelmetProvider } from 'react-helmet-async';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

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
        <LandingPage />
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
  const { user, isAuthenticated } = useAuth();

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={LandingPage} />
      ) : (
        <>
          <Route path="/">
            {(user as any)?.isAdmin ? <Redirect to="/admin" /> : <OrderingPage />}
          </Route>
          <ProtectedRoute path="/ordering" component={OrderingPage} />
          <Route path="/profile" component={ClientProfilePage} />
        </>
      )}
      <AdminRoute path="/admin" component={AdminPage} />
      <AdminRoute path="/admin/products" component={AdminProductsPage} />
      <AdminRoute path="/admin/vendors" component={AdminVendorsPage} />
      <AdminRoute path="/admin/clients" component={AdminClientsPage} />
      <AdminRoute path="/admin/price-requests" component={AdminPriceRequestsPage} />
      <AdminRoute path="/admin/price-offers" component={AdminPriceOffersPage} />
      <AdminRoute path="/admin/ltas/:id" component={AdminLtaDetailPage} />
      <AdminRoute path="/admin/ltas" component={AdminLtaListPage} />

      <ProtectedRoute path="/price-request" component={PriceRequestPage} />
      <ProtectedRoute path="/price-offers" component={ClientPriceOffersPage} />

      {/* Public product pages for SEO */}
      <Route path="/products/:subCategory/:productName" component={ProductDetailPage} />
      <Route path="/catalog/:category" component={CatalogPage} />
      <Route path="/catalog" component={CatalogPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <ThemeProvider>
            <LanguageProvider>
              <Router />
              <Toaster />
            </LanguageProvider>
          </ThemeProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;