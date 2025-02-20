import { QRCodeGenerator } from "@/components/qr-code-generator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function QRCodeManagement() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/admin")}
              className="justify-start sm:justify-center w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
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