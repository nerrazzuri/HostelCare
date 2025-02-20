import { IStorage } from "./types";
import { User, Ticket, TicketUpdate, InsertUser, Vendor, InsertVendor, users, tickets, ticketUpdates, vendors } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getWardens(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, 'warden'));
  }

  async getVendors(): Promise<Vendor[]> {
    return db.select().from(vendors);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async getTickets(user: User): Promise<Ticket[]> {
    switch (user.role) {
      case 'tenant':
        return db.select().from(tickets).where(eq(tickets.createdBy, user.id));
      case 'warden':
        return db.select().from(tickets).where(eq(tickets.assignedTo, user.id));
      case 'admin':
        return db.select().from(tickets);
      default:
        return [];
    }
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(data).returning();
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async createTicketUpdate(data: Partial<TicketUpdate>): Promise<TicketUpdate> {
    const [update] = await db.insert(ticketUpdates).values(data).returning();
    return update;
  }

  async getTicketUpdates(ticketId: number): Promise<TicketUpdate[]> {
    return db.select().from(ticketUpdates).where(eq(ticketUpdates.ticketId, ticketId));
  }
}

export const storage = new DatabaseStorage();