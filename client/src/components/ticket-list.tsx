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
  open: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  assigned: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  needs_vendor: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  escalated: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  resolved: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
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
    return <div className="flex justify-center py-8">
      <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>;
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

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow 
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTicket(ticket)}
              >
                <TableCell className="font-medium">#{ticket.id}</TableCell>
                <TableCell className="max-w-md">
                  <div className="font-medium">{ticket.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {ticket.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="capitalize">{ticket.priority}</span>
                </TableCell>
                <TableCell>{ticket.location}</TableCell>
                <TableCell className="text-muted-foreground">
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