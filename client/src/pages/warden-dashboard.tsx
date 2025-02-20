import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { TicketList } from "@/components/ticket-list";
import { LogOut } from "lucide-react";

export default function WardenDashboard() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Warden Dashboard</h1>
          <Button 
            variant="ghost" 
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Assigned Tickets</h2>
          <p className="text-muted-foreground">
            Manage and update the status of assigned maintenance requests
          </p>
        </div>

        <TicketList />
      </main>
    </div>
  );
}
