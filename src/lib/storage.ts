import type { Customer, AppSettings, WhatsAppMessage } from "@/types";
import { DEFAULT_SETTINGS } from "@/constants";
import { supabase } from "./supabase";

// ─── TENANT CONFIG ───────────────────────────────────────

export interface TenantSession {
  username: string;
  tenantCode: string;
  tenantId: string;
  bankName: string;
}

// Registered tenants — credentials verified application-side
export const TENANTS: Record<string, { password: string; tenantCode: string; tenantId: string; bankName: string }> = {
  skonline: {
    password: "Skonline@1234",
    tenantCode: "boi_csp",
    tenantId: "boi_csp",
    bankName: "Bank of India",
  },
  abul: {
    password: "abul",
    tenantCode: "new_csp",
    tenantId: "new_csp",
    bankName: "CSP Hub",
  },
};

// ─── NAMESPACED STORAGE KEYS ─────────────────────────────

function makeKeys(tenantCode: string) {
  return {
    customers: `sk_online_customers_${tenantCode}`,
    settings: `sk_online_settings_${tenantCode}`,
    waMessages: `sk_online_wa_messages_${tenantCode}`,
    inquiries: `sk_online_inquiries_${tenantCode}`,
  };
}

// Legacy (pre-multi-tenant) key names — for boi_csp backward migration
const LEGACY_KEYS = {
  customers: "sk_online_customers",
  settings: "sk_online_settings",
  waMessages: "sk_online_wa_messages",
  inquiries: "customerInquiries",
  auth: "sk_online_auth",
};

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

function mapCustomerToDb(c: Customer, tenantCode?: string): Record<string, any> {
  const row: Record<string, any> = {
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
    aadhaar_number: sanitizeNullableString(c.aadhaarNumber) || sanitizeNullableString(c.pmjjbyKycId) || sanitizeNullableString(c.pmsbyKycId) || sanitizeNullableString(c.apyNomineeAadhar) || null,
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
    atm_received_at: sanitizeTimestamp(c.atmReceivedAt, false),
    customer_number: c.customer_number ?? null,
    spouse_type: c.spouseType || null,
    family_id: c.familyId || null,
  };
  // Attach tenant_code for non-boi_csp rows (boi_csp rows stay untagged for backward compat)
  if (tenantCode && tenantCode !== "boi_csp") {
    row.tenant_code = tenantCode;
  }
  return row;
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

  if (c.aadhaarNumber !== undefined) {
    db.aadhaar_number = sanitizeNullableString(c.aadhaarNumber);
  } else {
    const aadhaar = c.pmjjbyKycId || c.pmsbyKycId || c.apyNomineeAadhar;
    if (aadhaar !== undefined) db.aadhaar_number = sanitizeNullableString(aadhaar);
  }

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
  if (c.customer_number !== undefined) db.customer_number = c.customer_number ?? null;
  if (c.spouseType !== undefined) db.spouse_type = c.spouseType || null;
  if (c.familyId !== undefined) db.family_id = c.familyId || null;

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
    aadhaarNumber: row.aadhaar_number || "",
    mobile: row.mobile_number || "",
    email: row.email_id || "",
    accountNumber: row.account_number || "",
    customerId: row.customer_id_cif || "",
    ifscCode: row.ifsc_code || "",
    branchCode: row.branch_name || "",

    // Nomination
    sbAccountNo: row.sb_account_no || "",
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
    customer_number: row.customer_number ?? undefined,
    spouseType: (row.spouse_type as Customer["spouseType"]) || undefined,
    familyId: row.family_id || undefined,
  };
}

