import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { TicketList } from "@/components/ticket-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";

export default function WardenDashboard() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4 flex justify-between items-center">
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

      <main className="max-w-[95%] mx-auto px-2 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">My Assigned Tickets</h2>
          <p className="text-muted-foreground">
            Manage maintenance requests and coordinate with vendors when needed
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active Tickets</TabsTrigger>
            <TabsTrigger value="vendor">Vendor Required</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <TicketList filter="active" />
          </TabsContent>
          <TabsContent value="vendor">
            <TicketList filter="needs_vendor" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}