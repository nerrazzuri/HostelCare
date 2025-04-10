import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Clock, Download, Target, Wrench, Store } from "lucide-react";
import { useLocation } from "wouter";
import { Ticket, TicketStatus, TicketPriority, TicketUpdate } from "@shared/schema";

export default function AnalyticsDashboard() {
  const [, setLocation] = useLocation();

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  // Calculate overview metrics
  const totalTickets = tickets.length;
  const ticketsByStatus = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resolvedTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED);
  const avgResolutionTime = resolvedTickets.length > 0
    ? resolvedTickets.reduce((acc, ticket) => {
        const created = new Date(ticket.createdAt).getTime();
        const updated = new Date(ticket.updatedAt).getTime();
        return acc + (updated - created);
      }, 0) / resolvedTickets.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0;

  // Calculate location statistics
  const locationStats = tickets.reduce((acc, ticket) => {
    acc[ticket.location] = (acc[ticket.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLocations = Object.entries(locationStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate priority statistics
  const priorityStats = tickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate SLA metrics
  const slaTarget = 3; // 3 days target resolution time
  const slaCompliance = resolvedTickets.length > 0
    ? (resolvedTickets.filter(ticket => {
        const resolutionTime = new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime();
        return resolutionTime <= slaTarget * 24 * 60 * 60 * 1000;
      }).length / resolvedTickets.length) * 100
    : 0;

  // Export data function
  const exportData = () => {
    const data = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      location: ticket.location,
      created: new Date(ticket.createdAt).toLocaleDateString(),
      resolved: ticket.status === TicketStatus.RESOLVED
        ? new Date(ticket.updatedAt).toLocaleDateString()
        : 'N/A',
      resolutionTime: ticket.status === TicketStatus.RESOLVED
        ? `${((new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)} days`
        : 'N/A'
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'maintenance_tickets.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Calculate cost metrics
  const ticketUpdates = useQuery<TicketUpdate[]>({
    queryKey: ["/api/ticket-updates"],
  });

  const updates = ticketUpdates.data || [];

  const costAnalysis = updates.reduce<{ total: number; repair: number; vendor: number }>((acc, update) => {
    if (update.cost) {
      const cost = parseFloat(update.cost);
      if (!isNaN(cost)) {
        acc.total += cost;
        if (update.costType === 'repair') {
          acc.repair += cost;
        } else if (update.costType === 'vendor') {
          acc.vendor += cost;
        }
      }
    }
    return acc;
  }, { total: 0, repair: 0, vendor: 0 });

  // Monthly cost trends
  const monthlyTrends = updates.reduce<Record<string, { repair: number; vendor: number }>>((acc, update) => {
    if (update.cost) {
      const cost = parseFloat(update.cost);
      if (!isNaN(cost) && update.costType) {
        const month = new Date(update.createdAt).toLocaleString('default', { month: 'long' });
        if (!acc[month]) {
          acc[month] = { repair: 0, vendor: 0 };
        }
        // Only add cost to valid cost types (repair or vendor)
        if (update.costType === 'repair' || update.costType === 'vendor') {
          acc[month][update.costType] += cost;
        }
      }
    }
    return acc;
  }, {});

  if (isLoading || ticketUpdates.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[95%] mx-auto px-2 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="justify-start sm:justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={exportData}
              className="justify-start sm:justify-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-2 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of maintenance ticket statistics and performance metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketsByStatus[TicketStatus.OPEN] || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgResolutionTime.toFixed(1)} days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {slaCompliance.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: {slaTarget} days
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${costAnalysis.total.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repair Costs</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${costAnalysis.repair.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((costAnalysis.repair / costAnalysis.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendor Costs</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${costAnalysis.vendor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((costAnalysis.vendor / costAnalysis.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="status" className="mt-6">
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="status">Status Distribution</TabsTrigger>
            <TabsTrigger value="location">Location Analysis</TabsTrigger>
            <TabsTrigger value="priority">Priority Distribution</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(ticketsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                      <div className="flex items-center">
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground ml-2">
                          ({((count / totalTickets) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topLocations.map(([location, count]) => (
                    <div key={location} className="flex items-center justify-between">
                      <span>{location}</span>
                      <div className="flex items-center">
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground ml-2">
                          ({((count / totalTickets) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="priority" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(priorityStats).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="capitalize">{priority}</span>
                      <div className="flex items-center">
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground ml-2">
                          ({((count / totalTickets) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(monthlyTrends).map(([month, costs]) => (
                    <div key={month}>
                      <h3 className="font-medium mb-2">{month}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Repair Costs:</span>
                          <span className="font-medium">${costs.repair.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Vendor Costs:</span>
                          <span className="font-medium">${costs.vendor.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2">
                          <span>Total:</span>
                          <span className="font-medium">
                            ${(costs.repair + costs.vendor).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}