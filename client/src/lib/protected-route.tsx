import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Suspense } from "react";

// Loading fallback component for protected routes
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-border" />
  </div>
);

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <PageLoadingFallback />
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

  return (
    <Route path={path}>
      <Suspense fallback={<PageLoadingFallback />}>
        <Component />
      </Suspense>
    </Route>
  );
}
