import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketSchema, TicketPriority } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from 'react';
import { AlertCircle } from "lucide-react";

interface TicketFormProps {
  initialLocation?: string;
}

export function TicketForm({ initialLocation }: TicketFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      priority: TicketPriority.MEDIUM,
      images: [],
    },
  });

  useEffect(() => {
    if (initialLocation) {
      form.setValue('location', initialLocation);
    }
  }, [initialLocation, form]);

  const createTicketMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/tickets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      setLocation("/tenant");
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
    if (!data.location) {
      toast({
        title: "Location Required",
        description: "Please scan a QR code to set the location",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      if (key === "images") {
        Array.from(value).forEach((file: File) => {
          formData.append("images", file);
        });
      } else {
        formData.append(key, value);
      }
    });
    createTicketMutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issue Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Broken Light Bulb" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe the issue in detail..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    {...field} 
                    readOnly 
                    disabled
                    className="bg-muted"
                    placeholder="Scan QR code to set location"
                  />
                  {!field.value && (
                    <AlertCircle className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </FormControl>
              {!field.value && (
                <p className="text-sm text-muted-foreground">
                  Scan a QR code to set the location
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
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
          disabled={createTicketMutation.isPending}
        >
          Submit Ticket
        </Button>
      </form>
    </Form>
  );
}