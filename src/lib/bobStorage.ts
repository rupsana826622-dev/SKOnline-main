import { supabase } from "./supabase";
import type { BobCustomerRecord, BobSettings } from "@/types/bob";
import { DEFAULT_BOB_SETTINGS } from "@/types/bob";
import { getSession } from "./storage";

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
  try {
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
        if (error) console.warn("Error saving BOB settings to Supabase:", error);
      });
  } catch (err) {
    console.error("Error in saveBobSettings:", err);
  }
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
    console.error("Error saving BOB records to local storage:", err);
  }
}

export function getNextBobSerialNo(): number {
  const records = getBobCustomers();
  if (records.length === 0) return 1001;
  const max = records.reduce((acc, r) => (r.slNo > acc ? r.slNo : acc), 1000);
  return max + 1;
}

// Map BobCustomerRecord to Supabase bob_customers / customers table row
export function mapBobCustomerToDb(r: BobCustomerRecord, tenantId: string = "bob_csp"): Record<string, any> {
  return {
    id: r.id,
    created_at: r.createdAt || new Date().toISOString(),
    full_name: r.customerName || "",
    father_name: r.guardianName || "",
    dob: r.dob || null,
    mobile_number: r.mobile || "",
    address: r.address || "",
    aadhaar_number: r.aadhaarNo ? r.aadhaarNo.replace(/\D/g, "") : null,
    account_number: r.accountNo || "",
    customer_id_cif: r.cifNo || "",
    pin_code: r.refNo || "",
    account_opening_date: r.accountOpeningDate || null,
    customer_number: r.slNo,
    include_apy: !!r.enrollAPY,
    include_pmsby: !!r.enrollPMSBY,
    include_pmjjby: !!r.enrollPMJJBY,

    // 4-Stage Delivery Tracking fields
    passbook_issued: !!r.passbookIssued,
    passbook_issued_at: r.passbookIssuedAt || null,
    passbook_issued_date: r.passbookIssuedAt ? r.passbookIssuedAt.slice(0, 10) : null,

    passbook_received: !!r.passbookDelivered,
    passbook_received_at: r.passbookDeliveredAt || null,
    passbook_delivered_date: r.passbookDeliveredAt ? r.passbookDeliveredAt.slice(0, 10) : null,

    atm_issued: !!r.atmIssued,
    atm_issued_at: r.atmIssuedAt || null,
    atm_issued_date: r.atmIssuedAt ? r.atmIssuedAt.slice(0, 10) : null,

    atm_received: !!r.atmDelivered,
    atm_received_at: r.atmDeliveredAt || null,
    atm_delivered_date: r.atmDeliveredAt ? r.atmDeliveredAt.slice(0, 10) : null,

    notes: r.notes || "",
    tenant_code: "bob_csp",
    tenant_id: tenantId,
    family_id: JSON.stringify({
      slNo: r.slNo,
      guardianName: r.guardianName,
      refNo: r.refNo,
      cifNo: r.cifNo,
      enrollAPY: r.enrollAPY,
      enrollPMSBY: r.enrollPMSBY,
      enrollPMJJBY: r.enrollPMJJBY,
      passbookIssued: r.passbookIssued,
      passbookIssuedAt: r.passbookIssuedAt,
      passbookDelivered: r.passbookDelivered,
      passbookDeliveredAt: r.passbookDeliveredAt,
      atmIssued: r.atmIssued,
      atmIssuedAt: r.atmIssuedAt,
      atmDelivered: r.atmDelivered,
      atmDeliveredAt: r.atmDeliveredAt,
    }),
  };
}

export function mapDbToBobCustomer(row: any): BobCustomerRecord {
  let extra: any = {};
  if (row.family_id) {
    try {
      extra = JSON.parse(row.family_id);
    } catch {
      extra = {};
    }
  }

  const pbIssued = row.passbook_issued !== undefined ? !!row.passbook_issued : !!extra.passbookIssued;
  const pbIssuedAt = row.passbook_issued_date || row.passbook_issued_at || extra.passbookIssuedAt || (pbIssued ? row.created_at : null);

  const pbDelivered = row.passbook_delivered_date
    ? true
    : row.passbook_received !== undefined
    ? !!row.passbook_received
    : !!extra.passbookDelivered;
  const pbDeliveredAt = row.passbook_delivered_date || row.passbook_received_at || extra.passbookDeliveredAt || null;

  const atmIssued = row.atm_issued !== undefined ? !!row.atm_issued : !!extra.atmIssued;
  const atmIssuedAt = row.atm_issued_date || row.atm_issued_at || extra.atmIssuedAt || (atmIssued ? row.created_at : null);

  const atmDelivered = row.atm_delivered_date
    ? true
    : row.atm_received !== undefined
    ? !!row.atm_received
    : !!extra.atmDelivered;
  const atmDeliveredAt = row.atm_delivered_date || row.atm_received_at || extra.atmDeliveredAt || null;

  return {
    id: row.id,
    slNo: Number(row.customer_number || extra.slNo || 1001),
    accountOpeningDate: row.account_opening_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    customerName: row.full_name || "",
    guardianName: row.father_name || extra.guardianName || "",
    dob: row.dob || "",
    mobile: row.mobile_number || "",
    address: row.address || "",
    aadhaarNo: row.aadhaar_number || "",
    refNo: row.pin_code || extra.refNo || "",
    cifNo: row.customer_id_cif || extra.cifNo || "",
    accountNo: row.account_number || "",
    enrollAPY: row.include_apy !== undefined ? !!row.include_apy : !!extra.enrollAPY,
    enrollPMSBY: row.include_pmsby !== undefined ? !!row.include_pmsby : !!extra.enrollPMSBY,
    enrollPMJJBY: row.include_pmjjby !== undefined ? !!row.include_pmjjby : !!extra.enrollPMJJBY,

    passbookIssued: pbIssued,
    passbookIssuedAt: pbIssuedAt,
    passbookDelivered: pbDelivered,
    passbookDeliveredAt: pbDeliveredAt,

    atmIssued: atmIssued,
    atmIssuedAt: atmIssuedAt,
    atmDelivered: atmDelivered,
    atmDeliveredAt: atmDeliveredAt,

    notes: row.notes || "",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenant_code: "bob_csp",
    tenant_id: row.tenant_id || "bob_csp",
  };
}

