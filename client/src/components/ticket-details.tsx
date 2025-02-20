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
  const [selectedWardenId, setSelectedWardenId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedVendorAction, setSelectedVendorAction] = useState<string>("");
  const [selectedResolutionAction, setSelectedResolutionAction] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");


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

  // Admin-specific handlers
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
    setSelectedWardenId("");
  };

  const handleVendorApproval = () => {
    if (!selectedVendorAction) {
      toast({
        title: "Error",
        description: "Please select an action",
        variant: "destructive",
      });
      return;
    }

    updateTicketMutation.mutate({
      status: selectedVendorAction === "approve" ? TicketStatus.IN_PROGRESS : TicketStatus.IN_PROGRESS,
      vendorId: selectedVendorAction === "reject" ? null : ticket.vendorId,
    });
    setSelectedVendorAction("");
  };

  const handleResolutionApproval = () => {
    if (!selectedResolutionAction) {
      toast({
        title: "Error",
        description: "Please select an action",
        variant: "destructive",
      });
      return;
    }

    updateTicketMutation.mutate({
      status: selectedResolutionAction === "approve" ? TicketStatus.RESOLVED : TicketStatus.IN_PROGRESS,
    });
    setSelectedResolutionAction("");
  };

  // Warden-specific handlers
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
    setSelectedVendorId("");
    setShowVendorSelect(false);
  };

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    if (selectedStatus === TicketStatus.NEEDS_VENDOR) {
      setShowVendorSelect(true);
    } else {
      updateTicketMutation.mutate({ status: selectedStatus });
    }
    setSelectedStatus("");
  };

  const handleNeedsVendor = () => {
    setSelectedStatus(TicketStatus.NEEDS_VENDOR);
    handleStatusUpdate();
  };

  const handleRequestApproval = () => {
    setSelectedStatus(TicketStatus.PENDING_APPROVAL);
    handleStatusUpdate();
  };

  const handleWardenAssignmentOld = (wardenId: number) => {
    updateTicketMutation.mutate({
      assignedTo: wardenId,
      status: TicketStatus.IN_PROGRESS,
    });
  };

  const handleVendorApprovalOld = (approved: boolean) => {
    updateTicketMutation.mutate({
      status: approved ? TicketStatus.IN_PROGRESS : TicketStatus.IN_PROGRESS,
      vendorId: approved ? ticket.vendorId : null,
    });
  };

  const handleResolutionApprovalOld = (approved: boolean) => {
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

                {/* Vendor Approval */}
                {canApproveVendor && selectedVendor && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Review Vendor Selection</h4>
                    <div className="flex gap-2">
                      <Select
                        value={selectedVendorAction}
                        onValueChange={setSelectedVendorAction}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">Approve Vendor & Start Work</SelectItem>
                          <SelectItem value="reject">Reject & Request Changes</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleVendorApproval}
                        disabled={!selectedVendorAction || updateTicketMutation.isPending}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                )}

                {/* Resolution Approval */}
                {canApproveResolution && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Review Resolution</h4>
                    <div className="flex gap-2">
                      <Select
                        value={selectedResolutionAction}
                        onValueChange={setSelectedResolutionAction}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">Approve & Close Ticket</SelectItem>
                          <SelectItem value="reject">Request Changes</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleResolutionApproval}
                        disabled={!selectedResolutionAction || updateTicketMutation.isPending}
                      >
                        Submit
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

                {/* Status Changes */}
                {ticket.status === TicketStatus.IN_PROGRESS && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Update Status</h4>
                    <div className="flex gap-2">
                      <Select
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TicketStatus.NEEDS_VENDOR}>Need Vendor</SelectItem>
                          <SelectItem value={TicketStatus.PENDING_APPROVAL}>Request Approval</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleStatusUpdate}
                        disabled={!selectedStatus || updateTicketMutation.isPending}
                      >
                        Update
                      </Button>
                    </div>
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
                        Select
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