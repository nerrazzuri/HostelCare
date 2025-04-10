import { useQuery } from "@tanstack/react-query";
import { TicketUpdate, User } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { Clock, DollarSign, Image as ImageIcon, Wrench, Store, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
              
              {/* Cost Information */}
              {update.cost && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
                    <DollarSign className="h-3 w-3" />
                    ${update.cost}
                  </Badge>
                  
                  {update.costType && (
                    <Badge 
                      variant={update.costType === 'repair' ? 'default' : 'secondary'}
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {update.costType === 'repair' ? (
                        <Wrench className="h-3 w-3" />
                      ) : (
                        <Store className="h-3 w-3" />
                      )}
                      {update.costType === 'repair' ? 'Warden Repair' : 'Vendor Service'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Issue Images */}
          {update.images && update.images.length > 0 && (
            <div className="pl-12">
              <p className="text-xs text-muted-foreground mb-2">Issue Images</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {update.images.map((image, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <div className="relative aspect-video cursor-pointer hover:opacity-80 transition-opacity">
                        <img
                          src={image}
                          alt={`Update image ${index + 1}`}
                          className="rounded-md object-cover w-full h-full"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <img
                        src={image}
                        alt={`Update image ${index + 1} (large)`}
                        className="rounded-md w-full h-auto"
                      />
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}
          
          {/* Receipt/Invoice Images */}
          {update.receiptImages && update.receiptImages.length > 0 && (
            <div className="pl-12 mt-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                {update.costType === 'repair' ? 'Receipts' : 'Invoices'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {update.receiptImages.map((image, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <div className="relative aspect-video cursor-pointer hover:opacity-80 transition-opacity">
                        <img
                          src={image}
                          alt={`Receipt image ${index + 1}`}
                          className="rounded-md object-cover w-full h-full"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <img
                        src={image}
                        alt={`Receipt image ${index + 1} (large)`}
                        className="rounded-md w-full h-auto"
                      />
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}
          
          <Separator />
        </div>
      ))}
    </div>
  );
}
