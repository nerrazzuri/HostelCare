import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { TicketList } from "@/components/ticket-list";
import { useLocation } from "wouter";
import { QrCode, LogOut } from "lucide-react";

export default function TenantDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">Tenant Dashboard</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <Button 
                variant="outline"
                onClick={() => setLocation(`/scan/${user.hostelBlock}`)}
                className="justify-start sm:justify-center"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR Code
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => logoutMutation.mutate()}
                className="justify-start sm:justify-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl font-semibold mb-2">My Tickets</h2>
          <p className="text-muted-foreground">
            View and track your maintenance requests
          </p>
        </div>

        <TicketList />
      </main>
    </div>
  );
}