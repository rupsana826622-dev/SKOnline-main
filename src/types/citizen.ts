export interface CitizenDocumentAttachment {
  name: string;
  url: string;
  size_kb: number;
  uploaded_at: string;
  path?: string;
}

export interface CitizenServiceRecord {
  id: string;
  serialNo: number; // Numeric serial for physical register mapping
  customerName: string;
  contactNo: string;
  address: string;
  serviceType: string;
  applicationDate: string; // YYYY-MM-DD or DD/MM/YYYY
  appNumber: string; // User ID / Application No / Acknowledgement No
  portalPassword?: string; // Passkey/DOB text input — strictly excluded from customer printouts
  finalServiceNo?: string; // Generated Service / Document No (e.g., PAN Number, Passport Number)
  documentFileUrl?: string; // Supabase Storage public URL for attached PDF/document (primary or latest)
  documentFiles?: CitizenDocumentAttachment[]; // Multi-file attachments array
  document_files?: CitizenDocumentAttachment[];
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  paymentMode: "Cash" | "UPI";
  paymentStatus: "Full Paid" | "Partial" | "Pending";
  status: "Applied" | "Processing" | "Issued" | "Delivered" | "Rejected";
  issuedDate?: string | null;
  deliveredDate?: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tenant_code?: string;
  tenant_id?: string;
}

export interface CitizenSettings {
  serviceTypes: string[];
  stampSignatureUrl: string;
  promotionalText: string;
  centerName: string;
  centerContact: string;
  centerAddress: string;
  tagline?: string;
}

export const DEFAULT_CITIZEN_SERVICES: string[] = [
  "PAN Card",
  "Passport",
  "Voter Card",
  "Ration Card",
  "Trade License",
  "Food License",
  "Train Ticket",
  "Flight Ticket",
];

export const DEFAULT_CITIZEN_SETTINGS: CitizenSettings = {
  serviceTypes: DEFAULT_CITIZEN_SERVICES,
  stampSignatureUrl: "",
  promotionalText:
    "SK ONLINE & CYBER ZONE: All online services, ITR/GST Tax Filing, Trade License, Bank CSP, and LIC Insurance done here.",
  centerName: "SK ONLINE & CYBER ZONE",
  centerContact: "9876543210",
  centerAddress: "Main Market Road, Cyber Zone",
  tagline: "Digital Citizen Services & Customer Care",
};
