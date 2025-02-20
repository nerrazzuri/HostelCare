import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { TicketList } from "@/components/ticket-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
          <h2 className="text-xl font-semibold mb-2">Maintenance Tickets</h2>
          <p className="text-muted-foreground">
            Manage all maintenance requests and assign them to wardens
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Tickets</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <TicketList />
          </TabsContent>
          <TabsContent value="unassigned">
            <TicketList filter="unassigned" />
          </TabsContent>
          <TabsContent value="escalated">
            <TicketList filter="escalated" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
