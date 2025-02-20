import { useParams } from "wouter";
import { QRScanner } from "@/components/qr-scanner";
import { TicketForm } from "@/components/ticket-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function ScanTicket() {
  const { location: paramLocation } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [scannedLocation, setScannedLocation] = useState<string | undefined>(paramLocation);

  const handleLocationScanned = (location: string) => {
    setScannedLocation(location);
  };

  // If user is not a tenant, redirect them to their respective dashboard
  if (user && user.role !== 'tenant') {
    setLocation(`/${user.role}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          {user?.role === 'tenant' ? (
            <h1 className="text-2xl font-bold">Report Maintenance Issue</h1>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/auth")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-8">
        <div className="max-w-2xl mx-auto">
          {!user ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Login Required</h2>
              <p className="text-muted-foreground">
                Please login or register to report maintenance issues.
              </p>
              <Button onClick={() => setLocation("/auth")}>
                Login / Register
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-muted-foreground">
                  Scan the QR code in your room or hostel area to report an issue
                </p>
              </div>

              <div className="grid gap-8">
                {!scannedLocation && <QRScanner onLocationScanned={handleLocationScanned} />}
                {scannedLocation && <TicketForm initialLocation={scannedLocation} />}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}