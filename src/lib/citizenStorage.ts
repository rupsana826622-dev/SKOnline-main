import { supabase } from "./supabase";
import type { CitizenServiceRecord, CitizenSettings } from "@/types/citizen";
import { DEFAULT_CITIZEN_SETTINGS } from "@/types/citizen";

const STORAGE_KEYS = {
  records: "sk_online_citizen_services_new_csp",
  settings: "sk_online_citizen_settings_new_csp",
};

// ─── CITIZEN SETTINGS ─────────────────────────────────────────

export function getCitizenSettings(): CitizenSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_CITIZEN_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      serviceTypes: Array.isArray(parsed.serviceTypes) && parsed.serviceTypes.length > 0
        ? parsed.serviceTypes
        : DEFAULT_CITIZEN_SETTINGS.serviceTypes,
      stampSignatureUrl: parsed.stampSignatureUrl || DEFAULT_CITIZEN_SETTINGS.stampSignatureUrl,
      promotionalText: parsed.promotionalText || DEFAULT_CITIZEN_SETTINGS.promotionalText,
      centerName: parsed.centerName || DEFAULT_CITIZEN_SETTINGS.centerName,
      centerContact: parsed.centerContact || DEFAULT_CITIZEN_SETTINGS.centerContact,
      centerAddress: parsed.centerAddress || DEFAULT_CITIZEN_SETTINGS.centerAddress,
      tagline: parsed.tagline || DEFAULT_CITIZEN_SETTINGS.tagline,
    };
  } catch {
    return DEFAULT_CITIZEN_SETTINGS;
  }
}

export function saveCitizenSettings(settings: CitizenSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    window.dispatchEvent(new Event("citizen-settings-updated"));

    // Sync to Supabase system_settings row for new_csp
    supabase
      .from("system_settings")
      .upsert({
        id: "new_csp_config",
        bank_name: "SK ONLINE & CYBER ZONE",
        branch_name: settings.centerAddress || "Cyber Zone Branch",
        bc_agent_name: settings.centerName || "Abul",
        bc_agent_mobile: settings.centerContact || "",
        custom_logos: {
          citizen_settings: settings,
        },
      })
      .then(({ error }) => {
        if (error) console.error("Error saving citizen settings to Supabase:", error);
      });
  } catch (err) {
    console.error("Error in saveCitizenSettings:", err);
  }
}

// ─── CITIZEN SERVICE RECORDS ─────────────────────────────────

export function getCitizenRecords(): CitizenServiceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.records);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCitizenRecords(records: CitizenServiceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
    window.dispatchEvent(new Event("citizen-data-updated"));
  } catch (err) {
    console.error("Error saving citizen records to local storage:", err);
  }
}

export function getNextSerialNo(): number {
  const records = getCitizenRecords();
  if (records.length === 0) return 1001;
  const max = records.reduce((acc, r) => (r.serialNo > acc ? r.serialNo : acc), 1000);
  return max + 1;
}

// Map CitizenServiceRecord to/from Supabase customers table row
function mapCitizenRecordToDb(r: CitizenServiceRecord): Record<string, any> {
  return {
    id: r.id,
    created_at: r.createdAt || new Date().toISOString(),
    full_name: r.customerName || "",
    father_name: r.serviceType || "", // Store service type in father_name for quick inspection
    address: r.address || "",
    mobile_number: r.contactNo || "",
    pin_code: String(r.serialNo || ""),
    account_opening_date: r.applicationDate || "",
    account_number: r.appNumber || "",
    customer_id_cif: r.portalPassword || "", // Secure storage for passkey (only in operator db)
    status: r.status || "Applied",
    passbook_issued: r.status === "Delivered" || !!r.deliveredDate,
    passbook_issued_at: r.deliveredDate || null,
    passbook_received: r.status === "Issued" || r.status === "Delivered",
    passbook_received_at: r.issuedDate || null,
    annual_income: String(r.totalAmount || 0),
    profession: r.paymentMode || "Cash",
    category: r.paymentStatus || (r.dueAmount === 0 ? "Full Paid" : "Partial"),
    tenant_code: "new_csp",
    tenant_id: "new_csp",
    family_id: JSON.stringify({
      totalAmount: r.totalAmount,
      advancePaid: r.advancePaid,
      dueAmount: r.dueAmount,
      paymentMode: r.paymentMode,
      paymentStatus: r.paymentStatus,
      portalPassword: r.portalPassword,
      notes: r.notes,
      issuedDate: r.issuedDate,
      deliveredDate: r.deliveredDate,
    }),
  };
}

function mapDbToCitizenRecord(row: any): CitizenServiceRecord {
  let extra: any = {};
  if (row.family_id) {
    try {
      extra = JSON.parse(row.family_id);
    } catch {
      extra = {};
    }
  }

  const totalAmount = extra.totalAmount !== undefined ? Number(extra.totalAmount) : Number(row.annual_income || 0);
  const advancePaid = extra.advancePaid !== undefined ? Number(extra.advancePaid) : 0;
  const dueAmount = extra.dueAmount !== undefined ? Number(extra.dueAmount) : Math.max(0, totalAmount - advancePaid);
  const paymentMode = (extra.paymentMode || row.profession || "Cash") as "Cash" | "UPI";
  const paymentStatus = (extra.paymentStatus || row.category || (dueAmount === 0 ? "Full Paid" : "Partial")) as "Full Paid" | "Partial" | "Pending";

  return {
    id: row.id,
    serialNo: Number(row.pin_code) || 1001,
    customerName: row.full_name || "",
    contactNo: row.mobile_number || "",
    address: row.address || "",
    serviceType: row.father_name || "General Service",
    applicationDate: row.account_opening_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    appNumber: row.account_number || "",
    portalPassword: extra.portalPassword || row.customer_id_cif || "",
    totalAmount,
    advancePaid,
    dueAmount,
    paymentMode,
    paymentStatus,
    status: (row.status as any) || (row.passbook_issued ? "Delivered" : row.passbook_received ? "Issued" : "Applied"),
    issuedDate: extra.issuedDate || row.passbook_received_at || null,
    deliveredDate: extra.deliveredDate || row.passbook_issued_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: extra.notes || "",
    tenant_code: "new_csp",
  };
}

