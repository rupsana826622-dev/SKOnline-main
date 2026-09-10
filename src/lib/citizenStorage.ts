import { supabase } from "./supabase";
import type { CitizenServiceRecord, CitizenSettings } from "@/types/citizen";
import { DEFAULT_CITIZEN_SETTINGS, DEFAULT_CITIZEN_SERVICES } from "@/types/citizen";
import { getSession } from "./storage";
import { sanitizeDob } from "./utils";
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
 * Persist Citizen Hub settings directly to Supabase public.system_settings & public.citizen_settings
 */
export async function saveCitizenSettingsAsync(settings: CitizenSettings): Promise<{ error: any; data?: any }> {
  const tenantId = getCurrentCitizenTenantId();

  // Optimistically update local cache
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  window.dispatchEvent(new Event("citizen-settings-updated"));

  const stampUrl = settings.stampSignatureUrl || "";
  const promoText = settings.promotionalText || "";
  const dynamicServicesList = settings.serviceTypes || DEFAULT_CITIZEN_SERVICES;

  let lastError: any = null;

  // 1. Commit all updates directly to public.system_settings under id = 'new_csp_config'
  try {
    const { error: sysError } = await supabase
      .from("system_settings")
      .upsert({
        id: "new_csp_config",
        tenant_id: tenantId,
        bank_name: settings.centerName || "SK ONLINE & CYBER ZONE",
        branch_name: settings.centerAddress || "Cyber Zone Branch",
        bc_agent_name: settings.centerName || "Abul",
        bc_agent_mobile: settings.centerContact || "",
        custom_logos: {
          citizen_settings: {
            stamp_url: stampUrl,
            stampSignatureUrl: stampUrl,
            promotional_text: promoText,
            promotionalText: promoText,
            service_types: dynamicServicesList,
            serviceTypes: dynamicServicesList,
            center_name: settings.centerName,
            centerName: settings.centerName,
            center_contact: settings.centerContact,
            centerContact: settings.centerContact,
            center_address: settings.centerAddress,
            centerAddress: settings.centerAddress,
            tagline: settings.tagline || "Digital Citizen Services & Customer Care",
          },
        },
        updated_at: new Date().toISOString(),
      });

    if (sysError) {
      console.warn("system_settings upsert error:", sysError);
      lastError = sysError;
    }
  } catch (e) {
    lastError = e;
  }

  // 2. Also write to public.citizen_settings with onConflict: tenant_id
  try {
    const { error: citizenError } = await (supabase as any)
      .from("citizen_settings")
      .upsert({
        tenant_id: tenantId,
        stamp_signature_url: stampUrl,
        promotional_text: promoText,
        center_name: settings.centerName,
        center_contact: settings.centerContact,
        center_address: settings.centerAddress,
        tagline: settings.tagline || "Digital Citizen Services & Customer Care",
        service_types: dynamicServicesList,
        updated_at: new Date().toISOString(),
      }, { onConflict: "tenant_id" });

    if (citizenError) {
      console.warn("citizen_settings upsert warning:", citizenError);
    } else {
      lastError = null; // Successfully committed to citizen_settings
    }
  } catch {
    // Non-fatal if citizen_settings table doesn't exist
  }

  // 3. Also persist dynamic services to public.citizen_service_types if table exists
  try {
    if (Array.isArray(dynamicServicesList) && dynamicServicesList.length > 0) {
      for (const st of dynamicServicesList) {
        await (supabase as any)
          .from("citizen_service_types")
          .upsert({
            tenant_id: tenantId,
            service_name: st,
            name: st,
          }, { onConflict: "tenant_id,service_name" });
      }
    }
  } catch {
    // Non-fatal
  }

  if (lastError) {
    console.error("CRITICAL: citizen settings save failed:", lastError);
    const msg = `SUPABASE ERROR (Settings): ${lastError.message || "Save Error"} | Code: ${lastError.code || "ERR"}`;
    alert(msg);
    toast.error(msg);
    throw lastError;
  }

  return { error: null };
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

/**
 * Build a FULL insert payload for new citizen_services records.
 * Maps all CitizenServiceRecord fields to valid public.citizen_services columns.
 */
function sanitizeCitizenPayload(r: Partial<CitizenServiceRecord> & Record<string, any>): Record<string, any> {
  const tenantId = getCurrentCitizenTenantId();
  const totalAmount = Number(r.totalAmount ?? r.total_amount ?? 0) || 0;
  const advanceAmount = Number(r.advancePaid ?? r.advance_amount ?? r.advance_paid ?? 0) || 0;
  const dueAmount = r.dueAmount !== undefined
    ? Number(r.dueAmount)
    : r.due_amount !== undefined
    ? Number(r.due_amount)
    : Math.max(0, totalAmount - advanceAmount);

  const payload: Record<string, any> = {
    tenant_id: tenantId,
    serial_no: Number(r.serialNo ?? r.serial_no) || 1,
    customer_name: (r.customerName ?? r.customer_name)?.trim() || "",
    contact_no: (r.contactNo ?? r.contact_no ?? r.mobile)?.trim() || null,
    address: (r.address)?.trim() || null,
    service_type: (r.serviceType ?? r.service_type)?.trim() || "General",
    application_date: sanitizeDob(r.applicationDate ?? r.application_date) || new Date().toISOString().split("T")[0],
    app_user_id: (r.appNumber ?? r.app_user_id ?? r.app_number)?.trim() || null,
    app_password: (r.portalPassword ?? r.app_password ?? r.portal_password)?.trim() || null,
    final_service_no: (r.finalServiceNo ?? r.final_service_no)?.trim() || null,
    document_file_url: (r.documentFileUrl ?? r.document_file_url) || null,
    total_amount: totalAmount,
    advance_amount: advanceAmount,
    due_amount: dueAmount,
    payment_mode: (r.paymentMode ?? r.payment_mode) || "Cash",
    payment_status: dueAmount <= 0 ? "Full Paid" : "Due",
  };

  if (r.issuedDate !== undefined || r.issued_date !== undefined) {
    payload.issued_date = sanitizeDob(r.issuedDate ?? r.issued_date);
  }
  if (r.deliveredDate !== undefined || r.delivered_date !== undefined || r.delivery_date !== undefined || r.deliveryDate !== undefined) {
    const dVal = sanitizeDob(r.deliveredDate ?? r.delivered_date ?? r.delivery_date ?? r.deliveryDate);
    payload.delivered_date = dVal;
    payload.delivery_date = dVal;
  }

  return payload;
}

/**
 * Build a PARTIAL update payload — only maps keys that were explicitly provided.
 * Safe for partial updates (e.g. settle due, mark issued) without overwriting
 * other columns in the database.
 */
function sanitizePartialCitizenPayload(r: Partial<CitizenServiceRecord> & Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};

  // Payment / financial fields
  if (r.advancePaid !== undefined || r.advance_amount !== undefined) {
    payload.advance_amount = Number(r.advancePaid ?? r.advance_amount ?? 0);
  }
  if (r.dueAmount !== undefined || r.due_amount !== undefined) {
    const due = Number(r.dueAmount ?? r.due_amount ?? 0);
    payload.due_amount = due;
    payload.payment_status = due <= 0 ? "Full Paid" : "Due";
  }
  if (r.totalAmount !== undefined || r.total_amount !== undefined) {
    payload.total_amount = Number(r.totalAmount ?? r.total_amount ?? 0);
  }
  if (r.paymentMode !== undefined || r.payment_mode !== undefined) {
    payload.payment_mode = r.paymentMode ?? r.payment_mode ?? "Cash";
  }
  if (r.paymentStatus !== undefined || r.payment_status !== undefined) {
    payload.payment_status = r.paymentStatus ?? r.payment_status;
  }

  // Identity / service fields
  if (r.customerName !== undefined || r.customer_name !== undefined) {
    payload.customer_name = (r.customerName ?? r.customer_name)?.trim() || "";
  }
  if (r.contactNo !== undefined || r.contact_no !== undefined) {
    payload.contact_no = (r.contactNo ?? r.contact_no)?.trim() || null;
  }
  if (r.address !== undefined) {
    payload.address = r.address?.trim() || null;
  }
  if (r.serviceType !== undefined || r.service_type !== undefined) {
    payload.service_type = (r.serviceType ?? r.service_type)?.trim() || "General";
  }
  if (r.applicationDate !== undefined || r.application_date !== undefined) {
    payload.application_date = sanitizeDob(r.applicationDate ?? r.application_date) || new Date().toISOString().split("T")[0];
  }
  if (r.appNumber !== undefined || r.app_user_id !== undefined) {
    payload.app_user_id = (r.appNumber ?? r.app_user_id)?.trim() || null;
  }
  if (r.portalPassword !== undefined || r.app_password !== undefined) {
    payload.app_password = (r.portalPassword ?? r.app_password)?.trim() || null;
  }
  if (r.finalServiceNo !== undefined || r.final_service_no !== undefined) {
    payload.final_service_no = (r.finalServiceNo ?? r.final_service_no)?.trim() || null;
  }
  if (r.documentFileUrl !== undefined || r.document_file_url !== undefined) {
    payload.document_file_url = r.documentFileUrl ?? r.document_file_url ?? null;
  }
  if (r.serialNo !== undefined || r.serial_no !== undefined) {
    payload.serial_no = Number(r.serialNo ?? r.serial_no) || 1;
  }

  // Delivery milestone fields
  if (r.issuedDate !== undefined || r.issued_date !== undefined) {
    payload.issued_date = sanitizeDob(r.issuedDate ?? r.issued_date);
  }
  if (r.deliveredDate !== undefined || r.delivered_date !== undefined || r.delivery_date !== undefined || r.deliveryDate !== undefined) {
    const dVal = sanitizeDob(r.deliveredDate ?? r.delivered_date ?? r.delivery_date ?? r.deliveryDate);
    payload.delivered_date = dVal;
    payload.delivery_date = dVal;
  }
  if (r.status !== undefined) {
    payload.status = r.status;
  }
  if (r.notes !== undefined) {
    payload.notes = r.notes;
  }

  // Do NOT append updated_at: citizen_services table does not have updated_at in schema cache
  return payload;
}

