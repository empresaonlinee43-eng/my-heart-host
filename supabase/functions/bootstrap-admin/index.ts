// Cria (ou promove) um usuário administrador. Só executa se o e-mail informado
// bater com o allowlist — evita virar endpoint público de escalação.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED = new Set([
  "admin@playstore.com",
]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email e password obrigatórios" }), {
        status: 400,
        headers: { ...cors, "content-type": "application/json" },
      });
    }
    if (!ALLOWED.has(String(email).toLowerCase())) {
      return new Response(JSON.stringify({ error: "email não permitido" }), {
        status: 403,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Procura usuário existente
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => (u.email || "").toLowerCase() === String(email).toLowerCase());
    if (existing) {
      userId = existing.id;
      await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (cErr) throw cErr;
      userId = created.user!.id;
    }

    // Concede papel admin
    const { error: rErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (rErr) throw rErr;

    return new Response(JSON.stringify({ ok: true, userId, email }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