export async function addCitizenRecord(record: CitizenServiceRecord): Promise<{ error: any; data?: any }> {
  const records = getCitizenRecords();
  const existsIdx = records.findIndex(r => r.id === record.id);
  if (existsIdx >= 0) {
    records[existsIdx] = record;
  } else {
    records.unshift(record);
  }
  saveCitizenRecords(records);

  try {
    const payload = mapCitizenRecordToDb(record);

    // 1. Insert into customers table (scoped to tenant_code: 'new_csp')
    const { error: custErr } = await supabase.from("customers").upsert([payload]);
    if (custErr) {
      console.warn("customers table upsert error:", custErr);
    }

    // 2. Also insert into citizen_services table if table exists
    try {
      await (supabase as any).from("citizen_services").upsert([payload]);
    } catch (e) {
      // Ignored
    }

    return { error: null, data: payload };
  } catch (err: any) {
    console.error("Network error syncing citizen record to Supabase:", err);
    return { error: err };
  }
}

export async function updateCitizenRecord(id: string, updates: Partial<CitizenServiceRecord>): Promise<{ error: any }> {
  const records = getCitizenRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return { error: "Record not found" };

  const updated: CitizenServiceRecord = {
    ...records[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Auto calculate due amount if amounts were updated
  if (updates.totalAmount !== undefined || updates.advancePaid !== undefined) {
    const total = updates.totalAmount !== undefined ? updates.totalAmount : updated.totalAmount;
    const adv = updates.advancePaid !== undefined ? updates.advancePaid : updated.advancePaid;
    updated.dueAmount = Math.max(0, total - adv);
    updated.paymentStatus = updated.dueAmount === 0 ? "Full Paid" : adv > 0 ? "Partial" : "Pending";
  }

  records[idx] = updated;
  saveCitizenRecords(records);

  try {
    const payload = mapCitizenRecordToDb(updated);
    await supabase
      .from("customers")
      .update(payload)
      .eq("id", id);

    try {
      await (supabase as any)
        .from("citizen_services")
        .update(payload)
        .eq("id", id);
    } catch {
      // Ignored
    }

    return { error: null };
  } catch (err) {
    console.error("Error syncing citizen update to Supabase:", err);
    return { error: err };
  }
}

export async function settleCitizenDue(id: string, paymentMode: "Cash" | "UPI"): Promise<{ error: any }> {
  const records = getCitizenRecords();
  const target = records.find(r => r.id === id);
  if (!target) return { error: "Record not found" };

  return updateCitizenRecord(id, {
    advancePaid: target.totalAmount,
    dueAmount: 0,
    paymentMode,
    paymentStatus: "Full Paid",
  });
}

export async function deleteCitizenRecord(id: string): Promise<{ error: any }> {
  // Optimistically remove from local storage immediately
  const records = getCitizenRecords().filter(r => r.id !== id);
  saveCitizenRecords(records);

  try {
    // Explicit Supabase deletion for citizen_services and customers tables
    await Promise.allSettled([
      (supabase as any).from("citizen_services").delete().eq("id", id),
      supabase.from("customers").delete().eq("id", id).eq("tenant_code", "new_csp")
    ]);

    return { error: null };
  } catch (err: any) {
    console.error("Error deleting citizen record from Supabase:", err);
    return { error: err };
  }
}

export async function fetchCitizenRecordsFromSupabase(): Promise<CitizenServiceRecord[]> {
  try {
    let recordsData: any[] | null = null;

    // 1. Try citizen_services table
    try {
      const res = await (supabase as any)
        .from("citizen_services")
        .select("*")
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
        .eq("tenant_code", "new_csp")
        .order("created_at", { ascending: false });

      if (!error && data) {
        recordsData = data;
      }
    }

    if (recordsData && recordsData.length > 0) {
      const mapped = recordsData.map(mapDbToCitizenRecord);
      saveCitizenRecords(mapped);
      return mapped;
    }

    return getCitizenRecords();
  } catch (err) {
    console.error("Failed to fetch citizen data from Supabase:", err);
    return getCitizenRecords();
  }
}

export async function syncCitizenFromSupabase(): Promise<void> {
  try {
    // 1. Sync Settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", "new_csp_config")
      .maybeSingle();

    if (settingsData?.custom_logos?.citizen_settings) {
      const liveSettings = settingsData.custom_logos.citizen_settings;
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(liveSettings));
      window.dispatchEvent(new Event("citizen-settings-updated"));
    }

    // 2. Sync Records
    await fetchCitizenRecordsFromSupabase();
  } catch (err) {
    console.warn("Failed to sync citizen data from Supabase:", err);
  }
}
