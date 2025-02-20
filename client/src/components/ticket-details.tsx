import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, TicketStatus, User, Vendor } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, Store, AlertCircle, Image } from "lucide-react";
import { TicketUpdates } from "./ticket-updates";
import { TicketUpdateForm } from "./ticket-update-form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
  open: boolean;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-purple-500/10 text-purple-500",
  needs_vendor: "bg-orange-500/10 text-orange-500",
  vendor_assigned: "bg-yellow-500/10 text-yellow-500",
  pending_approval: "bg-yellow-500/10 text-yellow-500",
  resolved: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export function TicketDetails({ ticket, onClose, open }: TicketDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showVendorSelect, setShowVendorSelect] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedWardenId, setSelectedWardenId] = useState<string>("");

  // Fetch wardens list for admin
  const { data: wardens = [] } = useQuery<User[]>({
    queryKey: ["/api/users/wardens"],
    enabled: user?.role === "admin" && ticket.status === TicketStatus.OPEN,
  });

  // Fetch vendors list
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: showVendorSelect,
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
      if (showVendorSelect) setShowVendorSelect(false);
      onClose(); // Auto-close after successful mutation
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin can assign wardens to open tickets
  const canAssignWarden = user?.role === "admin" && ticket.status === TicketStatus.OPEN;

  // Admin can modify vendor selection during needs_vendor status
  const canModifyVendor = user?.role === "admin" &&
    ticket.status === TicketStatus.NEEDS_VENDOR &&
    ticket.status !== TicketStatus.PENDING_APPROVAL;

  // Admin can approve resolution
  const canApproveResolution = user?.role === "admin" && ticket.status === TicketStatus.PENDING_APPROVAL;

  // Warden can resolve ticket when it's in progress or vendor assigned
  const canWardenResolve = user?.role === "warden" &&
    (ticket.status === TicketStatus.IN_PROGRESS || ticket.status === TicketStatus.VENDOR_ASSIGNED);

  // Admin handlers
  const handleWardenAssignment = () => {
    if (!selectedWardenId) {
      toast({
        title: "Error",
        description: "Please select a warden first",
        variant: "destructive",
      });
      return;
    }

    updateTicketMutation.mutate({
      assignedTo: parseInt(selectedWardenId),
      status: TicketStatus.IN_PROGRESS,
    });
  };

  const handleVendorApproval = (approve: boolean = true) => {
    if (approve) {
      if (!ticket.vendorId && !selectedVendorId) {
        toast({
          title: "Error",
          description: "Please select a vendor first",
          variant: "destructive",
        });
        return;
      }

      updateTicketMutation.mutate({
        vendorId: ticket.vendorId || parseInt(selectedVendorId),
        status: TicketStatus.VENDOR_ASSIGNED,
      });
    } else {
      // Reject the vendor and set status back to in_progress
      updateTicketMutation.mutate({
        vendorId: null,
        status: TicketStatus.IN_PROGRESS,
      });
    }
  };

  const handleResolutionApproval = (approved: boolean) => {
    updateTicketMutation.mutate({
      status: approved ? TicketStatus.RESOLVED : TicketStatus.IN_PROGRESS,
    });
  };

  // Warden handlers
  const handleNeedsVendor = () => {
    setShowVendorSelect(true);
  };

  const handleMarkResolved = () => {
    updateTicketMutation.mutate({
      status: TicketStatus.PENDING_APPROVAL,
    });
  };

  const handleVendorSelection = () => {
    if (!selectedVendorId) {
      toast({
        title: "Error",
        description: "Please select a vendor first",
        variant: "destructive",
      });
      return;
    }

    updateTicketMutation.mutate({
      vendorId: parseInt(selectedVendorId),
      status: TicketStatus.NEEDS_VENDOR,
    });
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto border-l">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Ticket #{ticket.id}</div>
              <SheetTitle className="text-xl mt-1">{ticket.title}</SheetTitle>
            </div>
            <Badge className={statusColors[ticket.status]}>
              {ticket.status.replace(/_/g, ' ').replace(/\w\S*/g,
                (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
              )}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm">{ticket.description}</p>
            </div>

            {ticket.images && ticket.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Images</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ticket.images.map((imagePath, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer relative aspect-square">
                          <img
                            src={imagePath}
                            alt={`Ticket image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                          />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <img
                          src={imagePath}
                          alt={`Ticket image ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            )}

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
                    <div className="flex gap-2">
                      <Select
                        value={selectedWardenId}
                        onValueChange={setSelectedWardenId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose warden" />
                        </SelectTrigger>
                        <SelectContent>
                          {wardens.map((warden) => (
                            <SelectItem key={warden.id} value={warden.id.toString()}>
                              {warden.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleWardenAssignment}
                        disabled={!selectedWardenId || updateTicketMutation.isPending}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                )}

                {/* Vendor Approval with Selection */}
                {canModifyVendor && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      {ticket.vendorId ? "Vendor Selection Review" : "Select Vendor"}
                    </h4>

                    {/* Show currently selected vendor if any */}
                    {ticket.vendorId && selectedVendor && (
                      <div className="p-4 border rounded-lg bg-muted">
                        <div className="text-sm font-medium mb-2">Currently Selected Vendor:</div>
                        <div className="flex items-center gap-2">
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

                    {/* Choose new vendor option */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {ticket.vendorId
                            ? "You can either approve the selected vendor or choose a different one"
                            : "Select a vendor for this ticket"}
                        </span>
                      </div>

                      <Select
                        value={selectedVendorId}
                        onValueChange={setSelectedVendorId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors
                            .filter((v) => v.isActive)
                            .map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4" />
                                  <span>{vendor.name}</span>
                                  <span className="text-muted-foreground">
                                    ({vendor.specialization})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {ticket.vendorId && (
                        <Button
                          variant="outline"
                          onClick={() => handleVendorApproval(true)}
                          disabled={updateTicketMutation.isPending}
                          className="flex-1"
                        >
                          Approve Current Vendor
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleVendorApproval(true)}
                        disabled={!selectedVendorId || updateTicketMutation.isPending}
                        className="flex-1"
                      >
                        {ticket.vendorId ? "Assign New Vendor" : "Assign Vendor"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleVendorApproval(false)}
                        disabled={updateTicketMutation.isPending}
                        className="flex-1"
                      >
                        Reject & Return
                      </Button>
                    </div>
                  </div>
                )}

                {/* Resolution Approval */}
                {canApproveResolution && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Review Resolution</h4>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Warden has marked this ticket as resolved
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleResolutionApproval(true)}
                        disabled={updateTicketMutation.isPending}
                        className="flex-1"
                      >
                        Approve & Close
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolutionApproval(false)}
                        disabled={updateTicketMutation.isPending}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Warden Actions */}
            {user?.role === "warden" && (canWardenResolve || showVendorSelect) && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Warden Actions</h3>

                {!showVendorSelect && (
                  <div className="flex gap-2">
                    {ticket.status === TicketStatus.IN_PROGRESS && (
                      <Button
                        variant="outline"
                        onClick={handleNeedsVendor}
                        disabled={updateTicketMutation.isPending}
                        className="flex-1"
                      >
                        <Store className="mr-2 h-4 w-4" />
                        Need Vendor
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleMarkResolved}
                      disabled={updateTicketMutation.isPending}
                      className="flex-1"
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                )}

                {/* Vendor Selection */}
                {showVendorSelect && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Select Vendor</h4>
                    <div className="flex gap-2">
                      <Select
                        value={selectedVendorId}
                        onValueChange={setSelectedVendorId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors
                            .filter((v) => v.isActive)
                            .map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4" />
                                  <span>{vendor.name}</span>
                                  <span className="text-muted-foreground">
                                    ({vendor.specialization})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleVendorSelection}
                        disabled={!selectedVendorId || updateTicketMutation.isPending}
                      >
                        Submit
                      </Button>
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