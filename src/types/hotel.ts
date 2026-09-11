/**
 * Core Domain Types for Smart Quetta Hotel
 * Easy-to-understand TypeScript interfaces for intermediate developers
 */

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "cancelled";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type PaymentMethod = "cash" | "bank" | "pending";

export type KitchenStatus = "pending" | "preparing" | "ready" | "served";

export interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  imageUrl?: string | null;
  departmentId?: number | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  description?: string | null;
  imageUrl?: string | null;
}

export interface OrderItem {
  id: number;
  name?: string;
  nameSnapshot?: string | null;
  quantity: number;
  unitPrice: number;
  status: string;
  kitchenStatus: KitchenStatus;
  servedQty: number;
  remarks?: string | null;
}

export interface PaymentRecord {
  id: number;
  amount: number;
  method: string;
  status: string;
  transactionId?: string | null;
  reference?: string | null;
  receivedAt: string;
}

export interface OrderWithDetails {
  id: number;
  customerName?: string | null;
  customerId?: number | null;
  seatingAreaId?: number | null;
  seatingNo?: string | null;
  peopleCount?: number | null;
  seatingType?: string | null;
  visitId?: number | null;
  orderNo?: string | null;
  subtotal?: number | null;
  discount?: number | null;
  total?: number | null;
  totalAmount?: number | null;
  servedAmount?: number | null;
  paidAmount?: number | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  paymentHistory?: PaymentRecord[];
}

export interface InventoryItem {
  id: number;
  itemName: string;
  quantity: number;
  unit?: string | null;
  minThreshold: number;
  lastUpdated: string;
}

export interface StockItem {
  id: number;
  name: string;
  totalQuantity: number;
  inUse: number;
  broken: number;
  available: number;
  lastUpdated: string;
}

export interface LiveGallaReport {
  todayCash: number;
  todayBank: number;
  todayTotal: number;
  activeOrdersTotal: number;
  payments: PaymentRecord[];
}
