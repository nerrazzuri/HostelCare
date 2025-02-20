import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, TicketStatus, User, Vendor } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, Store } from "lucide-react";
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

// Available status transitions based on current status and role
const getAvailableStatuses = (currentStatus: string, role: string): string[] => {
  if (role === "warden") {
    switch (currentStatus) {
      case TicketStatus.IN_PROGRESS:
        return [TicketStatus.NEEDS_VENDOR, TicketStatus.PENDING_APPROVAL];
      case TicketStatus.NEEDS_VENDOR:
        return [TicketStatus.IN_PROGRESS]; // Can revert if vendor not needed
      default:
        return [];
    }
  }
  return [];
};

export function TicketDetails({ ticket, onClose, open }: TicketDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);
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

  const availableStatuses = getAvailableStatuses(ticket.status, user?.role || "");
  const canAssignWarden = user?.role === "admin" && ticket.status === TicketStatus.OPEN;
  const canApproveVendor = user?.role === "admin" && ticket.status === TicketStatus.NEEDS_VENDOR;
  const canApproveResolution = user?.role === "admin" && ticket.status === TicketStatus.PENDING_APPROVAL;

  // Warden-specific handlers
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    if (newStatus === TicketStatus.NEEDS_VENDOR) {
      setShowVendorSelect(true);
    } else {
      setShowVendorSelect(false);
      updateTicketMutation.mutate({ status: newStatus });
    }
  };

  const handleVendorSelection = (vendorId: string) => {
    updateTicketMutation.mutate({
      vendorId: parseInt(vendorId),
      status: TicketStatus.NEEDS_VENDOR,
    });
    setShowVendorSelect(false);
  };

  // Admin-specific handlers
  const handleWardenAssignment = (wardenId: string) => {
    updateTicketMutation.mutate({
      assignedTo: parseInt(wardenId),
      status: TicketStatus.IN_PROGRESS,
    });
  };

  const handleVendorApproval = (action: "approve" | "reject") => {
    updateTicketMutation.mutate({
      status: action === "approve" ? TicketStatus.IN_PROGRESS : TicketStatus.IN_PROGRESS,
      vendorId: action === "reject" ? null : ticket.vendorId,
    });
  };

  const handleResolutionApproval = (action: "approve" | "reject") => {
    updateTicketMutation.mutate({
      status: action === "approve" ? TicketStatus.RESOLVED : TicketStatus.IN_PROGRESS,
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

            {ticket.images && ticket.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ticket.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Ticket image ${index + 1}`}
                      className="rounded-md object-cover w-full aspect-video"
                    />
                  ))}
                </div>
              </div>
            )}

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
                  <Select onValueChange={handleWardenAssignment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to warden" />
                    </SelectTrigger>
                    <SelectContent>
                      {wardens.map((warden) => (
                        <SelectItem key={warden.id} value={warden.id.toString()}>
                          {warden.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Vendor Approval */}
                {canApproveVendor && (
                  <Select onValueChange={handleVendorApproval}>
                    <SelectTrigger>
                      <SelectValue placeholder="Review vendor selection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve Vendor & Start Work</SelectItem>
                      <SelectItem value="reject">Reject & Request Changes</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Resolution Approval */}
                {canApproveResolution && (
                  <Select onValueChange={handleResolutionApproval}>
                    <SelectTrigger>
                      <SelectValue placeholder="Review resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve & Close Ticket</SelectItem>
                      <SelectItem value="reject">Request Changes</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Warden Actions */}
            {user?.role === "warden" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Update Status</h3>

                {/* Status Changes */}
                {availableStatuses.length > 0 && (
                  <Select
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, ' ').replace(/\w\S*/g, 
                            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Vendor Selection */}
                {showVendorSelect && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Select Vendor</h3>
                    <Select onValueChange={handleVendorSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vendor" />
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