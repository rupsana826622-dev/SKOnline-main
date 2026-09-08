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

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tenant_code: string;
  tenant_id?: string;
}

export interface BobSettings {
  cspName: string;
  cspCode: string;
  branchName: string;
  branchCode: string;
  ifscCode: string;
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
  branchName: "Bank of Baroda CSP Branch",
  branchCode: "BARB0CSP001",
  ifscCode: "BARB0XXXXXX",
  operatorName: "CSP Operator",
  operatorContact: "9876543210",
  refPrefix: "BOB-2026-",
  accountPrefix: "",
  logoUrl: "",
  stampSignatureUrl: "",
};