function mapDbToCitizenRecord(row: any): CitizenServiceRecord {
  const totalAmount = Number(row.total_amount ?? 0);
  const advancePaid = Number(row.advance_amount ?? row.advance_paid ?? 0);
  const dueAmount = Number(row.due_amount ?? Math.max(0, totalAmount - advancePaid));
  const paymentMode = (row.payment_mode || "Cash") as "Cash" | "UPI";
  const paymentStatus = (row.payment_status === "Due" ? "Partial" : row.payment_status || (dueAmount <= 0 ? "Full Paid" : "Partial")) as "Full Paid" | "Partial" | "Pending";

  return {
    id: row.id,
    serialNo: Number(row.serial_no || row.sl_no || 1) || 1,
    customerName: row.customer_name || "",
    contactNo: row.contact_no || row.mobile || "",
    address: row.address || "",
    serviceType: row.service_type || "General",
    applicationDate: row.application_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    appNumber: row.app_user_id || row.app_number || "",
    portalPassword: row.app_password || row.portal_password || "",
    finalServiceNo: row.final_service_no || "",
    documentFileUrl: row.document_file_url || "",
    totalAmount,
    advancePaid,
    dueAmount,
    paymentMode,
    paymentStatus,
    status: (row.status as any) || (dueAmount <= 0 ? "Delivered" : "Applied"),
    issuedDate: row.issued_date || null,
    deliveredDate: row.delivered_date || row.delivery_date || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    notes: row.notes || "",
    tenant_code: "new_csp",
  };
}

