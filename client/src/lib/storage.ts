// Session and storage utilities for cart persistence

export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string;
}

export interface OrderSession {
  customerName: string;
  customerId?: number;
  cart: CartItem[];
  orderId?: number;
  totalAmount?: number;
  createdAt: number;
  lastUpdated: number;
}

const STORAGE_KEY = "quetta_hotel_session";
const CART_KEY = "quetta_hotel_cart";

export const StorageService = {
  // Save cart to localStorage
  saveCart: (cart: CartItem[]) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart", err);
    }
  },

  // Load cart from localStorage
  loadCart: (): CartItem[] => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error("Failed to load cart", err);
      return [];
    }
  },

  // Clear cart
  clearCart: () => {
    try {
      localStorage.removeItem(CART_KEY);
    } catch (err) {
      console.error("Failed to clear cart", err);
    }
  },

  // Save order session
  saveOrderSession: (session: OrderSession) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.error("Failed to save session", err);
    }
  },

  // Load order session
  loadOrderSession: (): OrderSession | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error("Failed to load session", err);
      return null;
    }
  },

  // Clear session
  clearOrderSession: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear session", err);
    }
  },

  // Check if session is still valid (not older than 24 hours)
  isSessionValid: (session: OrderSession | null): boolean => {
    if (!session) return false;
    const now = Date.now();
    const sessionAge = now - session.createdAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return sessionAge < maxAge;
  },

  // Get session customer name
  getCustomerName: (): string | null => {
    const session = StorageService.loadOrderSession();
    return session?.customerName || null;
  },

  // Update last accessed time
  updateSessionTime: () => {
    const session = StorageService.loadOrderSession();
    if (session) {
      session.lastUpdated = Date.now();
      StorageService.saveOrderSession(session);
    }
  }
};

// Service Worker registration for offline support and WiFi auto-open
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered");
    } catch (err) {
      console.error("Service Worker registration failed", err);
    }
  }
};

// Listen for online/offline events
export const setupConnectivityListener = (onOnline: () => void, onOffline: () => void) => {
  window.addEventListener("online", () => {
    console.log("Online");
    onOnline();
  });

  window.addEventListener("offline", () => {
    console.log("Offline");
    onOffline();
  });
};
