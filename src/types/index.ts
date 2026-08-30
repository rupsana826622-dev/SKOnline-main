export interface Customer {
  id: string;
  // Account Identification
  branchCode: string;
  ifscCode?: string;
  customerId: string; // CIF
  accountNumber: string;
  refNumber: string;
  accountOpeningDate?: string; // DD/MM/YYYY
  // Personal
  name: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  sex: "Male" | "Female" | "Other";
  age: number;
  dob: string; // DD-MM-YYYY
  profession: string;
  category: "OBC" | "BC" | "SC" | "ST" | "Gen";
  // Address
  address: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  // Financial & KYC
  annualIncome: string;
  annualIncomeTier: string;
  panGir: string;
  aadhaarNumber?: string;
  mobile: string;
  email: string;
  // Nomination
  sbAccountNo: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineeAge: string;
  nomineeDob: string;
  guardianName: string;
  // Introducer
  introducerName: string;
  introducerAccountNo: string;
  introducerBranch: string;
  introducerYears: string;
  // CPS (Customer Profile Sheet)
  solId: string;
  zone: string;
  educationLevel: string;
  occupationType: string;
  politicallyProminent: "Yes" | "No";
  turnoverType: "Actual" | "Estimated";
  turnoverAmount: string;
  riskCategory: "Low" | "Medium" | "High";
  // Scheme Enrollments
  enrollPMJJBY: boolean;
  pmjjbyPremiumTier: string;
  pmjjbyDisability: "Yes" | "No";
  pmjjbyDisabilityDetails: string;
  pmjjbyKycType: string;
  pmjjbyKycId: string;
  pmjjbyNomineeName: string;
  pmjjbyNomineeRelationship: string;
  pmjjbyNomineeDob: string;
  pmjjbyNomineeAge: string;
  pmjjbyGuardianName: string;
  pmjjbyGuardianAddress: string;
  pmjjbyGuardianRelationship: string;
  pmjjbyGuardianMobile: string;
  pmjjbyAadharConsent: boolean;
  enrollPMSBY: boolean;
  pmsbyDisability: "Yes" | "No";
  pmsbyDisabilityDetails: string;
  pmsbyKycType: string;
  pmsbyKycId: string;
  pmsbyNomineeName: string;
  pmsbyNomineeRelationship: string;
  pmsbyNomineeDob: string;
  pmsbyNomineeAge: string;
  pmsbyGuardianName: string;
  pmsbyGuardianAddress: string;
  pmsbyGuardianRelationship: string;
  pmsbyGuardianMobile: string;
  pmsbyAadharConsent: boolean;
  enrollAPY: boolean;
  apyMaritalStatus: "Single" | "Married" | "Widowed" | "Divorced";
  apySpouseName: string;
  apySpouseDob: string;
  apySpouseAadhar: string;
  apyPensionSlab: string;
  apyContributionFreq: "Monthly" | "Quarterly" | "Half-Yearly";
  apyTaxPayer: "Yes" | "No";
  apySocialSecurity: "Yes" | "No";
  apyNomineeName: string;
  apyNomineeRelationship: string;
  apyNomineeDob: string;
  apyNomineeAge: string;
  apyNomineeAadhar: string;
  apyGuardianName: string;
  apyGuardianMobile: string;
  apyGuardianRelationship: string;
  apyAutodebitConsent: boolean;
  // Delivery
  passbookIssued: boolean;
  passbookIssuedAt: string;
  passbookReceived: boolean;
  passbookReceivedAt: string;
  atmIssued: boolean;
  atmIssuedAt: string;
  atmReceived: boolean;
  atmReceivedAt: string;
  // Meta
  createdAt: string;
  familyId?: string;
}

export interface AppSettings {
  // Bank
  bankName: string;
  branchCode: string;
  ifscCode: string;
  solId: string;
  zone: string;
  // CSP
  cspName: string;
  cspCode: string;
  cspBranchName: string;
  operatorName: string;
  operatorContact: string;
  // Introducer
  introducerName?: string;
  introducerAccountNo?: string;
  // Prefixes
  accountPrefix: string;
  refPrefix: string;
  // WhatsApp
  waGatewayUrl: string;
  waToken: string;
  waPhoneNumberId: string;
  // Form Header Logos
  fiLogo?: string;
  cpsLogo?: string;
  ckycLogo?: string;
  consentLogo?: string;
  apyLogo?: string;
  pmjjbyLogos?: {
    left: string;
    center: string;
    right: string;
  };
  pmsbyLogos?: {
    left: string;
    center: string;
    right: string;
  };
}

export interface WhatsAppMessage {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  message: string;
  status: "Sent" | "Delivered" | "Failed" | "Pending";
  sentAt: string;
  template: string;
}

export interface WaTemplate {
  id: string;
  name: string;
  body: string;
  category: "Welcome" | "Birthday" | "Reminder" | "Custom";
}

export type NavItem = {
  label: string;
  path: string;
  icon: string;
  badge?: number;
};