export async function addBobCustomer(record: BobCustomerRecord): Promise<{ error: any; data?: any }> {
  const currentTenantId = getCurrentTenantId();
  const records = getBobCustomers();
  const existsIdx = records.findIndex(r => r.id === record.id);
  if (existsIdx >= 0) {
    records[existsIdx] = record;
  } else {
    records.unshift(record);
  }
  saveBobCustomers(records);

  try {
    const payload = mapBobCustomerToDb(record, currentTenantId);

    // 1. Primary insert to public.bob_customers with tenant_id
    let dbSuccess = false;
    try {
      const { data, error } = await (supabase as any)
        .from("bob_customers")
        .upsert([payload])
        .select();

      if (!error && data) {
        dbSuccess = true;
      } else if (error) {
        console.warn("bob_customers insert notice:", error.message);
      }
    } catch (e) {
      console.warn("bob_customers query error:", e);
    }

    // 2. Also sync to customers table scoped to tenant_code: 'bob_csp'
    try {
      const { error: custErr } = await supabase.from("customers").upsert([payload]);
      if (!custErr) dbSuccess = true;
    } catch (dbErr) {
      console.warn("customers table upsert error:", dbErr);
    }

    return { error: null, data: payload };
  } catch (err: any) {
    console.error("Error saving BOB customer to Supabase:", err);
    return { error: err };
  }
}

export async function updateBobCustomer(id: string, updates: Partial<BobCustomerRecord>): Promise<{ error: any }> {
  const currentTenantId = getCurrentTenantId();
  const records = getBobCustomers();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return { error: "Record not found" };

  const updated: BobCustomerRecord = {
    ...records[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  records[idx] = updated;
  saveBobCustomers(records);

  try {
    const payload = mapBobCustomerToDb(updated, currentTenantId);

    // Update bob_customers scoped to tenant_id
    try {
      await (supabase as any)
        .from("bob_customers")
        .update(payload)
        .eq("id", id)
        .eq("tenant_id", currentTenantId);
    } catch (e) {
      console.warn("bob_customers update error:", e);
    }

    // Update customers table
    try {
      await supabase
        .from("customers")
        .update(payload)
        .eq("id", id);
    } catch (e) {
      console.warn("customers table update error:", e);
    }

    return { error: null };
  } catch (err) {
    console.error("Error syncing BOB update to Supabase:", err);
    return { error: err };
  }
}

export async function deleteBobCustomer(id: string): Promise<{ error: any }> {
  const currentTenantId = getCurrentTenantId();
  // Optimistically remove from local storage immediately
  const records = getBobCustomers().filter(r => r.id !== id);
  saveBobCustomers(records);

  try {
    // Delete from bob_customers scoped to tenant_id and customers
    await Promise.allSettled([
      (supabase as any)
        .from("bob_customers")
        .delete()
        .eq("id", id)
        .eq("tenant_id", currentTenantId),
      supabase
        .from("customers")
        .delete()
        .eq("id", id)
        .eq("tenant_code", "bob_csp"),
    ]);

    return { error: null };
  } catch (err: any) {
    console.error("Error deleting BOB record from Supabase:", err);
    return { error: err };
  }
}

export async function fetchBobCustomersFromSupabase(): Promise<BobCustomerRecord[]> {
  const currentTenantId = getCurrentTenantId();
  try {
    let recordsData: any[] | null = null;

    // 1. Fetch from bob_customers strictly scoped to tenant_id
    try {
      const res = await (supabase as any)
        .from("bob_customers")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .order("created_at", { ascending: false });

      if (!res.error && res.data && res.data.length > 0) {
        recordsData = res.data;
      }
    } catch {
      // Fallback
    }

    // 2. Fallback to customers table
    if (!recordsData || recordsData.length === 0) {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("tenant_code", "bob_csp")
        .order("created_at", { ascending: false });

      if (!error && data) {
        recordsData = data;
      }
    }

    if (recordsData && recordsData.length > 0) {
      const mapped = recordsData.map(mapDbToBobCustomer);
      saveBobCustomers(mapped);
      return mapped;
    }

    return getBobCustomers();
  } catch (err) {
    console.error("Failed to fetch BOB data from Supabase:", err);
    return getBobCustomers();
  }
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
