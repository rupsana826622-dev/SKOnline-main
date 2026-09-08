import { supabase } from "./supabase";
import type { BobCustomerRecord, BobSettings } from "@/types/bob";
import { DEFAULT_BOB_SETTINGS } from "@/types/bob";
import { getSession } from "./storage";
import { toast } from "sonner";

const STORAGE_KEYS = {
  records: "sk_online_bob_customers_bob_csp",
  settings: "sk_online_bob_settings_bob_csp",
};

export function getCurrentTenantId(): string {
  const session = getSession();
  return session?.tenantId || session?.tenantCode || "bob_csp";
}

// ─── BOB SETTINGS ─────────────────────────────────────────────

export function getBobSettings(): BobSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_BOB_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BOB_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_BOB_SETTINGS;
  }
}

export function saveBobSettings(settings: BobSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  window.dispatchEvent(new Event("bob-settings-updated"));

  // Sync to Supabase system_settings row for bob_csp
  supabase
    .from("system_settings")
    .upsert({
      id: "bob_csp_config",
      bank_name: "Bank of Baroda",
      branch_name: settings.branchName || "Bank of Baroda CSP",
      bc_agent_name: settings.operatorName || "CSP Operator",
      bc_agent_mobile: settings.operatorContact || "",
      custom_logos: {
        bob_settings: settings,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.error("Error saving BOB settings to Supabase:", error);
        toast.error(`Settings Save Error: ${error.message}`);
      }
    });
}

// ─── BOB CUSTOMER RECORDS ─────────────────────────────────────

export function getBobCustomers(): BobCustomerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.records);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBobCustomers(records: BobCustomerRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
    window.dispatchEvent(new Event("bob-data-updated"));
  } catch (err) {
    console.error("Error writing BOB records to local cache:", err);
  }
}

export function getNextBobSerialNo(): number {
  const records = getBobCustomers();
  if (records.length === 0) return 1001;
  const max = records.reduce((acc, r) => (r.slNo > acc ? r.slNo : acc), 1000);
  return max + 1;
}

export function mapDbToBobCustomer(row: any): BobCustomerRecord {
  return {
    id: row.id,
    slNo: Number(row.sl_no || row.customer_number || 1001),
    accountOpeningDate: row.account_opening_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    customerName: row.customer_name || row.full_name || "",
    guardianName: row.care_of || row.father_name || "",
    dob: row.dob || "",
    mobile: row.mobile || row.mobile_number || "",
    address: row.address || "",
    aadhaarNo: row.aadhaar_no || row.aadhaar_number || "",
    refNo: row.reference_no || row.pin_code || "",
    cifNo: row.cif_no || row.customer_id_cif || "",
    accountNo: row.account_no || row.account_number || "",
    enrollAPY: row.has_apy !== undefined ? !!row.has_apy : !!row.include_apy,
    enrollPMSBY: row.has_pmsby !== undefined ? !!row.has_pmsby : !!row.include_pmsby,
    enrollPMJJBY: row.has_pmjjby !== undefined ? !!row.has_pmjjby : !!row.include_pmjjby,

    passbookIssued: !!row.passbook_issued,
    passbookIssuedAt: row.passbook_issued_date || row.passbook_issued_at || (row.passbook_issued ? row.created_at : null),
    passbookDelivered: !!row.passbook_delivered || !!row.passbook_received,
    passbookDeliveredAt: row.passbook_delivered_date || row.passbook_received_at || null,

    atmIssued: !!row.atm_issued,
    atmIssuedAt: row.atm_issued_date || row.atm_issued_at || (row.atm_issued ? row.created_at : null),
    atmDelivered: !!row.atm_delivered || !!row.atm_received,
    atmDeliveredAt: row.atm_delivered_date || row.atm_received_at || null,

    notes: row.notes || "",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    tenant_code: "bob_csp",
    tenant_id: row.tenant_id || "bob_csp",
  };
}

/**
 * Fetch records strictly from Supabase bob_customers scoped to tenant_id
 */
export async function fetchBobCustomersFromSupabase(): Promise<BobCustomerRecord[]> {
  const currentTenantId = getCurrentTenantId();

  try {
    const { data, error } = await (supabase as any)
      .from("bob_customers")
      .select("*")
      .eq("tenant_id", currentTenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase BOB Select Error:", error);
      // If table error, show alert so operator is informed
      toast.error(`Database Error: ${error.message} (Code: ${error.code || "SELECT_ERR"})`);
      saveBobCustomers([]);
      return [];
    }

    const mapped = (data || []).map(mapDbToBobCustomer);
    saveBobCustomers(mapped);
    return mapped;
  } catch (err: any) {
    console.error("Unexpected error in fetchBobCustomersFromSupabase:", err);
    saveBobCustomers([]);
    return [];
  }
}

/**
 * Insert new BOB customer directly into Supabase public.bob_customers
 */
