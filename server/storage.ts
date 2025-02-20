import { IStorage } from "./types";
import { User, Ticket, TicketUpdate, InsertUser, UserRole } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private ticketUpdates: Map<number, TicketUpdate[]>;
  private currentUserId: number;
  private currentTicketId: number;
  private currentUpdateId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.ticketUpdates = new Map();
    this.currentUserId = 1;
    this.currentTicketId = 1;
    this.currentUpdateId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTickets(user: User): Promise<Ticket[]> {
    const tickets = Array.from(this.tickets.values());
    
    switch (user.role) {
      case UserRole.TENANT:
        return tickets.filter(t => t.createdBy === user.id);
      case UserRole.WARDEN:
        return tickets.filter(t => t.assignedTo === user.id);
      case UserRole.ADMIN:
        return tickets;
      default:
        return [];
    }
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    const id = this.currentTicketId++;
    const ticket: Ticket = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "open",
    } as Ticket;
    
    this.tickets.set(id, ticket);
    this.ticketUpdates.set(id, []);
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.tickets.get(id);
    if (!ticket) throw new Error("Ticket not found");

    const updatedTicket = {
      ...ticket,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async createTicketUpdate(data: Partial<TicketUpdate>): Promise<TicketUpdate> {
    const id = this.currentUpdateId++;
    const update: TicketUpdate = {
      ...data,
      id,
      createdAt: new Date(),
    } as TicketUpdate;

    const updates = this.ticketUpdates.get(update.ticketId) || [];
    updates.push(update);
    this.ticketUpdates.set(update.ticketId, updates);
    
    return update;
  }

  async getTicketUpdates(ticketId: number): Promise<TicketUpdate[]> {
    return this.ticketUpdates.get(ticketId) || [];
  }
}

export const storage = new MemStorage();
