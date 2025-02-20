import { useParams } from "wouter";
import { QRScanner } from "@/components/qr-scanner";
import { TicketForm } from "@/components/ticket-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function ScanTicket() {
  const { location: paramLocation } = useParams();
  const [, setLocation] = useLocation();
  const [scannedLocation, setScannedLocation] = useState<string | undefined>(paramLocation);

  const handleLocationScanned = (location: string) => {
    setScannedLocation(location);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/tenant")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Report an Issue</h1>
            <p className="text-muted-foreground">
              Scan the QR code to identify the location or enter the details manually
            </p>
          </div>

          <div className="grid gap-8">
            <QRScanner onLocationScanned={handleLocationScanned} />
            <TicketForm initialLocation={scannedLocation} />
          </div>
        </div>
      </main>
    </div>
  );
}