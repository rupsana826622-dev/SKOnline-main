import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return dateStr;
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function generateRefNumber(prefix: string): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${ts}${rand}`;
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function parseDob(dob: string): Date | null {
  if (!dob) return null;
  const parts = dob.split(/[-/.]/);
  if (parts.length !== 3) return null;
  let day: number, month: number, year: number;
  if (parts[0].length === 4) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, day);
}

export function calculateAgeFromDob(dob: string): string {
  const birth = parseDob(dob);
  if (!birth || isNaN(birth.getTime())) return "";
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age <= 130 ? String(age) : "";
}

export function getDaysUntilBirthday(dob: string): number {
  const birth = parseDob(dob);
  if (!birth) return 9999;
  const today = new Date();
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function isBirthdayToday(dob: string): boolean {
  return getDaysUntilBirthday(dob) === 0;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = String(row[h] ?? "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function replaceTemplateVars(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(val);
  }
  return result;
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return phone.slice(0, 2) + "****" + phone.slice(-4);
}

/**
 * Strict DOB Date Sanitizer to prevent Postgres out-of-range errors (Code: 22008).
 * Accepts DD/MM/YYYY or YYYY-MM-DD and validates actual calendar validity and year range (1900-2100).
 * Returns safe YYYY-MM-DD or null.
 */
export const sanitizeDob = (inputDob: string | null | undefined): string | null => {
  if (!inputDob) return null;
  const clean = inputDob.trim();
  
  // If entered as DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
      return null; // Invalid calendar date -> save as null
    }
    // Verify valid date via Date object
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return null;
  }

  // If already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const parts = clean.split('-').map(Number);
    if (parts[1] < 1 || parts[1] > 12 || parts[2] < 1 || parts[2] > 31 || parts[0] < 1900 || parts[0] > 2100) {
      return null;
    }
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (d.getFullYear() === parts[0] && d.getMonth() === parts[1] - 1 && d.getDate() === parts[2]) {
      return clean;
    }
    return null;
  }

  return null;
};

/**
 * Masks Application / User ID so that only the last 3 digits are visible and prefix is masked with XXXX.
 * Format: XXXX-{last3Digits}
 */
export const maskUserId = (id: string | null | undefined): string => {
  if (!id) return 'N/A';
  const str = String(id).trim();
  if (str.length <= 3) return str;
  const visible = str.slice(-3);
  return `XXXX-${visible}`;
};

