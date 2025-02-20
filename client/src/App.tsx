import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import TenantDashboard from "@/pages/tenant-dashboard";
import WardenDashboard from "@/pages/warden-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ScanTicket from "@/pages/scan-ticket";
import QRCodeManagement from "@/pages/qr-code-management";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to={`/${user.role}`} /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/tenant" component={TenantDashboard} />
      <ProtectedRoute path="/warden" component={WardenDashboard} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/scan/:location" component={ScanTicket} />
      <ProtectedRoute path="/qr-management" component={QRCodeManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;