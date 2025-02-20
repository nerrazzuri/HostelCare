import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function QRScanner() {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    qrScanner.render(
      (decodedText) => {
        try {
          const locationData = JSON.parse(decodedText);
          if (locationData.location) {
            toast({
              title: "Location Scanned",
              description: `Location: ${locationData.location}`,
            });
            // Here you would typically update the form with the location
          }
        } catch (err) {
          toast({
            title: "Invalid QR Code",
            description: "The scanned QR code is not in the correct format",
            variant: "destructive",
          });
        }
      },
      (error) => {
        console.error(error);
      }
    );

    setScanner(qrScanner);

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div id="qr-reader" className="w-full max-w-sm mx-auto" />
        <div className="mt-4 text-center">
          <Button
            variant="secondary"
            onClick={() => scanner?.clear()}
          >
            Stop Scanner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
