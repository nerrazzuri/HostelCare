import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vendor } from "@shared/schema";
import { VendorList } from "@/components/vendor-list";
import { VendorForm } from "@/components/vendor-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function VendorManagement() {
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">Vendor Management</h1>
              <p className="text-muted-foreground">
                Manage external vendors for maintenance tasks
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>

        {isCreating ? (
          <VendorForm onSuccess={() => setIsCreating(false)} />
        ) : (
          <VendorList vendors={vendors} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
}