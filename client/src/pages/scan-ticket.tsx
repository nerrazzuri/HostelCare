import { useParams } from "wouter";
import { QRScanner } from "@/components/qr-scanner";
import { TicketForm } from "@/components/ticket-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ScanTicket() {
  const { location } = useParams();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/tenant")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Report an Issue</h1>
            <p className="text-muted-foreground">
              Scan the QR code to identify the location or enter the details manually
            </p>
          </div>

          <div className="grid gap-8">
            <QRScanner />
            <TicketForm initialLocation={location} />
          </div>
        </div>
      </main>
    </div>
  );
}
