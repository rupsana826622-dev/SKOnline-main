import { supabase } from "./supabase";
import type { BobCustomerRecord, BobSettings } from "@/types/bob";
import { DEFAULT_BOB_SETTINGS } from "@/types/bob";
import { getSession } from "./storage";
import { sanitizeDob } from "./utils";
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

export async function uploadBobStamp(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `bob_stamp_${Date.now()}_${cleanFileName}`;

    // Try system-assets bucket first, fallback to citizen-documents
    let bucketName = "system-assets";
    let uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadRes.error) {
      bucketName = "citizen-documents";
      uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
    }

    if (uploadRes.error) {
      console.error("Supabase Storage Stamp Upload Error:", uploadRes.error);
      const msg = `Storage Upload Failed: ${uploadRes.error.message}`;
      alert(msg);
      toast.error(msg);
      return { url: null, error: uploadRes.error };
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return { url: data?.publicUrl || null, error: null };
  } catch (err: any) {
    console.error("Unexpected error in uploadBobStamp:", err);
    alert(`Upload Error: ${err.message || "Unknown error"}`);
    toast.error(`Upload Error: ${err.message || "Unknown error"}`);
    return { url: null, error: err };
  }
}

export async function saveBobSettingsAsync(settings: BobSettings): Promise<{ error: any }> {
  const currentTenantId = getCurrentTenantId();

  // Save to local cache immediately
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  window.dispatchEvent(new Event("bob-settings-updated"));

  try {
    let lastError: any = null;

    // 1. Persist directly to system_settings row bob_csp_config
    try {
      const { error: sysErr } = await supabase
        .from("system_settings")
        .upsert({
          id: "bob_csp_config",
          tenant_id: currentTenantId,
          bank_name: "Bank of Baroda",
          branch_name: settings.linkBranch || settings.branchName || "Bank of Baroda CSP",
          bc_agent_name: settings.operatorName || "CSP Operator",
          bc_agent_mobile: settings.operatorContact || "",
          custom_logos: {
            bob_settings: settings,
          },
          updated_at: new Date().toISOString(),
        });
      if (sysErr) lastError = sysErr;
    } catch (e) {
      lastError = e;
    }

    // 2. Also persist directly to public.bob_settings table
    try {
      const { error: bobErr } = await (supabase as any)
        .from("bob_settings")
        .upsert({
          tenant_id: currentTenantId,
          csp_name: settings.cspName,
          csp_code: settings.cspCode,
          csp_address: settings.cspAddress,
          link_branch: settings.linkBranch,
          branch_name: settings.branchName || settings.linkBranch,
          branch_code: settings.branchCode,
          ifsc_code: settings.ifscCode,
          operator_name: settings.operatorName,
          operator_contact: settings.operatorContact,
          ref_prefix: settings.refPrefix,
          stamp_signature_url: settings.stampSignatureUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: "tenant_id" })
        .select();

      if (bobErr) {
        console.warn("bob_settings upsert warning:", bobErr);
      } else {
        lastError = null;
      }
    } catch (e) {
      // Non-fatal if table not yet provisioned
    }

    if (lastError) {
      console.error("Error saving BOB settings to Supabase:", lastError);
      const errorMsg = `Settings Save Failed: ${lastError.message || "Database Error"}`;
      alert(errorMsg);
      toast.error(errorMsg);
      return { error: lastError };
    }

    return { error: null };
  } catch (err: any) {
    console.error("Unexpected error in saveBobSettingsAsync:", err);
    alert(`Settings Save Error: ${err.message || "Network Error"}`);
    toast.error(`Settings Save Error: ${err.message || "Network Error"}`);
    return { error: err };
  }
}

export function saveBobSettings(settings: BobSettings): void {
  saveBobSettingsAsync(settings);
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
  if (records.length === 0) return 1;
  const max = records.reduce((acc, r) => (r.slNo > acc ? r.slNo : acc), 0);
  return max + 1;
}

