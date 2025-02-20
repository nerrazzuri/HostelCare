import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import WardenDashboard from "@/pages/warden-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import CreateTicket from "@/pages/create-ticket";
import QRCodeManagement from "@/pages/qr-code-management";
import VendorManagement from "@/pages/vendor-management";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to={`/${user.role}`} /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route path="/ticket/create/:location" component={CreateTicket} />
      <ProtectedRoute path="/warden" component={WardenDashboard} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/qr-management" component={QRCodeManagement} />
      <ProtectedRoute path="/vendor-management" component={VendorManagement} />
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