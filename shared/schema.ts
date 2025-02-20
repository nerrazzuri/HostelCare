import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = {
  TENANT: 'tenant',
  WARDEN: 'warden',
  ADMIN: 'admin'
} as const;

export const TicketStatus = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  NEEDS_VENDOR: 'needs_vendor',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved'
} as const;

export const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: Object.values(UserRole) }).notNull(),
  hostelBlock: text("hostel_block"),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: Object.values(TicketStatus) }).notNull().default(TicketStatus.OPEN),
  priority: text("priority", { enum: Object.values(TicketPriority) }).notNull(),
  images: text("images").array(),
  createdBy: integer("created_by").notNull(),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketUpdates = pgTable("ticket_updates", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  comment: text("comment").notNull(),
  images: text("images").array(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  hostelBlock: true,
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  title: true,
  description: true,
  location: true,
  priority: true,
  images: true,
});

export const insertTicketUpdateSchema = createInsertSchema(ticketUpdates).pick({
  ticketId: true,
  comment: true,
  images: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketUpdate = typeof ticketUpdates.$inferSelect;
