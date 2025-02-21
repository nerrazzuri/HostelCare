import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { TicketStatus, TicketPriority, insertTicketSchema } from "@shared/schema";
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
      // Validate the incoming data against our schema
      const validatedData = insertTicketSchema.parse({
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        priority: req.body.priority,
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

  app.post("/api/tickets/:id/updates", upload.array("images"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticketId = parseInt(req.params.id);
    const files = req.files as Express.Multer.File[] | undefined;

    try {
      const updateData = insertTicketUpdateSchema.parse({
        ...req.body,
        ticketId,
        images: files?.map(f => f.path) || [],
        createdBy: req.user.id,
        comment: req.body.comment || '' // Provide default empty string if comment is missing
      });

      const update = await storage.createTicketUpdate(updateData);
      res.status(201).json(update);
    } catch (error) {
      console.error('Ticket update validation error:', error);
      res.status(400).json({ message: 'Invalid ticket update data', error });
    }
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