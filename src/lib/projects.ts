import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type AppProject = Database["public"]["Tables"]["app_projects"]["Row"];

export function slugifyProject(input: string) {
  const slug = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  return slug.length >= 3 ? slug : `app-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getCurrentUserAndRole() {
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  const user = userRes.user;
  if (!user) return { user: null, isAdmin: false };

  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { user, isAdmin: !!data };
}

export async function listAppProjects(isAdmin: boolean, userId: string) {
  let query = supabase
    .from("app_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!isAdmin) query = query.eq("owner_id", userId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAppProject(name: string, userId: string, slug?: string) {
  const finalName = name.trim() || "Meu app";
  const finalSlug = slugifyProject(slug?.trim() || `${finalName}-${Math.random().toString(36).slice(2, 6)}`);
  const { data, error } = await supabase
    .from("app_projects")
    .insert({
      owner_id: userId,
      name: finalName,
      slug: finalSlug,
      settings: {},
      is_public: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAppProject(projectId: string, patch: Partial<Pick<AppProject, "name" | "slug" | "settings" | "is_public">>) {
  const { data, error } = await supabase
    .from("app_projects")
    .update(patch)
    .eq("id", projectId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAppProject(projectId: string) {
  const { error } = await supabase.from("app_projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function saveProjectSettings(project: AppProject, settings: Record<string, unknown>) {
  return updateAppProject(project.id, { settings: settings as Json });
}

export async function getPublicProjectBySlug(slug: string) {
  const { data, error } = await supabase
    .from("app_projects")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}