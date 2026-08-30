import type { Customer, AppSettings, WhatsAppMessage } from "@/types";
import { DEFAULT_SETTINGS } from "@/constants";
import { supabase } from "./supabase";

const KEYS = {
  customers: "sk_online_customers",
  settings: "sk_online_settings",
  waMessages: "sk_online_wa_messages",
  auth: "sk_online_auth",
  inquiries: "customerInquiries",
};

export interface Inquiry {
  id: string;
  name: string;
  mobile: string;
  service: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// ─── SANITIZERS & MAPPERS ─────────────────────────────────

export function sanitizeNullableString(val?: string | null): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return String(val);
}

export function sanitizeTimestamp(val?: string | null, fallbackNow: boolean = false): string | null {
  if (!val || typeof val !== "string" || !val.trim()) {
    return fallbackNow ? new Date().toISOString() : null;
  }
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : (fallbackNow ? new Date().toISOString() : null);
}

function mapCustomerToDb(c: Customer): Record<string, any> {
  return {
    id: c.id,
    created_at: sanitizeTimestamp(c.createdAt, true)!,
    full_name: c.name || "",
    father_name: c.fatherName || "",
    mother_name: c.motherName || "",
    spouse_name: c.spouseName || "",
    address: c.address || "",
    village: c.village || "",
    tehsil: c.mandal || "",
    district: c.district || "",
    state: c.state || "",
    pin_code: c.refNumber || "",
    account_opening_date: sanitizeNullableString(c.accountOpeningDate),
    gender: c.sex || "Male",
    age: String(c.age ?? 0),
    dob: sanitizeNullableString(c.dob),
    profession: c.profession || "",
    category: c.category || "Gen",
    annual_income: c.annualIncome || c.annualIncomeTier || "",
    pan_number: c.panGir || "",
    aadhaar_number: c.pmjjbyKycId || c.pmsbyKycId || c.apyNomineeAadhar || "",
    account_number: c.accountNumber || "",
    customer_id_cif: c.customerId || "",
    ifsc_code: c.ifscCode || "",
    branch_name: c.branchCode || "",
    mobile_number: c.mobile || "",
    email_id: c.email || "",
    nominee_name: c.nomineeName || "",
    nominee_dob: sanitizeNullableString(c.nomineeDob),
    nominee_relation: c.nomineeRelationship || "",
    nominee_age: c.nomineeAge || "",
    guardian_details: c.guardianName || "",
    guardian_relation: c.pmjjbyGuardianRelationship || c.pmsbyGuardianRelationship || c.apyGuardianRelationship || "",
    include_pmjjby: !!c.enrollPMJJBY,
    include_pmsby: !!c.enrollPMSBY,
    include_apy: !!c.enrollAPY,
    status: "Active",
    passbook_issued: !!c.passbookIssued,
    passbook_issued_at: sanitizeTimestamp(c.passbookIssuedAt, false),
    passbook_received: !!c.passbookReceived,
    passbook_received_at: sanitizeTimestamp(c.passbookReceivedAt, false),
    atm_issued: !!c.atmIssued,
    atm_issued_at: sanitizeTimestamp(c.atmIssuedAt, false),
    atm_received: !!c.atmReceived,
    atm_received_at: sanitizeTimestamp(c.atmReceivedAt, false)
  };
}

