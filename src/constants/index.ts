export const APP_NAME = "SK ONLINE";
export const APP_TAGLINE = "CSP Banking Management Portal";
export const POWERED_BY = "Powered by Digital Solution";

export const DEFAULT_BOI_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80"><rect width="320" height="80" fill="%23ffffff"/><polygon points="40,8 48,32 72,32 52,46 60,70 40,54 20,70 28,46 8,32 32,32" fill="%23d97706"/><text x="85" y="36" font-family="sans-serif" font-weight="900" font-size="20" fill="%231e293b">बैंक ऑफ़ इंडिया</text><text x="85" y="60" font-family="sans-serif" font-weight="800" font-size="22" fill="%231e3a8a">Bank of India</text></svg>`;

export const DEFAULT_PMJJBY_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80"><rect width="280" height="80" fill="%23ffffff"/><circle cx="40" cy="40" r="28" fill="%23f59e0b"/><path d="M40 18 L46 34 L62 34 L49 44 L54 60 L40 50 L26 60 L31 44 L18 34 L34 34 Z" fill="%23ffffff"/><text x="80" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="%23b45309">Pradhan Mantri</text><text x="80" y="50" font-family="sans-serif" font-weight="800" font-size="14" fill="%23d97706">Jeevan Jyoti Bima Yojana</text></svg>`;

export const DEFAULT_PMSBY_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80"><rect width="280" height="80" fill="%23ffffff"/><path d="M40 15 L65 25 L65 48 C65 62 40 72 40 72 C40 72 15 62 15 48 L15 25 Z" fill="%232563eb"/><text x="40" y="48" font-family="sans-serif" font-weight="900" font-size="18" fill="%23ffffff" text-anchor="middle">PMSBY</text><text x="80" y="32" font-family="sans-serif" font-weight="800" font-size="13" fill="%231d4ed8">Pradhan Mantri</text><text x="80" y="50" font-family="sans-serif" font-weight="800" font-size="13" fill="%231e40af">Suraksha Bima Yojana</text></svg>`;

export const DEFAULT_STAR_UNION_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><rect width="240" height="80" fill="%23ffffff"/><circle cx="35" cy="40" r="24" fill="%230284c7"/><text x="35" y="46" font-family="sans-serif" font-weight="900" font-size="20" fill="%23ffffff" text-anchor="middle">SUD</text><text x="70" y="36" font-family="sans-serif" font-weight="700" font-size="13" fill="%230f172a">Star Union Dai-ichi</text><text x="70" y="52" font-family="sans-serif" font-weight="500" font-size="11" fill="%23475569">Life Insurance</text></svg>`;

export const DEFAULT_NEW_INDIA_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 80"><rect width="260" height="80" fill="%23ffffff"/><circle cx="35" cy="40" r="24" stroke="%231e3a8a" stroke-width="4" fill="none"/><path d="M35 22 L45 55 L25 55 Z" fill="%231e3a8a"/><text x="70" y="36" font-family="sans-serif" font-weight="800" font-size="12" fill="%231e3a8a">The New India Assurance Co. Ltd.</text><text x="70" y="52" font-family="sans-serif" font-weight="600" font-size="10" fill="%2364748b">India's Premier Multinational GI Co.</text></svg>`;

export const DEFAULT_PFRDA_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 80"><rect width="260" height="80" fill="%23ffffff"/><rect x="10" y="15" width="50" height="50" rx="8" fill="%23047857"/><text x="35" y="46" font-family="sans-serif" font-weight="900" font-size="16" fill="%23ffffff" text-anchor="middle">pfrda</text><text x="70" y="34" font-family="sans-serif" font-weight="800" font-size="14" fill="%23065f46">PFRDA / APY</text><text x="70" y="50" font-family="sans-serif" font-weight="500" font-size="10" fill="%23047857">Pension Fund Regulatory Authority</text></svg>`;

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
  introducerName: "",
  introducerAccountNo: "",
  accountPrefix: "190010",
  refPrefix: "REF-2026-",
  waGatewayUrl: "https://graph.facebook.com/v17.0",
  waToken: "",
  waPhoneNumberId: "",
  fiLogo: DEFAULT_BOI_LOGO,
  cpsLogo: DEFAULT_BOI_LOGO,
  ckycLogo: DEFAULT_BOI_LOGO,
  consentLogo: DEFAULT_BOI_LOGO,
  apyLogo: DEFAULT_PFRDA_LOGO,
  pmjjbyLogos: {
    left: DEFAULT_STAR_UNION_LOGO,
    center: DEFAULT_PMJJBY_LOGO,
    right: DEFAULT_BOI_LOGO,
  },
  pmsbyLogos: {
    left: DEFAULT_NEW_INDIA_LOGO,
    center: DEFAULT_PMSBY_LOGO,
    right: DEFAULT_BOI_LOGO,
  },
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

export const NOMINEE_RELATIONSHIPS = [
  "Mother",
  "Father",
  "Spouse (Husband / Wife)",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandmother",
  "Grandfather",
  "Other (Relative / Legal Guardian)",
] as const;
