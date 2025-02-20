import { Vendor } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface VendorListProps {
  vendors: Vendor[];
  isLoading: boolean;
}

export function VendorList({ vendors, isLoading }: VendorListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No vendors have been added yet. Click the "Add Vendor" button to create one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Specialization</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell className="font-medium">{vendor.name}</TableCell>
            <TableCell>{vendor.specialization}</TableCell>
            <TableCell>{vendor.contactNumber}</TableCell>
            <TableCell>{vendor.email}</TableCell>
            <TableCell>
              <Badge variant={vendor.isActive ? "default" : "secondary"}>
                {vendor.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
