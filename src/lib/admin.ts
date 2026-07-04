import { supabase } from "@/integrations/supabase/client";

// Client-side admin helpers. RLS + `has_role(auth.uid(),'admin')` policies
// enforce that only admins can read/write. Signatures mimic the previous
// server-fn shape so call sites can pass `{ data: ... }` transparently.

function siteAssetPublicUrl(path: string) {
  return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
}

export async function adminWhoAmI() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return { userId: "", isAdmin: false };
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { userId: user.id, isAdmin: !!data };
}

export async function adminListApps() {
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminUpsertApp({ data }: { data: any }) {
  const { data: row, error } = await supabase
    .from("apps")
    .upsert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row;
}

export async function adminDeleteApp({ data }: { data: { id: string } }) {
  const { error } = await supabase.from("apps").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminListSettings() {
  const { data, error } = await supabase.from("site_settings").select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminSetSetting({ data }: { data: { key: string; value: any } }) {
  const { error } = await supabase.from("site_settings").upsert({
    key: data.key,
    value: data.value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function importFromPlayStore({ data }: { data: { url: string } }) {
  const { data: res, error } = await supabase.functions.invoke("import-play-store", {
    body: { url: data.url },
  });
  if (error) {
    return {
      ok: false,
      error: error.message,
      name: "Importação não concluída",
      counts: { screenshots: 0, reviews: 0, descriptionChars: 0, downloadedImages: 0 },
    };
  }
  return res;
}

export { siteAssetPublicUrl };