/**
 * Direct Add/Insert strictly into Supabase public.citizen_services
 */
export async function addCitizenRecord(record: CitizenServiceRecord): Promise<{ error: any; data?: any }> {
  const payload = sanitizeCitizenPayload(record);
  delete payload.updated_at;

  try {
    let { data, error } = await (supabase as any)
      .from("citizen_services")
      .insert([payload])
      .select();

    if (error && error.code === "PGRST204") {
      console.warn("PGRST204 on citizen insert - retrying with alternate column payload", error);
      // If delivered_date or delivery_date was unknown, fallback
      if (payload.delivered_date !== undefined && payload.delivery_date !== undefined) {
        const payloadDeliveryOnly = { ...payload };
        delete payloadDeliveryOnly.delivered_date;
        const retry1 = await (supabase as any)
          .from("citizen_services")
          .insert([payloadDeliveryOnly])
          .select();
        if (!retry1.error) {
          data = retry1.data;
          error = null;
        } else {
          const payloadDeliveredOnly = { ...payload };
          delete payloadDeliveredOnly.delivery_date;
          const retry2 = await (supabase as any)
            .from("citizen_services")
            .insert([payloadDeliveredOnly])
            .select();
          data = retry2.data;
          error = retry2.error;
        }
      }
    }

    if (error) {
      console.error("Insert citizen_services failure:", error);
      const msg = `Supabase Error (${error.code}): ${error.message}`;
      alert(msg);
      toast.error(msg);
      throw error;
    }

    // Sync live from Supabase
    await fetchCitizenRecordsFromSupabase();
    return { error: null, data: data ? data[0] : null };
  } catch (err: any) {
    console.error("Supabase Citizen Insert Error:", err);
    throw err;
  }
}

