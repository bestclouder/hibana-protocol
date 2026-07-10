import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Upload an attached image to the public "images" bucket (service-role
 * client — clients have no storage policies). Failure is non-fatal: the
 * caller saves without the image and surfaces the note — never silent.
 */
export async function tryUploadImage(
  file: FormDataEntryValue | null,
): Promise<{ url: string | null; note: string | null }> {
  if (!(file instanceof File) || file.size === 0) return { url: null, note: null };
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, note: "Image skipped: larger than 5 MB." };
  }
  const storage = createAdminClient().storage;
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await storage.from("images").upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) {
    return {
      url: null,
      note: "Image skipped: the upload failed. You can paste an image URL instead.",
    };
  }
  const { data } = storage.from("images").getPublicUrl(path);
  return { url: data.publicUrl, note: null };
}
