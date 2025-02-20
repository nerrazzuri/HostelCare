import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { TicketList } from "@/components/ticket-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, LogOut, QrCode, Store } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <Button 
                variant="outline"
                onClick={() => setLocation("/ticket-history")}
                className="justify-start sm:justify-center"
              >
                <Clock className="mr-2 h-4 w-4" />
                Ticket History
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/vendor-management")}
                className="justify-start sm:justify-center"
              >
                <Store className="mr-2 h-4 w-4" />
                Manage Vendors
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/qr-management")}
                className="justify-start sm:justify-center"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Manage QR Codes
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
          <h2 className="text-xl font-semibold mb-2">Active Maintenance Tickets</h2>
          <p className="text-muted-foreground">
            Manage all active maintenance requests and assign them to wardens
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="all">All Active</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <TicketList />
          </TabsContent>
          <TabsContent value="unassigned" className="mt-4">
            <TicketList filter="unassigned" />
          </TabsContent>
          <TabsContent value="escalated" className="mt-4">
            <TicketList filter="escalated" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}