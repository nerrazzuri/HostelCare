import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketUpdateSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface TicketUpdateFormProps {
  ticketId: number;
}

export function TicketUpdateForm({ ticketId }: TicketUpdateFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(insertTicketUpdateSchema),
    defaultValues: {
      ticketId,
      comment: "",
      images: [],
      cost: "",
      costType: user?.role === "warden" ? "repair" : "vendor",
      receiptImages: [],
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/updates`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/updates`] });
      form.reset();
      toast({
        title: "Success",
        description: "Update added successfully",
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

  const onSubmit = (data: any) => {
    const formData = new FormData();
    formData.append("ticketId", ticketId.toString());
    formData.append("comment", data.comment);

    if (data.cost) {
      formData.append("cost", data.cost);
      formData.append("costType", data.costType);
    }

    if (data.images) {
      Array.from(data.images).forEach((file: File) => {
        formData.append("images", file);
      });
    }

    if (data.receiptImages) {
      Array.from(data.receiptImages).forEach((file: File) => {
        formData.append("receiptImages", file);
      });
    }

    createUpdateMutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  placeholder="Add an update or comment..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(user?.role === "warden" || user?.role === "admin") && (
          <>
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {user.role === "warden" ? "Repair Cost" : "Vendor Invoice Amount"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptImages"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>
                    {user.role === "warden" ? "Upload Receipt Images" : "Upload Invoice"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => onChange(e.target.files)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="images"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Issue Images</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => onChange(e.target.files)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={createUpdateMutation.isPending}
        >
          Add Update
        </Button>
      </form>
    </Form>
  );
}