/**
 * Direct Update strictly in Supabase public.citizen_services.
 * Uses partial payload mapper — only sends fields that were explicitly provided,
 * preventing null overwrites of existing database values.
 */
export async function updateCitizenRecord(id: string, updates: Partial<CitizenServiceRecord>): Promise<{ error: any }> {
  const tenantId = getCurrentCitizenTenantId();
  // Use partial mapper to avoid overwriting untouched columns
  const payload = sanitizePartialCitizenPayload(updates as any);
  delete payload.updated_at;

  try {
    let { error } = await (supabase as any)
      .from("citizen_services")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error && error.code === "PGRST204") {
      console.warn("PGRST204 on citizen update - retrying with alternate column payload", error);
      // If payload contained both delivery_date and delivered_date, try one by one
      if (payload.delivered_date !== undefined && payload.delivery_date !== undefined) {
        const payloadDeliveryOnly = { ...payload };
        delete payloadDeliveryOnly.delivered_date;
        const retry1 = await (supabase as any)
          .from("citizen_services")
          .update(payloadDeliveryOnly)
          .eq("id", id)
          .eq("tenant_id", tenantId);
        
        if (!retry1.error) {
          error = null;
        } else {
          const payloadDeliveredOnly = { ...payload };
          delete payloadDeliveredOnly.delivery_date;
          const retry2 = await (supabase as any)
            .from("citizen_services")
            .update(payloadDeliveredOnly)
            .eq("id", id)
            .eq("tenant_id", tenantId);
          error = retry2.error;
        }
      } else {
        const cleanPayload = { ...payload };
        delete cleanPayload.updated_at;
        delete cleanPayload.created_at;
        const retry = await (supabase as any)
          .from("citizen_services")
          .update(cleanPayload)
          .eq("id", id)
          .eq("tenant_id", tenantId);
        error = retry.error;
      }
    }

    if (error) {
      console.error("Update citizen_services failure:", error);
      const msg = `Supabase Error (${error.code}): ${error.message}`;
      alert(msg);
      toast.error(msg);
      throw error;
    }

    // Sync live from Supabase to refresh local cache
    await fetchCitizenRecordsFromSupabase();
    return { error: null };
  } catch (err: any) {
    console.error("Supabase Citizen Update Error:", err);
    throw err;
  }
}

export async function settleCitizenDue(id: string, paymentMode: "Cash" | "UPI" = "Cash"): Promise<{ error: any }> {
  const tenantId = getCurrentCitizenTenantId();
  const records = getCitizenRecords();
  const target = records.find(r => r.id === id);
  const total = target ? Number(target.totalAmount || 0) : 0;

  try {
    const payload: Record<string, any> = {
      advance_amount: total,
      due_amount: 0,
      payment_status: "Full Paid",
      payment_mode: paymentMode,
    };
    delete payload.updated_at;

    const { error } = await (supabase as any)
      .from("citizen_services")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("Settle due error:", error);
      const msg = `Supabase Error (${error.code}): ${error.message}`;
      alert(msg);
      toast.error(msg);
      throw error;
    }

    await fetchCitizenRecordsFromSupabase();
    return { error: null };
  } catch (err: any) {
    console.error("Failed to settle citizen due:", err);
    throw err;
  }
}

