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
  reference_no?: string;
  reference_number?: string;
  cifNo: string;
  cif_no?: string;
  cif_number?: string;
  accountNo: string;
  account_no?: string;
  account_number?: string;
  sbNo?: string;
  sb_no?: string;
  sb_number?: string;
  hbNo?: string;
  hb_no?: string;
  svNo?: string;
  sv_no?: string;

  // Social Security Schemes (SSS)
  enrollAPY: boolean;
  enrollPMSBY: boolean;
  enrollPMJJBY: boolean;

  // Delivery Tracking Milestones
  passbookIssued: boolean;
  passbookIssuedAt?: string | null;
  passbookDelivered: boolean;
  passbookDeliveredAt?: string | null;

  atmIssued: boolean;
  atmIssuedAt?: string | null;
  atmDelivered: boolean;
  atmDeliveredAt?: string | null;

  formSubmitted?: boolean;
  formSubmittedAt?: string | null;

  // Direct database date column mapping
  passbook_issued?: string | boolean | null;
  passbook_issued_date?: string | null;
  passbook_delivered?: string | boolean | null;
  passbook_delivered_date?: string | null;
  atm_issued?: string | boolean | null;
  atm_issued_date?: string | null;
  atm_delivered?: string | boolean | null;
  atm_delivered_date?: string | null;
  form_submitted?: string | boolean | null;
  form_submitted_date?: string | null;

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
  default_ref_prefix?: string;
  accountPrefix: string;
  default_account_prefix?: string;
  cifPrefix?: string;
  default_cif_prefix?: string;
  sbPrefix?: string;
  default_sb_prefix?: string;
  hbPrefix?: string;
  svPrefix?: string;
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
  default_ref_prefix: "BOB-2026-",
  accountPrefix: "",
  default_account_prefix: "",
  cifPrefix: "",
  default_cif_prefix: "",
  sbPrefix: "",
  default_sb_prefix: "",
  hbPrefix: "",
  svPrefix: "",
  logoUrl: "",
  stampSignatureUrl: "",
};
