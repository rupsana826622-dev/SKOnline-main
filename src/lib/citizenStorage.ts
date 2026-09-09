import { supabase } from "./supabase";
import type { CitizenServiceRecord, CitizenSettings } from "@/types/citizen";
import { DEFAULT_CITIZEN_SETTINGS, DEFAULT_CITIZEN_SERVICES } from "@/types/citizen";
import { getSession } from "./storage";
import { toast } from "sonner";

const STORAGE_KEYS = {
  records: "sk_online_citizen_services_new_csp",
  settings: "sk_online_citizen_settings_new_csp",
};

export function getCurrentCitizenTenantId(): string {
  const session = getSession();
  return session?.tenantId || session?.tenantCode || "new_csp";
}

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

/**
 * Upload authorized Stamp/Signature to Supabase Storage
 */
export async function uploadCitizenStamp(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `citizen_stamp_${Date.now()}_${cleanFileName}`;

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
    console.error("Unexpected error in uploadCitizenStamp:", err);
    alert(`Upload Error: ${err.message || "Unknown error"}`);
    toast.error(`Upload Error: ${err.message || "Unknown error"}`);
    return { url: null, error: err };
  }
}

/**
 * Persist Citizen Hub settings directly to Supabase public.citizen_settings & system_settings
 */
export async function saveCitizenSettingsAsync(settings: CitizenSettings): Promise<{ error: any; data?: any }> {
  const tenantId = getCurrentCitizenTenantId();

  // Optimistically update local cache
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  window.dispatchEvent(new Event("citizen-settings-updated"));

  const payload = {
    tenant_id: tenantId,
    stamp_signature_url: settings.stampSignatureUrl,
    promotional_text: settings.promotionalText,
    center_name: settings.centerName,
    center_contact: settings.centerContact,
    center_address: settings.centerAddress,
    tagline: settings.tagline || "Digital Citizen Services & Customer Care",
    service_types: settings.serviceTypes,
    updated_at: new Date().toISOString(),
  };

  let primaryError: any = null;

  try {
    // 1. Direct write to public.citizen_settings
    const { data: citizenData, error: citizenError } = await (supabase as any)
      .from("citizen_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select();

    if (citizenError) {
      primaryError = citizenError;
      console.warn("citizen_settings table upsert error (will also try system_settings):", citizenError);
    }

    // 2. Also persist to public.system_settings
    const { error: sysError } = await supabase
      .from("system_settings")
      .upsert({
        id: "new_csp_config",
        bank_name: settings.centerName || "SK ONLINE & CYBER ZONE",
        branch_name: settings.centerAddress || "Cyber Zone Branch",
        bc_agent_name: settings.centerName || "Abul",
        bc_agent_mobile: settings.centerContact || "",
        custom_logos: {
          citizen_settings: settings,
        },
      });

    if (primaryError && sysError) {
      console.error("CRITICAL: citizen_settings save failed:", primaryError || sysError);
      const msg = `SUPABASE ERROR (Settings): ${(primaryError || sysError).message} | Code: ${(primaryError || sysError).code || "ERR"}`;
      alert(msg);
      toast.error(msg);
      throw primaryError || sysError;
    }

    return { error: null, data: citizenData };
  } catch (err: any) {
    console.error("CRITICAL: citizen_settings save failed:", err);
    const msg = `SUPABASE ERROR (Settings): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
  }
}

export function saveCitizenSettings(settings: CitizenSettings): void {
  saveCitizenSettingsAsync(settings);
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
    console.error("Error saving citizen records to local cache:", err);
  }
}

export function getNextSerialNo(): number {
  const records = getCitizenRecords();
  if (records.length === 0) return 1;
  const max = records.reduce((acc, r) => (r.serialNo > acc ? r.serialNo : acc), 0);
  return max + 1;
}

// Map CitizenServiceRecord to/from Supabase tables
function mapCitizenRecordToDb(r: CitizenServiceRecord): Record<string, any> {
  const tenantId = getCurrentCitizenTenantId();
  return {
    id: r.id,
    created_at: r.createdAt || new Date().toISOString(),
    full_name: r.customerName || "",
    father_name: r.serviceType || "", // Service type
    address: r.address || "",
    mobile_number: r.contactNo || "",
    pin_code: String(r.serialNo || 1),
    account_opening_date: r.applicationDate || "",
    account_number: r.appNumber || "",
    customer_id_cif: r.portalPassword || "",
    final_service_no: r.finalServiceNo || "",
    document_file_url: r.documentFileUrl || "",
    status: r.status || "Applied",
    passbook_issued: r.status === "Delivered" || !!r.deliveredDate,
    passbook_issued_at: r.deliveredDate || null,
    passbook_received: r.status === "Issued" || r.status === "Delivered",
    passbook_received_at: r.issuedDate || null,
    annual_income: String(r.totalAmount || 0),
    profession: r.paymentMode || "Cash",
    category: r.paymentStatus || (r.dueAmount === 0 ? "Full Paid" : "Partial"),
    tenant_code: "new_csp",
    tenant_id: tenantId,
    family_id: JSON.stringify({
      totalAmount: r.totalAmount,
      advancePaid: r.advancePaid,
      dueAmount: r.dueAmount,
      paymentMode: r.paymentMode,
      paymentStatus: r.paymentStatus,
      portalPassword: r.portalPassword,
      finalServiceNo: r.finalServiceNo,
      documentFileUrl: r.documentFileUrl,
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
      extra = typeof row.family_id === "string" ? JSON.parse(row.family_id) : row.family_id;
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
    serialNo: Number(row.pin_code || row.sl_no || row.serial_no || 1) || 1,
    customerName: row.full_name || row.customer_name || "",
    contactNo: row.mobile_number || row.mobile || "",
    address: row.address || "",
    serviceType: row.father_name || row.service_type || "General Service",
    applicationDate: row.account_opening_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    appNumber: row.account_number || row.app_number || "",
    portalPassword: extra.portalPassword || row.customer_id_cif || row.portal_password || "",
    finalServiceNo: extra.finalServiceNo || row.final_service_no || "",
    documentFileUrl: extra.documentFileUrl || row.document_file_url || "",
    totalAmount,
    advancePaid,
    dueAmount,
    paymentMode,
    paymentStatus,
    status: (row.status as any) || (row.passbook_issued ? "Delivered" : row.passbook_received ? "Issued" : "Applied"),
    issuedDate: extra.issuedDate || row.passbook_received_at || null,
    deliveredDate: extra.deliveredDate || row.passbook_issued_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    notes: extra.notes || row.notes || "",
    tenant_code: "new_csp",
  };
}

/**
 * Direct Add/Insert into Supabase with Strict Error Handling
 */
export async function addCitizenRecord(record: CitizenServiceRecord): Promise<{ error: any; data?: any }> {
  const payload = mapCitizenRecordToDb(record);

  try {
    let insertErr: any = null;
    let insertedData: any = null;

    // 1. Try citizen_services table
    try {
      const res = await (supabase as any)
        .from("citizen_services")
        .insert([payload])
        .select();

      if (res.error) {
        insertErr = res.error;
      } else {
        insertedData = res.data;
        insertErr = null;
      }
    } catch (e) {
      insertErr = e;
    }

    // 2. Also write to customers table scoped to tenant_code: 'new_csp'
    const { error: custErr, data: custData } = await supabase
      .from("customers")
      .upsert([payload])
      .select();

    if (insertErr && custErr) {
      console.error("CRITICAL: citizen record insert failed on both tables:", insertErr || custErr);
      const msg = `SUPABASE ERROR (Add Record): ${(insertErr || custErr).message} | Code: ${(insertErr || custErr).code || "ERR"}`;
      alert(msg);
      toast.error(msg);
      throw insertErr || custErr;
    }

    // Sync live from Supabase
    await fetchCitizenRecordsFromSupabase();
    return { error: null, data: insertedData || custData };
  } catch (err: any) {
    console.error("Supabase Citizen Insert Error:", err);
    const msg = `SUPABASE ERROR (Add Record): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
  }
}

/**
 * Direct Update in Supabase with Strict Error Handling
 */
export async function updateCitizenRecord(id: string, updates: Partial<CitizenServiceRecord>): Promise<{ error: any }> {
  const records = getCitizenRecords();
  const existing = records.find(r => r.id === id);

  const updated: CitizenServiceRecord = {
    ...(existing || {} as any),
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  // Auto calculate due amount if amounts were updated
  if (updates.totalAmount !== undefined || updates.advancePaid !== undefined) {
    const total = updates.totalAmount !== undefined ? updates.totalAmount : updated.totalAmount;
    const adv = updates.advancePaid !== undefined ? updates.advancePaid : updated.advancePaid;
    updated.dueAmount = Math.max(0, total - adv);
    updated.paymentStatus = updated.dueAmount === 0 ? "Full Paid" : adv > 0 ? "Partial" : "Pending";
  }

  const payload = mapCitizenRecordToDb(updated);

  try {
    let updateErr: any = null;

    try {
      const res = await (supabase as any)
        .from("citizen_services")
        .update(payload)
        .eq("id", id);
      if (res.error) updateErr = res.error;
    } catch (e) {
      updateErr = e;
    }

    const { error: custErr } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", id);

    if (updateErr && custErr) {
      console.error("CRITICAL: citizen record update failed:", updateErr || custErr);
      const msg = `SUPABASE ERROR (Update Record): ${(updateErr || custErr).message} | Code: ${(updateErr || custErr).code || "ERR"}`;
      alert(msg);
      toast.error(msg);
      throw updateErr || custErr;
    }

    // Sync live from Supabase
    await fetchCitizenRecordsFromSupabase();
    return { error: null };
  } catch (err: any) {
    console.error("Supabase Citizen Update Error:", err);
    const msg = `SUPABASE ERROR (Update Record): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
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

/**
 * Direct Delete from Supabase with Strict Error Handling
 */
export async function deleteCitizenRecord(id: string): Promise<{ error: any }> {
  const tenantId = getCurrentCitizenTenantId();

  try {
    let delErr: any = null;
    try {
      const res = await (supabase as any).from("citizen_services").delete().eq("id", id);
      if (res.error) delErr = res.error;
    } catch (e) {
      delErr = e;
    }

    const { error: custErr } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("tenant_code", "new_csp");

    if (delErr && custErr) {
      console.error("CRITICAL: citizen record delete failed:", delErr || custErr);
      const msg = `SUPABASE ERROR (Delete Record): ${(delErr || custErr).message}`;
      alert(msg);
      toast.error(msg);
      throw delErr || custErr;
    }

    // Refresh live records
    await fetchCitizenRecordsFromSupabase();
    return { error: null };
  } catch (err: any) {
    console.error("Supabase Citizen Delete Error:", err);
    const msg = `SUPABASE ERROR (Delete Record): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
  }
}

/**
 * Direct Select from Supabase — No Dummy Seeds, returns exact DB rows
 */
export async function fetchCitizenRecordsFromSupabase(): Promise<CitizenServiceRecord[]> {
  try {
    let recordsData: any[] | null = null;
    let queryErr: any = null;

    // 1. Try citizen_services table
    try {
      const res = await (supabase as any)
        .from("citizen_services")
        .select("*")
        .order("created_at", { ascending: false });

      if (!res.error && res.data) {
        recordsData = res.data;
      } else if (res.error) {
        queryErr = res.error;
      }
    } catch (e) {
      queryErr = e;
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
        queryErr = null;
      } else if (error) {
        queryErr = error;
      }
    }

    if (queryErr && (!recordsData || recordsData.length === 0)) {
      console.error("Supabase Citizen Select Error:", queryErr);
      toast.error(`Database Error (Citizen Services): ${queryErr.message || "Failed to load records"}`);
    }

    const mapped = (recordsData || []).map(mapDbToCitizenRecord);
    saveCitizenRecords(mapped);
    return mapped;
  } catch (err: any) {
    console.error("Failed to fetch citizen data from Supabase:", err);
    saveCitizenRecords([]);
    return [];
  }
}

export async function syncCitizenFromSupabase(): Promise<void> {
  const tenantId = getCurrentCitizenTenantId();

  try {
    // 1. Sync Settings: Try public.citizen_settings first
    let liveSettings: CitizenSettings | null = null;
    try {
      const { data, error } = await (supabase as any)
        .from("citizen_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!error && data) {
        liveSettings = {
          serviceTypes: Array.isArray(data.service_types) && data.service_types.length > 0
            ? data.service_types
            : DEFAULT_CITIZEN_SERVICES,
          stampSignatureUrl: data.stamp_signature_url || "",
          promotionalText: data.promotional_text || DEFAULT_CITIZEN_SETTINGS.promotionalText,
          centerName: data.center_name || DEFAULT_CITIZEN_SETTINGS.centerName,
          centerContact: data.center_contact || DEFAULT_CITIZEN_SETTINGS.centerContact,
          centerAddress: data.center_address || DEFAULT_CITIZEN_SETTINGS.centerAddress,
          tagline: data.tagline || DEFAULT_CITIZEN_SETTINGS.tagline,
        };
      }
    } catch {
      // Fallback
    }

    // Fallback to system_settings config row
    if (!liveSettings) {
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", "new_csp_config")
        .maybeSingle();

      if (settingsData?.custom_logos?.citizen_settings) {
        liveSettings = {
          ...DEFAULT_CITIZEN_SETTINGS,
          ...settingsData.custom_logos.citizen_settings,
        };
      }
    }

    if (liveSettings) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(liveSettings));
      window.dispatchEvent(new Event("citizen-settings-updated"));
    }

    // 2. Sync Records
    await fetchCitizenRecordsFromSupabase();
  } catch (err) {
    console.warn("Failed to sync citizen data from Supabase:", err);
  }
}

/**
 * Upload a document (e-PAN PDF, Acknowledgement, Certificate) to Supabase Storage bucket 'citizen-documents'
 */
export async function uploadCitizenDocument(
  file: File,
  recordId?: string
): Promise<{ url: string | null; error: any }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${recordId || "doc"}_${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from("citizen-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      const msg = `Storage Upload Failed: ${error.message}`;
      alert(msg);
      toast.error(msg);
      return { url: null, error };
    }

    const { data: publicUrlData } = supabase.storage
      .from("citizen-documents")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || null;
    return { url: publicUrl, error: null };
  } catch (err: any) {
    console.error("Unexpected error in uploadCitizenDocument:", err);
    alert(`Upload Error: ${err.message || "Failed to upload"}`);
    toast.error(`Upload Error: ${err.message || "Failed to upload"}`);
    return { url: null, error: err };
  }
}
