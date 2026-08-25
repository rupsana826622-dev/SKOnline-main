import type { Customer, AppSettings, WhatsAppMessage } from "@/types";
import { DEFAULT_SETTINGS } from "@/constants";

const KEYS = {
  customers: "sk_online_customers",
  settings: "sk_online_settings",
  waMessages: "sk_online_wa_messages",
  auth: "sk_online_auth",
};

// ─── AUTH ────────────────────────────────────────────────
export function getSession(): { username: string } | null {
  try {
    const raw = localStorage.getItem(KEYS.auth);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(username: string): void {
  localStorage.setItem(KEYS.auth, JSON.stringify({ username }));
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.auth);
}

// ─── SETTINGS ────────────────────────────────────────────
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

// ─── CUSTOMERS ───────────────────────────────────────────
export function getCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(KEYS.customers);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(KEYS.customers, JSON.stringify(customers));
}

export function addCustomer(customer: Customer): void {
  const customers = getCustomers();
  customers.unshift(customer);
  saveCustomers(customers);
}

export function updateCustomer(id: string, updates: Partial<Customer>): void {
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx !== -1) {
    customers[idx] = { ...customers[idx], ...updates };
    saveCustomers(customers);
  }
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter(c => c.id !== id);
  saveCustomers(customers);
}

// ─── WHATSAPP MESSAGES ───────────────────────────────────
export function getWaMessages(): WhatsAppMessage[] {
  try {
    const raw = localStorage.getItem(KEYS.waMessages);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addWaMessage(msg: WhatsAppMessage): void {
  const messages = getWaMessages();
  messages.unshift(msg);
  localStorage.setItem(KEYS.waMessages, JSON.stringify(messages));
}