/**
 * Direct Delete strictly from Supabase public.citizen_services
 */
export async function deleteCitizenRecord(id: string): Promise<{ error: any }> {
  const tenantId = getCurrentCitizenTenantId();

  try {
    const { error } = await (supabase as any)
      .from("citizen_services")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("Delete citizen_services failure:", error);
      const msg = `Supabase Error (${error.code}): ${error.message}`;
      alert(msg);
      toast.error(msg);
      throw error;
    }

    // Refresh live records
    await fetchCitizenRecordsFromSupabase();
    return { error: null };
  } catch (err: any) {
    console.error("Supabase Citizen Delete Error:", err);
    throw err;
  }
}

/**
 * Direct Select strictly from Supabase public.citizen_services scoped to tenant_id
 */
export async function fetchCitizenRecordsFromSupabase(): Promise<CitizenServiceRecord[]> {
  const tenantId = getCurrentCitizenTenantId();

  try {
    const { data, error } = await (supabase as any)
      .from("citizen_services")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Citizen Services Select Error:", error);
      toast.error(`Database Error (Citizen Services): ${error.message}`);
      saveCitizenRecords([]);
      return [];
    }

    const mapped = (data || []).map(mapDbToCitizenRecord);
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
    let liveSettings: CitizenSettings | null = null;

    // 1. Read from system_settings row new_csp_config first
    try {
      const { data: sysData, error: sysError } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", "new_csp_config")
        .maybeSingle();

      if (!sysError && sysData?.custom_logos?.citizen_settings) {
        const cs = sysData.custom_logos.citizen_settings;
        liveSettings = {
          serviceTypes: Array.isArray(cs.service_types || cs.serviceTypes) && (cs.service_types || cs.serviceTypes).length > 0
            ? (cs.service_types || cs.serviceTypes)
            : DEFAULT_CITIZEN_SERVICES,
          stampSignatureUrl: cs.stamp_url || cs.stampSignatureUrl || "",
          promotionalText: cs.promotional_text || cs.promotionalText || DEFAULT_CITIZEN_SETTINGS.promotionalText,
          centerName: cs.center_name || cs.centerName || sysData.bank_name || DEFAULT_CITIZEN_SETTINGS.centerName,
          centerContact: cs.center_contact || cs.centerContact || sysData.bc_agent_mobile || DEFAULT_CITIZEN_SETTINGS.centerContact,
          centerAddress: cs.center_address || cs.centerAddress || sysData.branch_name || DEFAULT_CITIZEN_SETTINGS.centerAddress,
          tagline: cs.tagline || DEFAULT_CITIZEN_SETTINGS.tagline,
        };
      }
    } catch {
      // Fallback
    }

    // 2. Also try reading from public.citizen_settings
    try {
      const { data: citData, error: citError } = await (supabase as any)
        .from("citizen_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!citError && citData) {
        liveSettings = {
          serviceTypes: Array.isArray(citData.service_types) && citData.service_types.length > 0
            ? citData.service_types
            : liveSettings?.serviceTypes || DEFAULT_CITIZEN_SERVICES,
          stampSignatureUrl: citData.stamp_signature_url || liveSettings?.stampSignatureUrl || "",
          promotionalText: citData.promotional_text || liveSettings?.promotionalText || DEFAULT_CITIZEN_SETTINGS.promotionalText,
          centerName: citData.center_name || liveSettings?.centerName || DEFAULT_CITIZEN_SETTINGS.centerName,
          centerContact: citData.center_contact || liveSettings?.centerContact || DEFAULT_CITIZEN_SETTINGS.centerContact,
          centerAddress: citData.center_address || liveSettings?.centerAddress || DEFAULT_CITIZEN_SETTINGS.centerAddress,
          tagline: citData.tagline || liveSettings?.tagline || DEFAULT_CITIZEN_SETTINGS.tagline,
        };
      }
    } catch {
      // Ignored
    }

    if (liveSettings) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(liveSettings));
      window.dispatchEvent(new Event("citizen-settings-updated"));
    }

    // 3. Sync Records
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
