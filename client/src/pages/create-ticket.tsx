import { useParams } from "wouter";
import { TicketForm } from "@/components/ticket-form";

export default function CreateTicket() {
  const { location } = useParams();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          <h1 className="text-2xl font-bold">Report Maintenance Issue</h1>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-muted-foreground mb-8">
            Report your maintenance issue for {location}
          </p>
          
          <TicketForm initialLocation={decodeURIComponent(location)} />
        </div>
      </main>
    </div>
  );
}
