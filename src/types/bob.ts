export interface BobCustomerRecord {
  id: string;
  slNo: number;
  accountOpeningDate: string;
  customerName: string;
  guardianName: string; // C/O (Father / Husband / Guardian)
  dob: string;
  mobile: string;
  address: string;
  aadhaarNo: string;
  refNo: string;
  cifNo: string;
  accountNo: string;

  // Social Security Schemes (SSS)
  enrollAPY: boolean;
  enrollPMSBY: boolean;
  enrollPMJJBY: boolean;

  // 4-Stage Delivery Tracking
  passbookIssued: boolean;
  passbookIssuedAt?: string | null;
  passbookDelivered: boolean;
  passbookDeliveredAt?: string | null;

  atmIssued: boolean;
  atmIssuedAt?: string | null;
  atmDelivered: boolean;
  atmDeliveredAt?: string | null;

  // Direct database date column mapping
  passbook_issued?: string | boolean | null;
  passbook_issued_date?: string | null;
  passbook_delivered?: string | boolean | null;
  passbook_delivered_date?: string | null;
  atm_issued?: string | boolean | null;
  atm_issued_date?: string | null;
  atm_delivered?: string | boolean | null;
  atm_delivered_date?: string | null;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tenant_code: string;
  tenant_id?: string;
  [key: string]: any;
}

export interface BobSettings {
  cspName: string;
  cspCode: string;
  cspAddress: string; // e.g., "Rampur"
  linkBranch: string; // e.g., "Rajbari"
  branchName: string;
  branchCode: string;
  ifscCode: string; // e.g., "BARB0DBRAMP"
  operatorName: string;
  operatorContact: string;
  refPrefix: string;
  accountPrefix: string;
  logoUrl?: string;
  stampSignatureUrl?: string;
}

export const DEFAULT_BOB_SETTINGS: BobSettings = {
  cspName: "SK FINANCIAL & CSP SERVICES",
  cspCode: "BOB-CSP-1082",
  cspAddress: "Rampur",
  linkBranch: "Rajbari",
  branchName: "Bank of Baroda CSP Branch",
  branchCode: "BARB0CSP001",
  ifscCode: "BARB0DBRAMP",
  operatorName: "CSP Operator",
  operatorContact: "9876543210",
  refPrefix: "BOB-2026-",
  accountPrefix: "",
  logoUrl: "",
  stampSignatureUrl: "",
};
