import { useQuery } from "@tanstack/react-query";
import { TicketUpdate, User } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Clock, Image as ImageIcon } from "lucide-react";

interface TicketUpdatesProps {
  ticketId: number;
}

export function TicketUpdates({ ticketId }: TicketUpdatesProps) {
  const { data: updates = [], isLoading } = useQuery<(TicketUpdate & { user: User })[]>({
    queryKey: [`/api/tickets/${ticketId}/updates`],
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading updates...</div>;
  }

  if (updates.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No updates yet</div>;
  }

  return (
    <div className="space-y-6">
      {updates.map((update) => (
        <div key={update.id} className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarFallback>{getInitials(update.user.username)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{update.user.username}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {new Date(update.createdAt).toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{update.comment}</p>
            </div>
          </div>
          {update.images && update.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pl-12">
              {update.images.map((image, index) => (
                <div key={index} className="relative aspect-video">
                  <img
                    src={image}
                    alt={`Update image ${index + 1}`}
                    className="rounded-md object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
          <Separator />
        </div>
      ))}
    </div>
  );
}