function mapPartialCustomerToDb(c: Partial<Customer>): Record<string, any> {
  const db: Record<string, any> = {};
  if (c.name !== undefined) db.full_name = c.name;
  if (c.fatherName !== undefined) db.father_name = c.fatherName;
  if (c.motherName !== undefined) db.mother_name = c.motherName;
  if (c.spouseName !== undefined) db.spouse_name = c.spouseName;
  if (c.address !== undefined) db.address = c.address;
  if (c.village !== undefined) db.village = c.village;
  if (c.mandal !== undefined) db.tehsil = c.mandal;
  if (c.district !== undefined) db.district = c.district;
  if (c.state !== undefined) db.state = c.state;
  if (c.sex !== undefined) db.gender = c.sex;
  if (c.age !== undefined) db.age = String(c.age);
  if (c.dob !== undefined) db.dob = sanitizeNullableString(c.dob);
  if (c.profession !== undefined) db.profession = c.profession;
  if (c.category !== undefined) db.category = c.category;
  if (c.annualIncome !== undefined) db.annual_income = c.annualIncome;
  if (c.annualIncomeTier !== undefined) db.annual_income = c.annualIncomeTier;
  if (c.panGir !== undefined) db.pan_number = c.panGir;
  if (c.mobile !== undefined) db.mobile_number = c.mobile;
  if (c.email !== undefined) db.email_id = c.email;
  if (c.accountNumber !== undefined) db.account_number = c.accountNumber;
  if (c.customerId !== undefined) db.customer_id_cif = c.customerId;
  if (c.ifscCode !== undefined) db.ifsc_code = c.ifscCode;
  if (c.branchCode !== undefined) db.branch_name = c.branchCode;
  
  if (c.nomineeName !== undefined) db.nominee_name = c.nomineeName;
  if (c.nomineeDob !== undefined) db.nominee_dob = sanitizeNullableString(c.nomineeDob);
  if (c.nomineeRelationship !== undefined) db.nominee_relation = c.nomineeRelationship;
  if (c.nomineeAge !== undefined) db.nominee_age = c.nomineeAge;
  if (c.guardianName !== undefined) db.guardian_details = c.guardianName;
  
  const relation = c.pmjjbyGuardianRelationship || c.pmsbyGuardianRelationship || c.apyGuardianRelationship;
  if (relation !== undefined) db.guardian_relation = relation;
  
  if (c.enrollPMJJBY !== undefined) db.include_pmjjby = c.enrollPMJJBY;
  if (c.enrollPMSBY !== undefined) db.include_pmsby = c.enrollPMSBY;
  if (c.enrollAPY !== undefined) db.include_apy = c.enrollAPY;
  
  const aadhaar = c.pmjjbyKycId || c.pmsbyKycId || c.apyNomineeAadhar;
  if (aadhaar !== undefined) db.aadhaar_number = aadhaar;

  if (c.refNumber !== undefined) db.pin_code = c.refNumber;
  if (c.accountOpeningDate !== undefined) db.account_opening_date = sanitizeNullableString(c.accountOpeningDate);

  if (c.passbookIssued !== undefined) db.passbook_issued = c.passbookIssued;
  if (c.passbookIssuedAt !== undefined) db.passbook_issued_at = sanitizeTimestamp(c.passbookIssuedAt, false);
  if (c.passbookReceived !== undefined) db.passbook_received = c.passbookReceived;
  if (c.passbookReceivedAt !== undefined) db.passbook_received_at = sanitizeTimestamp(c.passbookReceivedAt, false);
  if (c.atmIssued !== undefined) db.atm_issued = c.atmIssued;
  if (c.atmIssuedAt !== undefined) db.atm_issued_at = sanitizeTimestamp(c.atmIssuedAt, false);
  if (c.atmReceived !== undefined) db.atm_received = c.atmReceived;
  if (c.atmReceivedAt !== undefined) db.atm_received_at = sanitizeTimestamp(c.atmReceivedAt, false);
  
  return db;
}


