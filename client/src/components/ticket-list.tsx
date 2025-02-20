import { useQuery, useMutation } from "@tanstack/react-query";
import { Ticket, TicketStatus, User } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock } from "lucide-react";

interface TicketListProps {
  filter?: string;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  assigned: "bg-yellow-500",
  in_progress: "bg-purple-500",
  needs_vendor: "bg-orange-500",
  escalated: "bg-red-500",
  resolved: "bg-green-500",
};

export function TicketList({ filter }: TicketListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: wardens = [] } = useQuery<User[]>({
    queryKey: ["/api/users/wardens"],
    enabled: user?.role === "admin",
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Ticket> }) => {
      const res = await apiRequest("PATCH", `/api/tickets/${id}`, updates);
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

  let filteredTickets = tickets;
  if (filter === "unassigned") {
    filteredTickets = tickets.filter(t => !t.assignedTo);
  } else if (filter === "escalated") {
    filteredTickets = tickets.filter(t => t.status === TicketStatus.ESCALATED);
  }

  if (isLoading) {
    return <div className="text-center">Loading tickets...</div>;
  }

  if (filteredTickets.length === 0) {
    return (
      <Card className="text-center p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No tickets found</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredTickets.map((ticket) => (
        <Card key={ticket.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{ticket.title}</CardTitle>
              <Badge className={statusColors[ticket.status]}>
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {ticket.description}
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
          {user?.role === "admin" && (
            <CardFooter className="flex gap-2">
              <Select
                value={ticket.status}
                onValueChange={(status) =>
                  updateTicketMutation.mutate({
                    id: ticket.id,
                    updates: { status },
                  })
                }
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
                      id: ticket.id,
                      updates: {
                        assignedTo: parseInt(wardenId),
                        status: TicketStatus.ASSIGNED,
                      },
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
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
