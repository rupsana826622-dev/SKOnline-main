import { supabase } from "./supabase";

// ─── TYPES ────────────────────────────────────────────────

export interface StudioRecord {
  id: string;
  created_at: string;
  customer_name: string;
  mobile: string;
  address: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size_kb: number;
  file_type: string;
}

// ─── SUPABASE OPERATIONS ──────────────────────────────────

export async function fetchStudioRecords(): Promise<StudioRecord[]> {
  const { data, error } = await supabase
    .from("studio_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch studio records:", error);
    return [];
  }
  return (data as StudioRecord[]) || [];
}

export async function addStudioRecord(
  record: Omit<StudioRecord, "id" | "created_at">
): Promise<{ data: StudioRecord | null; error: any }> {
  const { data, error } = await supabase
    .from("studio_records")
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error("Failed to insert studio record:", error);
    return { data: null, error };
  }
  return { data: data as StudioRecord, error: null };
}

export async function deleteStudioRecord(
  id: string,
  fileUrl: string
): Promise<{ error: any }> {
  // Extract storage path from URL
  try {
    const url = new URL(fileUrl);
    // path after /storage/v1/object/public/studio-files/
    const pathParts = url.pathname.split("/studio-files/");
    const storagePath = pathParts[1];
    if (storagePath) {
      await supabase.storage.from("studio-files").remove([storagePath]);
    }
  } catch (e) {
    console.warn("Could not parse storage path for deletion:", e);
  }

  const { error } = await supabase
    .from("studio_records")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete studio record:", error);
  }
  return { error };
}

// ─── COMPRESSION ENGINE ───────────────────────────────────

export const compressStudioFile = async (file: File): Promise<File> => {
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_DIM = 1600;
          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, ".jpg"),
                  { type: "image/jpeg" }
                );
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.75
          );
        };
      };
    });
  }
  return file;
};

// ─── SUPABASE UPLOAD ──────────────────────────────────────

export async function uploadStudioFile(file: File): Promise<{ url: string | null; error: any }> {
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `archive/${Date.now()}_${cleanFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("studio-files")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Studio file upload error:", uploadError);
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from("studio-files").getPublicUrl(storagePath);
  return { url: data.publicUrl, error: null };
}