function mapDbToCustomer(row: any): Customer {
  return {
    id: row.id,
    createdAt: row.created_at || new Date().toISOString(),
    refNumber: row.pin_code || "",
    accountOpeningDate: row.account_opening_date || "",
    name: row.full_name || "",
    fatherName: row.father_name || "",
    motherName: row.mother_name || "",
    spouseName: row.spouse_name || "",
    address: row.address || "",
    village: row.village || "",
    mandal: row.tehsil || "",
    district: row.district || "",
    state: row.state || "West Bengal",
    sex: (row.gender as Customer["sex"]) || "Male",
    age: Number(row.age) || 0,
    dob: row.dob || "",
    profession: row.profession || "",
    category: (row.category as Customer["category"]) || "Gen",
    annualIncome: row.annual_income || "",
    annualIncomeTier: row.annual_income || "",
    panGir: row.pan_number || "",
    mobile: row.mobile_number || "",
    email: row.email_id || "",
    accountNumber: row.account_number || "",
    customerId: row.customer_id_cif || "",
    ifscCode: row.ifsc_code || "",
    branchCode: row.branch_name || "",
    
    // Nomination
    sbAccountNo: row.account_number || "",
    nomineeName: row.nominee_name || "",
    nomineeDob: row.nominee_dob || "",
    nomineeRelationship: row.nominee_relation || "",
    nomineeAge: row.nominee_age || "",
    guardianName: row.guardian_details || "",
    
    // Introducer (keep blank or default)
    introducerName: "",
    introducerAccountNo: "",
    introducerBranch: "",
    introducerYears: "",
    
    // CPS
    solId: "",
    zone: "",
    educationLevel: "",
    occupationType: "",
    politicallyProminent: "No",
    turnoverType: "Actual",
    turnoverAmount: "",
    riskCategory: "Low",
    
    // PMJJBY
    enrollPMJJBY: row.include_pmjjby || false,
    pmjjbyPremiumTier: "",
    pmjjbyDisability: "No",
    pmjjbyDisabilityDetails: "",
    pmjjbyKycType: "Aadhaar Card",
    pmjjbyKycId: row.aadhaar_number || "",
    pmjjbyNomineeName: row.nominee_name || "",
    pmjjbyNomineeRelationship: row.nominee_relation || "",
    pmjjbyNomineeDob: row.nominee_dob || "",
    pmjjbyNomineeAge: row.nominee_age || "",
    pmjjbyGuardianName: row.guardian_details || "",
    pmjjbyGuardianAddress: "",
    pmjjbyGuardianRelationship: row.guardian_relation || "",
    pmjjbyGuardianMobile: "",
    pmjjbyAadharConsent: true,
    
    // PMSBY
    enrollPMSBY: row.include_pmsby || false,
    pmsbyDisability: "No",
    pmsbyDisabilityDetails: "",
    pmsbyKycType: "Aadhaar Card",
    pmsbyKycId: row.aadhaar_number || "",
    pmsbyNomineeName: row.nominee_name || "",
    pmsbyNomineeRelationship: row.nominee_relation || "",
    pmsbyNomineeDob: row.nominee_dob || "",
    pmsbyNomineeAge: row.nominee_age || "",
    pmsbyGuardianName: row.guardian_details || "",
    pmsbyGuardianAddress: "",
    pmsbyGuardianRelationship: row.guardian_relation || "",
    pmsbyGuardianMobile: "",
    pmsbyAadharConsent: true,
    
    // APY
    enrollAPY: row.include_apy || false,
    apyMaritalStatus: "Single",
    apySpouseName: "",
    apySpouseDob: "",
    apySpouseAadhar: "",
    apyPensionSlab: "₹1,000",
    apyContributionFreq: "Monthly",
    apyTaxPayer: "No",
    apySocialSecurity: "No",
    apyNomineeName: row.nominee_name || "",
    apyNomineeRelationship: row.nominee_relation || "",
    apyNomineeDob: row.nominee_dob || "",
    apyNomineeAge: row.nominee_age || "",
    apyNomineeAadhar: row.aadhaar_number || "",
    apyGuardianName: row.guardian_details || "",
    apyGuardianMobile: "",
    apyGuardianRelationship: row.guardian_relation || "",
    apyAutodebitConsent: true,
    
    // Delivery
    passbookIssued: row.passbook_issued || false,
    passbookIssuedAt: row.passbook_issued_at || "",
    passbookReceived: row.passbook_received || false,
    passbookReceivedAt: row.passbook_received_at || "",
    atmIssued: row.atm_issued || false,
    atmIssuedAt: row.atm_issued_at || "",
    atmReceived: row.atm_received || false,
    atmReceivedAt: row.atm_received_at || "",
  };
}

function mapSettingsToDb(s: AppSettings): Record<string, any> {
  return {
    id: "global_config",
    bank_name: s.bankName,
    branch_name: s.cspBranchName,
    sol_id: s.solId,
    ifsc_code: s.ifscCode,
    bc_agent_name: s.operatorName || s.cspName || "Alinur Sekh",
    bc_agent_code: s.cspCode,
    bc_agent_mobile: s.operatorContact,
    ckyc_logo_url: s.ckycLogo || null,
    sb_consent_logo_url: s.consentLogo || null,
    custom_logos: {
      fiLogo: s.fiLogo,
      cpsLogo: s.cpsLogo,
      apyLogo: s.apyLogo,
      pmjjbyLogos: s.pmjjbyLogos,
      pmsbyLogos: s.pmsbyLogos,
      accountPrefix: s.accountPrefix,
      refPrefix: s.refPrefix,
      waGatewayUrl: s.waGatewayUrl,
      waToken: s.waToken,
      waPhoneNumberId: s.waPhoneNumberId,
      cspName: s.cspName,
      branchCode: s.branchCode,
      zone: s.zone,
    }
  };
}

