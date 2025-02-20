import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { TicketStatus, insertTicketSchema, insertTicketUpdateSchema } from "@shared/schema";
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
    if (!req.user) return res.sendStatus(401);

    const files = req.files as Express.Multer.File[] | undefined;

    const ticketData = insertTicketSchema.parse({
      ...req.body,
      images: files?.map(f => f.path) || [],
      createdBy: req.user.id
    });

    const ticket = await storage.createTicket(ticketData);
    res.status(201).json(ticket);
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
      status: z.enum(["open", "assigned", "in_progress", "needs_vendor", "escalated", "resolved"] as const),
      assignedTo: z.number().optional(),
    });

    const updates = updateSchema.parse(req.body);
    const ticket = await storage.updateTicket(ticketId, updates);
    res.json(ticket);
  });

  app.post("/api/tickets/:id/updates", upload.array("images"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticketId = parseInt(req.params.id);
    const files = req.files as Express.Multer.File[] | undefined;

    const updateData = insertTicketUpdateSchema.parse({
      ...req.body,
      ticketId,
      images: files?.map(f => f.path) || [],
      createdBy: req.user.id
    });

    const update = await storage.createTicketUpdate(updateData);
    res.status(201).json(update);
  });

  // Add endpoint to get wardens for admin
  app.get("/api/users/wardens", requireRole(["admin"]), async (req, res) => {
    const wardens = await storage.getWardens();
    res.json(wardens);
  });

  const httpServer = createServer(app);
  return httpServer;
}