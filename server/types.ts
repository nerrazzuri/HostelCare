import { User, Ticket, TicketUpdate, InsertUser, Vendor, InsertVendor } from "@shared/schema";
import session from "express-session";

export interface IStorage {
  sessionStore: session.Store;

  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getWardens(): Promise<User[]>;

  getVendors(): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(insertVendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor>;

  getTickets(user: User): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(data: Partial<Ticket>): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket>;

  getTicketUpdates(ticketId: number): Promise<TicketUpdate[]>;
  getAllTicketUpdates(): Promise<TicketUpdate[]>;
  createTicketUpdate(data: Partial<TicketUpdate>): Promise<TicketUpdate>;
}