function mapSettingsToDb(s: AppSettings, tenantCode: string): Record<string, any> {
  // Each tenant gets its own settings row keyed by tenant-specific id
  const settingsId = tenantCode === "boi_csp" ? "global_config" : `${tenantCode}_config`;
  return {
    id: settingsId,
    bank_name: s.bankName,
    branch_name: s.cspBranchName,
    sol_id: s.solId,
    ifsc_code: s.ifscCode,
    bc_agent_name: s.operatorName || s.cspName || "Alinur Sekh",
    bc_agent_code: s.cspCode,
    bc_agent_mobile: s.operatorContact,
    introducer_name: s.introducerName || s.operatorName || s.cspName || "",
    introducer_account_no: s.introducerAccountNo || "",
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
      introducerName: s.introducerName || "",
      introducerAccountNo: s.introducerAccountNo || "",
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
    introducerName: row.introducer_name ?? custom.introducerName ?? "",
    introducerAccountNo: row.introducer_account_no ?? custom.introducerAccountNo ?? "",
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

export interface Inquiry {
  id: string;
  name: string;
  mobile: string;
  service: string;
  message: string;
  timestamp: string;
  resolved: boolean;
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

export function getSession(): TenantSession | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEYS.auth);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      // Upgrade legacy session (username-only) to full TenantSession for boi_csp
      if (!parsed.tenantCode) {
        return {
          username: parsed.username || "skonline",
          tenantCode: "boi_csp",
          tenantId: "boi_csp",
          bankName: "Bank of India",
        };
      }
      return parsed as TenantSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function setSession(session: TenantSession): void {
  localStorage.setItem(LEGACY_KEYS.auth, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(LEGACY_KEYS.auth);
}

export function getTenantCode(): string {
  return getSession()?.tenantCode ?? "boi_csp";
}

// ─── SETTINGS ────────────────────────────────────────────

export function getSettings(): AppSettings {
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);

  try {
    // For boi_csp: also check the legacy key as fallback for existing stored settings
    let raw = localStorage.getItem(KEYS.settings);
    if (!raw && tenantCode === "boi_csp") {
      raw = localStorage.getItem(LEGACY_KEYS.settings);
    }
    const parsed = raw ? JSON.parse(raw) : {};

    const merged = { ...DEFAULT_SETTINGS, ...parsed };

    merged.fiLogo = merged.fiLogo || DEFAULT_SETTINGS.fiLogo;
    merged.cpsLogo = merged.cpsLogo || DEFAULT_SETTINGS.cpsLogo;
    merged.ckycLogo = merged.ckycLogo || DEFAULT_SETTINGS.ckycLogo;
    merged.consentLogo = merged.consentLogo || DEFAULT_SETTINGS.consentLogo;
    merged.apyLogo = merged.apyLogo || DEFAULT_SETTINGS.apyLogo;
    merged.introducerName = merged.introducerName !== undefined ? merged.introducerName : (merged.operatorName || merged.cspName || "");
    merged.introducerAccountNo = merged.introducerAccountNo || "";

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
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  supabase
    .from("system_settings")
    .upsert(mapSettingsToDb(settings, tenantCode))
    .then(({ error }) => {
      if (error) console.error("Error writing settings to Supabase:", error);
    });
}

export { mapCustomerToDb, mapPartialCustomerToDb, mapDbToCustomer };

// ─── CUSTOMERS ───────────────────────────────────────────

export function getCustomers(): Customer[] {
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  try {
    let raw = localStorage.getItem(KEYS.customers);
    // For boi_csp: fall back to legacy key so existing data is preserved
    if (!raw && tenantCode === "boi_csp") {
      raw = localStorage.getItem(LEGACY_KEYS.customers);
      // Migrate legacy data into namespaced key
      if (raw) {
        localStorage.setItem(KEYS.customers, raw);
      }
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  localStorage.setItem(KEYS.customers, JSON.stringify(customers));
}

export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  const tenantCode = getTenantCode();
  try {
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    // For new_csp: filter by tenant_code column (gracefully handled if column is absent)
    if (tenantCode !== "boi_csp") {
      query = (query as any).eq("tenant_code", tenantCode);
    }

    const { data, error } = await query;

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
  const tenantCode = getTenantCode();
  const payload = mapCustomerToDb(customer, tenantCode);
  const { data, error } = await supabase.from("customers").insert([payload]).select();

  if (error) {
    console.error("Error inserting customer to Supabase:", error);
    return { error };
  }

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
  const tenantCode = getTenantCode();
  const customers = getCustomers();
  customers.unshift(customer);
  saveCustomers(customers);

  supabase
    .from("customers")
    .insert([mapCustomerToDb(customer, tenantCode)])
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
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  try {
    let raw = localStorage.getItem(KEYS.inquiries);
    if (!raw && tenantCode === "boi_csp") {
      raw = localStorage.getItem(LEGACY_KEYS.inquiries);
      if (raw) localStorage.setItem(KEYS.inquiries, raw);
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addInquiry(inquiry: Inquiry): void {
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  const inquiries = getInquiries();
  inquiries.unshift(inquiry);
  localStorage.setItem(KEYS.inquiries, JSON.stringify(inquiries));

  supabase
    .from("customer_inquiries")
    .insert(mapInquiryToDb(inquiry))
    .then(({ error }) => {
      if (error) console.error("Error inserting inquiry to Supabase:", error);
    });
}

export function resolveInquiry(id: string): void {
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  const inquiries = getInquiries();
  const idx = inquiries.findIndex(inq => inq.id === id);
  if (idx !== -1) {
    inquiries[idx].resolved = true;
    localStorage.setItem(KEYS.inquiries, JSON.stringify(inquiries));

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
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  const inquiries = getInquiries().filter(inq => inq.id !== id);
  localStorage.setItem(KEYS.inquiries, JSON.stringify(inquiries));

  supabase
    .from("customer_inquiries")
    .delete()
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("Error deleting inquiry from Supabase:", error);
    });
}

export function clearAllInquiries(): void {
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  localStorage.setItem(KEYS.inquiries, JSON.stringify([]));

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
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  try {
    let raw = localStorage.getItem(KEYS.waMessages);
    if (!raw && tenantCode === "boi_csp") {
      raw = localStorage.getItem(LEGACY_KEYS.waMessages);
      if (raw) localStorage.setItem(KEYS.waMessages, raw);
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addWaMessage(msg: WhatsAppMessage): void {
  const tenantCode = getTenantCode();
  const KEYS = makeKeys(tenantCode);
  const messages = getWaMessages();
  messages.unshift(msg);
  localStorage.setItem(KEYS.waMessages, JSON.stringify(messages));
}

// ─── SUPABASE CLOUD DATABASE SYNC ────────────────────────

export async function syncFromSupabase(tenantCode?: string): Promise<void> {
  const tc = tenantCode ?? getTenantCode();
  const KEYS = makeKeys(tc);

  try {
    // 1. Sync Settings — each tenant has its own settings row
    const settingsId = tc === "boi_csp" ? "global_config" : `${tc}_config`;
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", settingsId)
      .maybeSingle();

    if (!settingsError && settingsData) {
      const mapped = mapDbToSettings(settingsData);
      localStorage.setItem(KEYS.settings, JSON.stringify(mapped));
    }

    // 2. Sync Customers — scoped to tenant
    let customersQuery = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    // Non-boi_csp tenants: filter by tenant_code column
    if (tc !== "boi_csp") {
      customersQuery = (customersQuery as any).eq("tenant_code", tc);
    }

    const { data: customersData, error: customersError } = await customersQuery;

    if (!customersError && customersData) {
      const mapped = customersData.map(mapDbToCustomer);
      localStorage.setItem(KEYS.customers, JSON.stringify(mapped));
      // Keep legacy key in sync for boi_csp to prevent any stale reads
      if (tc === "boi_csp") {
        localStorage.setItem(LEGACY_KEYS.customers, JSON.stringify(mapped));
      }
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

    window.dispatchEvent(new Event("supabase-sync-complete"));
  } catch (err) {
    console.error("Failed to run Supabase sync:", err);
  }
}
