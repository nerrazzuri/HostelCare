import { QRCodeGenerator } from "@/components/qr-code-generator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function QRCodeManagement() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/admin")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">QR Code Management</h1>
          <p className="text-muted-foreground">
            Generate and manage QR codes for different locations in the hostel
          </p>
        </div>

        <QRCodeGenerator />
      </main>
    </div>
  );
}
