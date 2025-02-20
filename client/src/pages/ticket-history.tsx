import { useQuery } from "@tanstack/react-query";
import { Ticket } from "@shared/schema";
import { TicketList } from "@/components/ticket-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TicketHistory() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/admin")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Ticket History</h1>
          <p className="text-muted-foreground">
            View all resolved maintenance tickets and their details
          </p>
        </div>

        <TicketList filter="resolved" />
      </main>
    </div>
  );
}
