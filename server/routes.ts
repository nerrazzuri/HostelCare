import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { TicketStatus, TicketPriority, insertTicketSchema, insertTicketUpdateSchema, insertVendorSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ dest: "uploads/" });

function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Tickets
  app.post("/api/tickets", upload.array("images"), async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;

    try {
      // Parse the JSON data from the form
      const formData = JSON.parse(req.body.data);

      // Validate the incoming data against our schema
      const validatedData = insertTicketSchema.parse({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        priority: formData.priority,
        images: files?.map(f => f.path) || null
      });

      // Create the ticket with the validated data
      const ticket = await storage.createTicket({
        ...validatedData,
        status: TicketStatus.OPEN,
        createdBy: req.user?.id || 1, // Use 1 for anonymous submissions
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error('Ticket creation error:', error);
      res.status(400).json({ 
        message: 'Invalid ticket data', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get("/api/tickets", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const tickets = await storage.getTickets(req.user);
    res.json(tickets);
  });

  app.get("/api/tickets/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket) return res.sendStatus(404);
    res.json(ticket);
  });

  app.patch("/api/tickets/:id", requireRole(["admin", "warden"]), async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const updateSchema = z.object({
      status: z.enum(Object.values(TicketStatus) as [string, ...string[]]),
      assignedTo: z.number().optional(),
      vendorId: z.number().optional().nullable(),
    });

    const updates = updateSchema.parse(req.body);
    const ticket = await storage.updateTicket(ticketId, updates);
    res.json(ticket);
  });

  app.post("/api/tickets/:id/updates", upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'receiptImages', maxCount: 5 }
  ]), async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticketId = parseInt(req.params.id);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    try {
      const updateData = insertTicketUpdateSchema.parse({
        ...req.body,
        ticketId,
        images: files?.images?.map(f => f.path) || [],
        receiptImages: files?.receiptImages?.map(f => f.path) || [],
        createdBy: req.user.id,
        comment: req.body.comment || '', // Provide default empty string if comment is missing
        cost: req.body.cost || null,
        costType: req.body.costType || null
      });

      const update = await storage.createTicketUpdate(updateData);
      res.status(201).json(update);
    } catch (error) {
      console.error('Ticket update validation error:', error);
      res.status(400).json({ message: 'Invalid ticket update data', error });
    }
  });
  
  // Get ticket updates for a specific ticket
  app.get("/api/tickets/:id/updates", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const ticketId = parseInt(req.params.id);
    const updates = await storage.getTicketUpdates(ticketId);
    
    // Fetch user information for each update
    const updatesWithUserInfo = await Promise.all(
      updates.map(async (update) => {
        const user = await storage.getUser(update.createdBy);
        return { ...update, user };
      })
    );
    
    res.json(updatesWithUserInfo);
  });
  
  // Get all ticket updates for analytics
  app.get("/api/ticket-updates", requireRole(["admin"]), async (req, res) => {
    const updates = await storage.getAllTicketUpdates();
    res.json(updates);
  });

  // Vendors
  app.get("/api/vendors", requireRole(["admin", "warden"]), async (req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.post("/api/vendors", requireRole(["admin"]), async (req, res) => {
    const vendorData = insertVendorSchema.parse(req.body);
    const vendor = await storage.createVendor(vendorData);
    res.status(201).json(vendor);
  });

  app.patch("/api/vendors/:id", requireRole(["admin"]), async (req, res) => {
    const vendorId = parseInt(req.params.id);
    const updateSchema = insertVendorSchema.partial();
    const updates = updateSchema.parse(req.body);
    const vendor = await storage.updateVendor(vendorId, updates);
    res.json(vendor);
  });

  // Add endpoint to get wardens for admin
  app.get("/api/users/wardens", requireRole(["admin"]), async (req, res) => {
    const wardens = await storage.getWardens();
    res.json(wardens);
  });

  const httpServer = createServer(app);
  return httpServer;
}