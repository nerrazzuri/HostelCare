import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ticket, TicketStatus, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Search } from "lucide-react";
import { TicketDetails } from "./ticket-details";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: wardens = [] } = useQuery<User[]>({
    queryKey: ["/api/users/wardens"],
    enabled: user?.role === "admin",
  });

  let filteredTickets = tickets;
  if (filter === "unassigned") {
    filteredTickets = tickets.filter(t => !t.assignedTo);
  } else if (filter === "escalated") {
    filteredTickets = tickets.filter(t => t.status === TicketStatus.ESCALATED);
  }

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => 
      ticket.title.toLowerCase().includes(query) ||
      ticket.description.toLowerCase().includes(query) ||
      ticket.location.toLowerCase().includes(query)
    );
  }

  if (isLoading) {
    return <div className="text-center">Loading tickets...</div>;
  }

  if (filteredTickets.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No tickets found</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow 
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTicket(ticket)}
              >
                <TableCell className="font-medium">{ticket.title}</TableCell>
                <TableCell>
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{ticket.priority}</TableCell>
                <TableCell>{ticket.location}</TableCell>
                <TableCell>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          open={true}
        />
      )}
    </>
  );
}