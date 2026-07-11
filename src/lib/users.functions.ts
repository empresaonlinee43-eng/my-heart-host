import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  admin: z.boolean().optional().default(false),
});

export const createManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => createUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Somente admin pode criar usuários.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("Usuário não foi criado.");

    if (data.admin) {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      if (roleInsertError) throw new Error(roleInsertError.message);
    }

    return { ok: true, userId, email: data.email, admin: !!data.admin };
  });