function mapDbToSettings(row: any): AppSettings {
  const custom = row.custom_logos || {};
  return {
    bankName: row.bank_name || "Bank of India",
    branchCode: custom.branchCode || "002345",
    ifscCode: row.ifsc_code || "BKID0002345",
    solId: row.sol_id || "SOL001",
    zone: custom.zone || "South Zone",
    cspName: custom.cspName || "SK Financial Services",
    cspCode: row.bc_agent_code || "CSP-BOI-0721",
    cspBranchName: row.branch_name || "Main Market Branch",
    operatorName: row.bc_agent_name || "",
    operatorContact: row.bc_agent_mobile || "",
    accountPrefix: custom.accountPrefix || "190010",
    refPrefix: custom.refPrefix || "REF-2026-",
    waGatewayUrl: custom.waGatewayUrl || "https://graph.facebook.com/v17.0",
    waToken: custom.waToken || "",
    waPhoneNumberId: custom.waPhoneNumberId || "",
    fiLogo: custom.fiLogo || "",
    cpsLogo: custom.cpsLogo || "",
    ckycLogo: row.ckyc_logo_url || "",
    consentLogo: row.sb_consent_logo_url || "",
    apyLogo: custom.apyLogo || "",
    pmjjbyLogos: custom.pmjjbyLogos || undefined,
    pmsbyLogos: custom.pmsbyLogos || undefined,
  };
}

function mapInquiryToDb(inq: Inquiry): Record<string, any> {
  return {
    id: inq.id,
    created_at: inq.timestamp || new Date().toISOString(),
    full_name: inq.name,
    mobile_number: inq.mobile,
    service_interest: inq.service,
    message: inq.message,
    status: inq.resolved ? "Resolved" : "New"
  };
}

function mapDbToInquiry(row: any): Inquiry {
  return {
    id: row.id,
    name: row.full_name || "",
    mobile: row.mobile_number || "",
    service: row.service_interest || "",
    message: row.message || "",
    timestamp: row.created_at || new Date().toISOString(),
    resolved: row.status === "Resolved"
  };
}

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
    const parsed = raw ? JSON.parse(raw) : {};
    
    // Merge with defaults
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    
    // Ensure all logo fields fallback to default values if falsy
    merged.fiLogo = merged.fiLogo || DEFAULT_SETTINGS.fiLogo;
    merged.cpsLogo = merged.cpsLogo || DEFAULT_SETTINGS.cpsLogo;
    merged.ckycLogo = merged.ckycLogo || DEFAULT_SETTINGS.ckycLogo;
    merged.consentLogo = merged.consentLogo || DEFAULT_SETTINGS.consentLogo;
    merged.apyLogo = merged.apyLogo || DEFAULT_SETTINGS.apyLogo;
    
    merged.pmjjbyLogos = {
      left: merged.pmjjbyLogos?.left || DEFAULT_SETTINGS.pmjjbyLogos.left,
      center: merged.pmjjbyLogos?.center || DEFAULT_SETTINGS.pmjjbyLogos.center,
      right: merged.pmjjbyLogos?.right || DEFAULT_SETTINGS.pmjjbyLogos.right,
    };
    
    merged.pmsbyLogos = {
      left: merged.pmsbyLogos?.left || DEFAULT_SETTINGS.pmsbyLogos.left,
      center: merged.pmsbyLogos?.center || DEFAULT_SETTINGS.pmsbyLogos.center,
      right: merged.pmsbyLogos?.right || DEFAULT_SETTINGS.pmsbyLogos.right,
    };
    
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  // Write-through to Supabase
  supabase
    .from("system_settings")
    .upsert(mapSettingsToDb(settings))
    .then(({ error }) => {
      if (error) console.error("Error writing settings to Supabase:", error);
    });
}

export { mapCustomerToDb, mapPartialCustomerToDb, mapDbToCustomer };

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

export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch customers from Supabase:", error);
      return getCustomers();
    }

    if (data) {
      const mapped = data.map(mapDbToCustomer);
      saveCustomers(mapped);
      window.dispatchEvent(new Event("supabase-sync-complete"));
      return mapped;
    }
    return getCustomers();
  } catch (err) {
    console.error("Error in fetchCustomersFromSupabase:", err);
    return getCustomers();
  }
}

export async function addCustomerAsync(customer: Customer): Promise<{ error: any; data?: any }> {
  // Direct insert to Supabase
  const payload = mapCustomerToDb(customer);
  const { data, error } = await supabase.from("customers").insert([payload]).select();
  
  if (error) {
    console.error("Error inserting customer to Supabase:", error);
    return { error };
  }

  // Update local cache
  const customers = getCustomers();
  const exists = customers.some(c => c.id === customer.id);
  if (!exists) {
    customers.unshift(customer);
    saveCustomers(customers);
  }
  window.dispatchEvent(new Event("supabase-sync-complete"));

  return { error: null, data };
}