export async function addBobCustomer(formData: {
  account_opening_date: string;
  sl_no: number | string;
  customer_name: string;
  care_of: string;
  dob?: string | null;
  mobile: string;
  address: string;
  aadhaar_no: string;
  reference_no: string;
  cif_no: string;
  account_no: string;
  has_apy: boolean;
  has_pmsby: boolean;
  has_pmjjby: boolean;
  passbook_issued?: boolean;
  passbook_issued_date?: string | null;
  passbook_delivered?: boolean;
  passbook_delivered_date?: string | null;
  atm_issued?: boolean;
  atm_issued_date?: string | null;
  atm_delivered?: boolean;
  atm_delivered_date?: string | null;
}): Promise<{ data: BobCustomerRecord | null; error: any }> {
  const currentTenantId = getCurrentTenantId();

  const payload: Record<string, any> = {
    tenant_id: currentTenantId,
    account_opening_date: formData.account_opening_date,
    sl_no: formData.sl_no ? parseInt(String(formData.sl_no), 10) : null,
    customer_name: formData.customer_name,
    care_of: formData.care_of,
    dob: formData.dob || null,
    mobile: formData.mobile,
    address: formData.address,
    aadhaar_no: formData.aadhaar_no,
    reference_no: formData.reference_no,
    cif_no: formData.cif_no,
    account_no: formData.account_no,
    has_apy: !!formData.has_apy,
    has_pmsby: !!formData.has_pmsby,
    has_pmjjby: !!formData.has_pmjjby,
    passbook_issued: !!formData.passbook_issued,
    passbook_issued_date: formData.passbook_issued_date || null,
    passbook_delivered: !!formData.passbook_delivered,
    passbook_delivered_date: formData.passbook_delivered_date || null,
    atm_issued: !!formData.atm_issued,
    atm_issued_date: formData.atm_issued_date || null,
    atm_delivered: !!formData.atm_delivered,
    atm_delivered_date: formData.atm_delivered_date || null,
  };

  const { data, error } = await (supabase as any)
    .from("bob_customers")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Supabase BOB Insert Error:", error);
    const errorMsg = `Database Save Failed: ${error.message} (Code: ${error.code || "ERR"})`;
    alert(errorMsg);
    toast.error(errorMsg);
    throw error;
  }

  const mapped = mapDbToBobCustomer(data);
  // Re-fetch all records live from Supabase
  await fetchBobCustomersFromSupabase();
  return { data: mapped, error: null };
}

/**
 * Update BOB customer directly in Supabase public.bob_customers
 */
export async function updateBobCustomer(
  id: string,
  updates: Partial<BobCustomerRecord>
): Promise<{ error: any }> {
  const currentTenantId = getCurrentTenantId();

  const payload: Record<string, any> = {};
  if (updates.accountOpeningDate !== undefined) payload.account_opening_date = updates.accountOpeningDate;
  if (updates.slNo !== undefined) payload.sl_no = Number(updates.slNo);
  if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
  if (updates.guardianName !== undefined) payload.care_of = updates.guardianName;
  if (updates.dob !== undefined) payload.dob = updates.dob || null;
  if (updates.mobile !== undefined) payload.mobile = updates.mobile;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.aadhaarNo !== undefined) payload.aadhaar_no = updates.aadhaarNo;
  if (updates.refNo !== undefined) payload.reference_no = updates.refNo;
  if (updates.cifNo !== undefined) payload.cif_no = updates.cifNo;
  if (updates.accountNo !== undefined) payload.account_no = updates.accountNo;
  if (updates.enrollAPY !== undefined) payload.has_apy = !!updates.enrollAPY;
  if (updates.enrollPMSBY !== undefined) payload.has_pmsby = !!updates.enrollPMSBY;
  if (updates.enrollPMJJBY !== undefined) payload.has_pmjjby = !!updates.enrollPMJJBY;

  if (updates.passbookIssued !== undefined) payload.passbook_issued = !!updates.passbookIssued;
  if (updates.passbookIssuedAt !== undefined) payload.passbook_issued_date = updates.passbookIssuedAt;
  if (updates.passbookDelivered !== undefined) payload.passbook_delivered = !!updates.passbookDelivered;
  if (updates.passbookDeliveredAt !== undefined) payload.passbook_delivered_date = updates.passbookDeliveredAt;

  if (updates.atmIssued !== undefined) payload.atm_issued = !!updates.atmIssued;
  if (updates.atmIssuedAt !== undefined) payload.atm_issued_date = updates.atmIssuedAt;
  if (updates.atmDelivered !== undefined) payload.atm_delivered = !!updates.atmDelivered;
  if (updates.atmDeliveredAt !== undefined) payload.atm_delivered_date = updates.atmDeliveredAt;

  const { error } = await (supabase as any)
    .from("bob_customers")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", currentTenantId);

  if (error) {
    console.error("Supabase BOB Update Error:", error);
    const errorMsg = `Database Update Failed: ${error.message} (Code: ${error.code || "ERR"})`;
    alert(errorMsg);
    toast.error(errorMsg);
    throw error;
  }

  // Re-fetch all records live from Supabase
  await fetchBobCustomersFromSupabase();
  return { error: null };
}

/**
 * Delete BOB customer directly from Supabase public.bob_customers
 */
export async function deleteBobCustomer(id: string): Promise<{ error: any }> {
  const currentTenantId = getCurrentTenantId();

  const { error } = await (supabase as any)
    .from("bob_customers")
    .delete()
    .eq("id", id)
    .eq("tenant_id", currentTenantId);

  if (error) {
    console.error("Supabase BOB Delete Error:", error);
    const errorMsg = `Database Delete Failed: ${error.message} (Code: ${error.code || "ERR"})`;
    alert(errorMsg);
    toast.error(errorMsg);
    throw error;
  }

  // Re-fetch all records live from Supabase
  await fetchBobCustomersFromSupabase();
  return { error: null };
}

export async function syncBobFromSupabase(): Promise<void> {
  try {
    // 1. Sync Settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", "bob_csp_config")
      .maybeSingle();

    if (settingsData?.custom_logos?.bob_settings) {
      const liveSettings = settingsData.custom_logos.bob_settings;
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(liveSettings));
      window.dispatchEvent(new Event("bob-settings-updated"));
    }

    // 2. Sync Records
    await fetchBobCustomersFromSupabase();
  } catch (err) {
    console.warn("Failed to sync BOB data from Supabase:", err);
  }
}