export function mapDbToBobCustomer(row: any): BobCustomerRecord {
  const toDateStr = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "boolean") return null;
    return String(val);
  };

  const pbIssuedDate = toDateStr(row.passbook_issued_date) || (typeof row.passbook_issued === "string" ? row.passbook_issued : null);
  const pbIssuedFlag = Boolean(row.passbook_issued || row.passbook_issued_date);

  const pbDeliveredDate = toDateStr(row.passbook_delivered_date) || (typeof row.passbook_delivered === "string" ? row.passbook_delivered : null);
  const pbDeliveredFlag = Boolean(row.passbook_delivered || row.passbook_delivered_date);

  const atmIssuedDate = toDateStr(row.atm_issued_date) || (typeof row.atm_issued === "string" ? row.atm_issued : null);
  const atmIssuedFlag = Boolean(row.atm_issued || row.atm_issued_date);

  const atmDeliveredDate = toDateStr(row.atm_delivered_date) || (typeof row.atm_delivered === "string" ? row.atm_delivered : null);
  const atmDeliveredFlag = Boolean(row.atm_delivered || row.atm_delivered_date);

  return {
    id: row.id,
    slNo: Number(row.sl_no || 1),
    accountOpeningDate: row.account_opening_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    customerName: row.customer_name || "",
    guardianName: row.care_of || "",
    dob: row.dob || "",
    mobile: row.mobile || "",
    address: row.address || "",
    aadhaarNo: row.aadhaar_no || "",
    refNo: row.reference_no || "",
    cifNo: row.cif_no || "",
    accountNo: row.account_no || "",
    enrollAPY: Boolean(row.has_apy),
    enrollPMSBY: Boolean(row.has_pmsby),
    enrollPMJJBY: Boolean(row.has_pmjjby),

    passbookIssued: pbIssuedFlag,
    passbookIssuedAt: pbIssuedDate,
    passbook_issued: pbIssuedFlag,
    passbook_issued_date: pbIssuedDate,

    passbookDelivered: pbDeliveredFlag,
    passbookDeliveredAt: pbDeliveredDate,
    passbook_delivered: pbDeliveredFlag,
    passbook_delivered_date: pbDeliveredDate,

    atmIssued: atmIssuedFlag,
    atmIssuedAt: atmIssuedDate,
    atm_issued: atmIssuedFlag,
    atm_issued_date: atmIssuedDate,

    atmDelivered: atmDeliveredFlag,
    atmDeliveredAt: atmDeliveredDate,
    atm_delivered: atmDeliveredFlag,
    atm_delivered_date: atmDeliveredDate,

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
  account_opening_date?: string;
  sl_no?: number | string | null;
  customer_name?: string;
  care_of?: string | null;
  dob?: string | null;
  mobile?: string | null;
  address?: string | null;
  aadhaar_no?: string | null;
  reference_no?: string | null;
  cif_no?: string | null;
  account_no?: string | null;
  has_apy?: boolean;
  has_pmsby?: boolean;
  has_pmjjby?: boolean;
}): Promise<{ data: BobCustomerRecord | null; error: any }> {
  const currentTenantId = getCurrentTenantId();

  const payload = {
    tenant_id: currentTenantId,
    account_opening_date: sanitizeDob(formData.account_opening_date) || new Date().toISOString().split("T")[0],
    sl_no: formData.sl_no ? parseInt(String(formData.sl_no), 10) : 1,
    customer_name: formData.customer_name?.trim() || "",
    care_of: formData.care_of?.trim() || null,
    dob: sanitizeDob(formData.dob),
    mobile: formData.mobile?.trim() || null,
    address: formData.address?.trim() || null,
    aadhaar_no: formData.aadhaar_no?.trim() || null,
    reference_no: formData.reference_no?.trim() || null,
    cif_no: formData.cif_no?.trim() || null,
    account_no: formData.account_no?.trim() || null,
    has_apy: Boolean(formData.has_apy),
    has_pmsby: Boolean(formData.has_pmsby),
    has_pmjjby: Boolean(formData.has_pmjjby),
  };

  const { data, error } = await (supabase as any)
    .from("bob_customers")
    .insert([payload])
    .select();

  if (error) {
    console.error("Supabase BOB Insert Error:", error);
    const errorMsg = `Database Save Failed: ${error.message} (Code: ${error.code || "ERR"})`;
    alert(errorMsg);
    toast.error(errorMsg);
    throw error;
  }

  const insertedRow = Array.isArray(data) ? data[0] : data;
  const mapped = mapDbToBobCustomer(insertedRow);
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
  if (updates.accountOpeningDate !== undefined) {
    payload.account_opening_date = sanitizeDob(updates.accountOpeningDate) || new Date().toISOString().split("T")[0];
  }
  if (updates.slNo !== undefined) {
    payload.sl_no = updates.slNo ? parseInt(String(updates.slNo), 10) : 1;
  }
  if (updates.customerName !== undefined) {
    payload.customer_name = updates.customerName?.trim();
  }
  if (updates.guardianName !== undefined) {
    payload.care_of = updates.guardianName?.trim() || null;
  }
  if (updates.dob !== undefined) {
    payload.dob = sanitizeDob(updates.dob);
  }
  if (updates.mobile !== undefined) {
    payload.mobile = updates.mobile?.trim() || null;
  }
  if (updates.address !== undefined) {
    payload.address = updates.address?.trim() || null;
  }
  if (updates.aadhaarNo !== undefined) {
    payload.aadhaar_no = updates.aadhaarNo?.trim() || null;
  }
  if (updates.refNo !== undefined) {
    payload.reference_no = updates.refNo?.trim() || null;
  }
  if (updates.cifNo !== undefined) {
    payload.cif_no = updates.cifNo?.trim() || null;
  }
  if (updates.accountNo !== undefined) {
    payload.account_no = updates.accountNo?.trim() || null;
  }
  if (updates.enrollAPY !== undefined) {
    payload.has_apy = Boolean(updates.enrollAPY);
  }
  if (updates.enrollPMSBY !== undefined) {
    payload.has_pmsby = Boolean(updates.enrollPMSBY);
  }
  if (updates.enrollPMJJBY !== undefined) {
    payload.has_pmjjby = Boolean(updates.enrollPMJJBY);
  }

  // Delivery tracking columns — write boolean flags to boolean columns and
  // date strings to _date columns.
  if (updates.passbookIssued !== undefined || updates.passbookIssuedAt !== undefined || updates.passbook_issued !== undefined || updates.passbook_issued_date !== undefined) {
    const dateVal = sanitizeDob(updates.passbookIssuedAt ?? updates.passbook_issued_date) ?? null;
    const boolVal = updates.passbookIssued !== undefined ? Boolean(updates.passbookIssued) : updates.passbook_issued !== undefined ? Boolean(updates.passbook_issued) : dateVal !== null;
    payload.passbook_issued = boolVal;
    payload.passbook_issued_date = dateVal;
  }
  if (updates.passbookDelivered !== undefined || updates.passbookDeliveredAt !== undefined || updates.passbook_delivered !== undefined || updates.passbook_delivered_date !== undefined) {
    const dateVal = sanitizeDob(updates.passbookDeliveredAt ?? updates.passbook_delivered_date) ?? null;
    const boolVal = updates.passbookDelivered !== undefined ? Boolean(updates.passbookDelivered) : updates.passbook_delivered !== undefined ? Boolean(updates.passbook_delivered) : dateVal !== null;
    payload.passbook_delivered = boolVal;
    payload.passbook_delivered_date = dateVal;
  }
  if (updates.atmIssued !== undefined || updates.atmIssuedAt !== undefined || updates.atm_issued !== undefined || updates.atm_issued_date !== undefined) {
    const dateVal = sanitizeDob(updates.atmIssuedAt ?? updates.atm_issued_date) ?? null;
    const boolVal = updates.atmIssued !== undefined ? Boolean(updates.atmIssued) : updates.atm_issued !== undefined ? Boolean(updates.atm_issued) : dateVal !== null;
    payload.atm_issued = boolVal;
    payload.atm_issued_date = dateVal;
  }
  if (updates.atmDelivered !== undefined || updates.atmDeliveredAt !== undefined || updates.atm_delivered !== undefined || updates.atm_delivered_date !== undefined) {
    const dateVal = sanitizeDob(updates.atmDeliveredAt ?? updates.atm_delivered_date) ?? null;
    const boolVal = updates.atmDelivered !== undefined ? Boolean(updates.atmDelivered) : updates.atm_delivered !== undefined ? Boolean(updates.atm_delivered) : dateVal !== null;
    payload.atm_delivered = boolVal;
    payload.atm_delivered_date = dateVal;
  }

  if (Object.keys(payload).length > 0) {
    // First attempt: full payload (all columns)
    let { error } = await (supabase as any)
      .from("bob_customers")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", currentTenantId);

    if (error && error.code === "PGRST204") {
      // Schema cache doesn't have one of the boolean alias columns.
      // Retry with only the _date variants (safe subset).
      console.warn("PGRST204 on full payload — retrying with _date-only columns", error);
      const safeDatePayload: Record<string, any> = {};
      if (payload.passbook_issued_date !== undefined) safeDatePayload.passbook_issued_date = payload.passbook_issued_date;
      if (payload.passbook_delivered_date !== undefined) safeDatePayload.passbook_delivered_date = payload.passbook_delivered_date;
      if (payload.atm_issued_date !== undefined) safeDatePayload.atm_issued_date = payload.atm_issued_date;
      if (payload.atm_delivered_date !== undefined) safeDatePayload.atm_delivered_date = payload.atm_delivered_date;
      // Include non-delivery fields from original payload too
      for (const [k, v] of Object.entries(payload)) {
        if (!k.endsWith("_date") && !k.startsWith("passbook_issued") && !k.startsWith("passbook_delivered") && !k.startsWith("atm_issued") && !k.startsWith("atm_delivered")) {
          safeDatePayload[k] = v;
        }
      }
      const retry = await (supabase as any)
        .from("bob_customers")
        .update(safeDatePayload)
        .eq("id", id)
        .eq("tenant_id", currentTenantId);
      error = retry.error;
    }

    if (error) {
      console.error("Supabase BOB Update Error:", error);
      const errorMsg = `Database Update Failed: ${error.message} (Code: ${error.code || "ERR"})`;
      alert(errorMsg);
      toast.error(errorMsg);
      throw error;
    }
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
  const currentTenantId = getCurrentTenantId();

  try {
    let liveSettings: BobSettings | null = null;

    // 1. Sync Settings: Try system_settings row bob_csp_config
    try {
      const { data: settingsData, error: sysError } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", "bob_csp_config")
        .maybeSingle();

      if (!sysError && settingsData?.custom_logos?.bob_settings) {
        liveSettings = {
          ...DEFAULT_BOB_SETTINGS,
          ...settingsData.custom_logos.bob_settings,
        };
      }
    } catch {
      // Ignored
    }

    // 2. Also check public.bob_settings table
    try {
      const { data, error } = await (supabase as any)
        .from("bob_settings")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .maybeSingle();

      if (!error && data) {
        liveSettings = {
          ...DEFAULT_BOB_SETTINGS,
          ...(liveSettings || {}),
          cspName: data.csp_name || liveSettings?.cspName || DEFAULT_BOB_SETTINGS.cspName,
          cspCode: data.csp_code || liveSettings?.cspCode || DEFAULT_BOB_SETTINGS.cspCode,
          cspAddress: data.csp_address || liveSettings?.cspAddress || DEFAULT_BOB_SETTINGS.cspAddress,
          linkBranch: data.link_branch || liveSettings?.linkBranch || DEFAULT_BOB_SETTINGS.linkBranch,
          branchName: data.branch_name || data.link_branch || liveSettings?.branchName || DEFAULT_BOB_SETTINGS.branchName,
          branchCode: data.branch_code || liveSettings?.branchCode || DEFAULT_BOB_SETTINGS.branchCode,
          ifscCode: data.ifsc_code || liveSettings?.ifscCode || DEFAULT_BOB_SETTINGS.ifscCode,
          operatorName: data.operator_name || liveSettings?.operatorName || DEFAULT_BOB_SETTINGS.operatorName,
          operatorContact: data.operator_contact || liveSettings?.operatorContact || DEFAULT_BOB_SETTINGS.operatorContact,
          refPrefix: data.ref_prefix || liveSettings?.refPrefix || DEFAULT_BOB_SETTINGS.refPrefix,
          stampSignatureUrl: data.stamp_signature_url || liveSettings?.stampSignatureUrl || "",
        };
      }
    } catch {
      // Ignored
    }

    if (liveSettings) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(liveSettings));
      window.dispatchEvent(new Event("bob-settings-updated"));
    }

    // 3. Sync Records
    await fetchBobCustomersFromSupabase();
  } catch (err) {
    console.warn("Failed to sync BOB data from Supabase:", err);
  }
}
