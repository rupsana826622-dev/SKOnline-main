export const APP_NAME = "SK ONLINE";
export const APP_TAGLINE = "CSP Banking Management Portal";
export const POWERED_BY = "Powered by Digital Solutions";

export const DEFAULT_SETTINGS = {
  bankName: "Bank of India",
  branchCode: "002345",
  ifscCode: "BKID0002345",
  solId: "SOL001",
  zone: "South Zone",
  cspName: "SK Financial Services",
  cspCode: "CSP-BOI-0721",
  cspBranchName: "Main Market Branch",
  operatorName: "",
  operatorContact: "",
  accountPrefix: "190010",
  refPrefix: "REF-2026-",
  waGatewayUrl: "https://graph.facebook.com/v17.0",
  waToken: "",
  waPhoneNumberId: "",
};

export const WA_TEMPLATES = [
  {
    id: "tpl_welcome",
    name: "Account Opening Welcome",
    body: "Dear {name}, Welcome to {bank_name}! Your account No. {account_no} has been successfully opened at {csp_name}. Reference: {ref_no}. For support contact us. — Powered by Digital Solutions",
    category: "Welcome",
  },
  {
    id: "tpl_birthday",
    name: "Birthday Greetings",
    body: "Dear {name}, Wishing you a very Happy Birthday! {bank_name} & {csp_name} family wishes you a wonderful day. May this year bring you prosperity and success!",
    category: "Birthday",
  },
  {
    id: "tpl_passbook",
    name: "Passbook Ready",
    body: "Dear {name}, Your Passbook for account {account_no} is ready for collection at {csp_name}. Please visit during working hours with your ID proof.",
    category: "Reminder",
  },
  {
    id: "tpl_atm",
    name: "ATM Card Ready",
    body: "Dear {name}, Your ATM/Debit Card for account {account_no} is ready at {csp_name}. Please collect it during working hours. Reference: {ref_no}.",
    category: "Reminder",
  },
  {
    id: "tpl_custom",
    name: "Custom Message",
    body: "Dear {name}, This is an important message from {bank_name} – {csp_name}. Please contact us at your earliest convenience regarding your account {account_no}.",
    category: "Custom",
  },
];

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

export const MOCK_CREDENTIALS = {
  username: "admin",
  password: "sk@2026",
};

export const CATEGORIES = ["OBC", "BC", "SC", "ST", "Gen"] as const;
export const SEX_OPTIONS = ["Male", "Female", "Other"] as const;

export const EDUCATION_LEVELS = [
  "Illiterate", "Primary (1–5)", "Middle (6–8)", "Secondary (9–10)",
  "Higher Secondary (11–12)", "Graduate", "Post Graduate", "Professional",
];

export const OCCUPATION_TYPES = [
  "Agriculture", "Business / Trade", "Salaried – Govt.", "Salaried – Pvt.",
  "Self-Employed / Professional", "Housewife", "Student", "Retired", "Others",
];

export const ANNUAL_INCOME_TIERS = [
  "< ₹25,000", "₹25,000 – ₹50,000", "₹50,000 – ₹1,00,000",
  "₹1,00,000 – ₹2,00,000", "₹2,00,000 – ₹5,00,000", "> ₹5,00,000",
];

export const PMJJBY_PREMIUM_TIERS = [
  "₹436 (Full Year)", "₹342 (Jun–Mar)", "₹228 (Sep–Mar)", "₹114 (Dec–Mar)",
];

export const APY_PENSION_SLABS = ["₹1,000", "₹2,000", "₹3,000", "₹4,000", "₹5,000"];

export const KYC_DOC_TYPES = [
  "Aadhaar Card", "Voter ID", "PAN Card", "Passport",
  "Driving Licence", "NREGA Job Card", "Bank Passbook",
];
