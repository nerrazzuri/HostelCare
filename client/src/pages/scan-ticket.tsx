import { useParams } from "wouter";
import { QRScanner } from "@/components/qr-scanner";
import { TicketForm } from "@/components/ticket-form";
import { Button } from "@/components/ui/button";
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
          <h1 className="text-2xl font-bold">Report Maintenance Issue</h1>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <p className="text-muted-foreground">
              Scan the QR code in your room or hostel area to report an issue
            </p>
          </div>

          <div className="grid gap-8">
            {!scannedLocation && <QRScanner onLocationScanned={handleLocationScanned} />}
            {scannedLocation && <TicketForm initialLocation={scannedLocation} />}
          </div>
        </div>
      </main>
    </div>
  );
}