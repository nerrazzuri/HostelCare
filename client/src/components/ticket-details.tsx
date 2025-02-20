import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, TicketStatus, User, Vendor } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, Store, X, Check } from "lucide-react";
import { TicketUpdates } from "./ticket-updates";
import { TicketUpdateForm } from "./ticket-update-form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
  open: boolean;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-yellow-500/10 text-yellow-500",
  needs_vendor: "bg-orange-500/10 text-orange-500",
  pending_approval: "bg-yellow-500/10 text-yellow-500",
  resolved: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export function TicketDetails({ ticket, onClose, open }: TicketDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showVendorSelect, setShowVendorSelect] = useState(false);

  // Fetch wardens list for admin
  const { data: wardens = [] } = useQuery<User[]>({
    queryKey: ["/api/users/wardens"],
    enabled: user?.role === "admin" && ticket.status === TicketStatus.OPEN,
  });

  // Fetch vendors list
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: showVendorSelect || (user?.role === "admin" && ticket.status === TicketStatus.NEEDS_VENDOR),
  });

  // Get selected vendor if any
  const selectedVendor = vendors.find(v => v.id === ticket.vendorId);

  const updateTicketMutation = useMutation({
    mutationFn: async (updates: Partial<Ticket>) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticket.id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canAssignWarden = user?.role === "admin" && ticket.status === TicketStatus.OPEN;
  const canApproveVendor = user?.role === "admin" && ticket.status === TicketStatus.NEEDS_VENDOR;
  const canApproveResolution = user?.role === "admin" && ticket.status === TicketStatus.PENDING_APPROVAL;

  // Warden-specific handlers
  const handleNeedsVendor = () => {
    setShowVendorSelect(true);
  };

  const handleVendorSelection = (vendorId: string) => {
    updateTicketMutation.mutate({
      vendorId: parseInt(vendorId),
      status: TicketStatus.NEEDS_VENDOR,
    });
    setShowVendorSelect(false);
  };

  const handleRequestApproval = () => {
    updateTicketMutation.mutate({
      status: TicketStatus.PENDING_APPROVAL,
    });
  };

  // Admin-specific handlers
  const handleWardenAssignment = (wardenId: number) => {
    updateTicketMutation.mutate({
      assignedTo: wardenId,
      status: TicketStatus.IN_PROGRESS,
    });
  };

  const handleVendorApproval = (approved: boolean) => {
    updateTicketMutation.mutate({
      status: approved ? TicketStatus.IN_PROGRESS : TicketStatus.IN_PROGRESS,
      vendorId: approved ? ticket.vendorId : null,
    });
  };

  const handleResolutionApproval = (approved: boolean) => {
    updateTicketMutation.mutate({
      status: approved ? TicketStatus.RESOLVED : TicketStatus.IN_PROGRESS,
    });
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto border-l">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-start">
            <div>
              <div className="text-sm text-muted-foreground">Ticket #{ticket.id}</div>
              <SheetTitle className="text-xl mt-1">{ticket.title}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
              <Badge className={statusColors[ticket.status]}>
                {ticket.status.replace(/_/g, ' ').replace(/\w\S*/g, 
                  (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                )}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm">{ticket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.location}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Selected Vendor Info (if any) */}
            {selectedVendor && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Assigned Vendor</h3>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{selectedVendor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedVendor.specialization}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {user?.role === "admin" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Admin Actions</h3>

                {/* Warden Assignment */}
                {canAssignWarden && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Assign to Warden</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {wardens.map((warden) => (
                        <Button
                          key={warden.id}
                          variant="outline"
                          onClick={() => handleWardenAssignment(warden.id)}
                        >
                          {warden.username}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vendor Approval */}
                {canApproveVendor && selectedVendor && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Review Vendor Selection</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleVendorApproval(true)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve Vendor
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleVendorApproval(false)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject Vendor
                      </Button>
                    </div>
                  </div>
                )}

                {/* Resolution Approval */}
                {canApproveResolution && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Review Resolution</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleResolutionApproval(true)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve & Close
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleResolutionApproval(false)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Request Changes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Warden Actions */}
            {user?.role === "warden" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Warden Actions</h3>

                {/* Status Change Buttons */}
                {ticket.status === TicketStatus.IN_PROGRESS && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleNeedsVendor}
                    >
                      <Store className="mr-2 h-4 w-4" />
                      Need Vendor
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleRequestApproval}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Request Approval
                    </Button>
                  </div>
                )}

                {/* Vendor Selection */}
                {showVendorSelect && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Select Vendor</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {vendors
                        .filter((v) => v.isActive)
                        .map((vendor) => (
                          <Button
                            key={vendor.id}
                            variant="outline"
                            onClick={() => handleVendorSelection(vendor.id.toString())}
                            className="justify-start"
                          >
                            <Store className="mr-2 h-4 w-4" />
                            <div className="flex items-center gap-2">
                              <span>{vendor.name}</span>
                              <span className="text-muted-foreground">
                                ({vendor.specialization})
                              </span>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Updates</h3>
            <TicketUpdateForm ticketId={ticket.id} />
            <div className="mt-6">
              <TicketUpdates ticketId={ticket.id} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}