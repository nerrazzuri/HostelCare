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
  IN_PROGRESS: 'in_progress',
  NEEDS_VENDOR: 'needs_vendor',
  VENDOR_ASSIGNED: 'vendor_assigned',
  PENDING_APPROVAL: 'pending_approval',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
  ESCALATED: 'escalated'  // Added this status
} as const;

export const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

type UserRoleType = typeof UserRole[keyof typeof UserRole];
type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];
type TicketPriorityType = typeof TicketPriority[keyof typeof TicketPriority];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<UserRoleType>(),
  hostelBlock: text("hostel_block"),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  status: text("status").$type<TicketStatusType>().notNull().default(TicketStatus.OPEN),
  priority: text("priority").$type<TicketPriorityType>().notNull(),
  images: text("images").array(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  vendorId: integer("vendor_id").references(() => vendors.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketUpdates = pgTable("ticket_updates", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  comment: text("comment").notNull(),
  images: text("images").array(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  hostelBlock: true,
});

export const insertVendorSchema = createInsertSchema(vendors).pick({
  name: true,
  specialization: true,
  contactNumber: true,
  email: true,
  isActive: true,
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  title: true,
  description: true,
  location: true,
  priority: true,
  images: true,
}).extend({
  priority: z.enum([
    TicketPriority.LOW,
    TicketPriority.MEDIUM,
    TicketPriority.HIGH,
    TicketPriority.URGENT
  ]),
  images: z.array(z.string()).nullable(),
});

export const insertTicketUpdateSchema = createInsertSchema(ticketUpdates).pick({
  ticketId: true,
  comment: true,
  images: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type User = typeof users.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketUpdate = typeof ticketUpdates.$inferSelect;