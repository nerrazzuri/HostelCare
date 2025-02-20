import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, TicketStatus, User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, User as UserIcon } from "lucide-react";
import { TicketUpdates } from "./ticket-updates";
import { TicketUpdateForm } from "./ticket-update-form";
import { Separator } from "@/components/ui/separator";

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
  open: boolean;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  assigned: "bg-yellow-500",
  in_progress: "bg-purple-500",
  needs_vendor: "bg-orange-500",
  escalated: "bg-red-500",
  resolved: "bg-green-500",
};

export function TicketDetails({ ticket, onClose, open }: TicketDetailsProps) {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);

  const { data: wardens = [] } = useQuery<User[]>({
    queryKey: ["/api/users/wardens"],
  });

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

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ticket Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">{ticket.title}</h2>
            <Badge className={statusColors[ticket.status]}>
              {ticket.status}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{ticket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{ticket.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Priority: {ticket.priority}</span>
              </div>
            </div>

            {ticket.images && ticket.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ticket.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Ticket image ${index + 1}`}
                      className="rounded-md object-cover w-full h-48"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Manage Ticket</h3>
              <div className="flex flex-col gap-4">
                <Select
                  value={selectedStatus}
                  onValueChange={(status) => {
                    setSelectedStatus(status);
                    updateTicketMutation.mutate({ status });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TicketStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!ticket.assignedTo && (
                  <Select
                    onValueChange={(wardenId) =>
                      updateTicketMutation.mutate({
                        assignedTo: parseInt(wardenId),
                        status: TicketStatus.ASSIGNED,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign warden" />
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
              </div>
            </div>
          </div>
          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Updates</h3>
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