export function addCustomer(customer: Customer): void {
  const customers = getCustomers();
  customers.unshift(customer);
  saveCustomers(customers);

  // Write-through to Supabase
  supabase
    .from("customers")
    .insert([mapCustomerToDb(customer)])
    .then(({ error }) => {
      if (error) console.error("Error inserting customer to Supabase:", error);
    });
}

export async function updateCustomerAsync(id: string, updates: Partial<Customer>): Promise<{ error: any; data?: any }> {
  const payload = mapPartialCustomerToDb(updates);
  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating customer in Supabase:", error);
    return { error };
  }

  // Update local cache
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx !== -1) {
    customers[idx] = { ...customers[idx], ...updates };
    saveCustomers(customers);
    window.dispatchEvent(new Event("supabase-sync-complete"));
  }

  return { error: null, data };
}

export function updateCustomer(id: string, updates: Partial<Customer>): void {
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx !== -1) {
    customers[idx] = { ...customers[idx], ...updates };
    saveCustomers(customers);

    // Write-through to Supabase
    supabase
      .from("customers")
      .update(mapPartialCustomerToDb(updates))
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Error updating customer in Supabase:", error);
      });
  }
}

export async function deleteCustomerAsync(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting customer from Supabase:", error);
    return { error };
  }

  const customers = getCustomers().filter(c => c.id !== id);
  saveCustomers(customers);
  window.dispatchEvent(new Event("supabase-sync-complete"));

  return { error: null };
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter(c => c.id !== id);
  saveCustomers(customers);

  // Write-through to Supabase
  supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("Error deleting customer from Supabase:", error);
    });
}

// ─── INQUIRIES ───────────────────────────────────────────
export function getInquiries(): Inquiry[] {
  try {
    const raw = localStorage.getItem(KEYS.inquiries);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addInquiry(inquiry: Inquiry): void {
  const inquiries = getInquiries();
  inquiries.unshift(inquiry);
  localStorage.setItem(KEYS.inquiries, JSON.stringify(inquiries));

  // Write-through to Supabase
  supabase
    .from("customer_inquiries")
    .insert(mapInquiryToDb(inquiry))
    .then(({ error }) => {
      if (error) console.error("Error inserting inquiry to Supabase:", error);
    });
}

export function resolveInquiry(id: string): void {
  const inquiries = getInquiries();
  const idx = inquiries.findIndex(inq => inq.id === id);
  if (idx !== -1) {
    inquiries[idx].resolved = true;
    localStorage.setItem(KEYS.inquiries, JSON.stringify(inquiries));

    // Write-through to Supabase
    supabase
      .from("customer_inquiries")
      .update({ status: "Resolved" })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Error resolving inquiry in Supabase:", error);
      });
  }
}

export function deleteInquiryLocal(id: string): void {
  const inquiries = getInquiries().filter(inq => inq.id !== id);
  localStorage.setItem(KEYS.inquiries, JSON.stringify(inquiries));

  // Write-through to Supabase
  supabase
    .from("customer_inquiries")
    .delete()
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("Error deleting inquiry from Supabase:", error);
    });
}

export function clearAllInquiries(): void {
  localStorage.setItem(KEYS.inquiries, JSON.stringify([]));

  // Write-through to Supabase
  supabase
    .from("customer_inquiries")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000") // Matches all
    .then(({ error }) => {
      if (error) console.error("Error clearing inquiries in Supabase:", error);
    });
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

// ─── SUPABASE CLOUD DATABASE SYNC ────────────────────────
export async function syncFromSupabase(): Promise<void> {
  try {
    // 1. Sync Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", "global_config")
      .maybeSingle();

    if (!settingsError && settingsData) {
      const mapped = mapDbToSettings(settingsData);
      localStorage.setItem(KEYS.settings, JSON.stringify(mapped));
    }

    // 2. Sync Customers
    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!customersError && customersData) {
      const mapped = customersData.map(mapDbToCustomer);
      localStorage.setItem(KEYS.customers, JSON.stringify(mapped));
    }

    // 3. Sync Inquiries
    const { data: inquiriesData, error: inquiriesError } = await supabase
      .from("customer_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (!inquiriesError && inquiriesData) {
      const mapped = inquiriesData.map(mapDbToInquiry);
      localStorage.setItem(KEYS.inquiries, JSON.stringify(mapped));
    }

    // Trigger local updates
    window.dispatchEvent(new Event("supabase-sync-complete"));
  } catch (err) {
    console.error("Failed to run Supabase sync:", err);
  }
}
