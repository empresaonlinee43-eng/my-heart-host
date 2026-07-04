import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminWhoAmI,
  adminListApps,
  adminUpsertApp,
  adminDeleteApp,
  adminListSettings,
  adminSetSetting,
  importFromPlayStore,
} from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ImageUpload, MultiImageUpload, siteAssetDisplayUrl } from "@/components/ImageUpload";
import { toast } from "sonner";
import {
  Home, AppWindow, Download, Settings, LogOut, ExternalLink, Plus, Trash2, Pencil, Search,
  Info, Type, Image as ImageIcon, MousePointerClick, CheckCircle2, RefreshCw,
  Smartphone, Monitor, Lightbulb, Save, Star, Tag, Calendar, Megaphone, MessageSquare, Grid3x3, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPageDefault() { return <AdminPage />; }

type Section = "home" | "apps" | "import" | "settings";

function AdminPage() {
  const navigate = useNavigate();
  const whoAmI = adminWhoAmI;
  const me = useQuery({ queryKey: ["whoami"], queryFn: () => whoAmI() });
  const [section, setSection] = useState<Section>("home");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth", replace: true });
    });
  }, [navigate]);

  if (me.isLoading) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  if (!me.data?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Acesso negado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Sua conta não é admin.</p>
<Button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }} variant="outline">Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nav: { id: Section; label: string; icon: any }[] = [
    { id: "home", label: "Página Inicial", icon: Home },
    { id: "import", label: "Importar Play Store", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-gradient-to-b from-card to-muted/40 border-r flex flex-col p-4 gap-1 sticky top-0 h-screen">
        <div className="px-2 pb-4 mb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-foreground to-foreground/70 text-background flex items-center justify-center font-bold text-base shadow-sm">
              A
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight tracking-tight">Painel Admin</h1>
              <p className="text-[10px] text-muted-foreground truncate">Edite sem código</p>
            </div>
          </div>
        </div>
        <div className="px-2 pb-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">Navegação</span>
        </div>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all",
              section === n.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-foreground/80 hover:text-foreground",
            )}
          >
            <n.icon className={cn("w-4 h-4 shrink-0", section === n.id ? "" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="font-medium truncate">{n.label}</span>
          </button>
        ))}
        <div className="mt-auto pt-4 border-t space-y-1">
          <button onClick={() => window.open("/", "_blank")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <ExternalLink className="w-4 h-4 text-muted-foreground" /> Ver site
          </button>
<button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 bg-muted/20">
        {section === "home" && <HomePanel />}
        {section === "import" && <ImportPanel />}
      </main>
    </div>
  );
}

// ---------- Home (structured) ----------

type FieldType = "text" | "textarea" | "image";
type FieldType2 = "text" | "textarea" | "image" | "images" | "tags" | "reviews" | "similar" | "apk";
type HomeField = {
  key: string;
  label: string;
  type: FieldType2;
  help: string;
  placeholder?: string;
  icon: any;
  group: "identity" | "media" | "content" | "details" | "social" | "apk";
};
const HOME_FIELDS: HomeField[] = [
  {
    key: "app_title",
    label: "Nome do app",
    type: "text",
    icon: Type,
    placeholder: "Ex.: WhatsApp Messenger",
    help: "Título grande no topo da página inicial (clone do Google Play).",
    group: "identity",
  },
  {
    key: "app_developer",
    label: "Desenvolvedor",
    type: "text",
    icon: Info,
    placeholder: "Ex.: WhatsApp LLC",
    help: "Nome em verde, abaixo do título.",
    group: "identity",
  },
  {
    key: "app_icon",
    label: "Ícone do app",
    type: "image",
    icon: ImageIcon,
    help: "Ícone quadrado mostrado no topo. Envie um arquivo (JPG/PNG, até 5MB).",
    group: "media",
  },
  {
    key: "app_screenshots",
    label: "Capturas de tela",
    type: "images",
    icon: ImageIcon,
    help: "Galeria horizontal logo abaixo do botão Instalar. Envie várias imagens.",
    group: "media",
  },
  {
    key: "app_description",
    label: "Descrição (Sobre o app)",
    type: "textarea",
    icon: MousePointerClick,
    placeholder: "Descreva o que o app faz…",
    help: "Texto longo da seção 'Sobre este app'. Quebras de linha são preservadas.",
    group: "content",
  },
  {
    key: "app_tags",
    label: "Tags (chips)",
    type: "tags",
    icon: Tag,
    placeholder: "Uma tag por linha",
    help: "Aparecem como botões cinza abaixo da descrição. Uma tag por linha.",
    group: "content",
  },
  {
    key: "app_updated",
    label: "Data de atualização",
    type: "text",
    icon: Calendar,
    placeholder: "16 de jun. de 2026",
    help: "Texto exibido em 'Atualizado em ...'.",
    group: "content",
  },
  {
    key: "app_news",
    label: "Novidades",
    type: "textarea",
    icon: Megaphone,
    placeholder: "• Lista de mudanças desta versão…",
    help: "Conteúdo da seção 'Novidades'. Quebras de linha preservadas.",
    group: "content",
  },
  {
    key: "app_rating",
    label: "Nota média",
    type: "text",
    icon: Star,
    placeholder: "4,4",
    help: "Número grande no bloco 'Avaliações e opiniões'.",
    group: "details",
  },
  {
    key: "app_rating_count",
    label: "Total de avaliações",
    type: "text",
    icon: Star,
    placeholder: "237 mi",
    help: "Texto pequeno abaixo das estrelas (ex.: '237 mi').",
    group: "details",
  },
  {
    key: "app_top_reviews_count",
    label: "Referência: avaliações (topo)",
    type: "text",
    icon: Star,
    placeholder: "237 mi avaliações",
    help: "Texto abaixo da nota, na faixa de referência (topo).",
    group: "details",
  },
  {
    key: "app_age_pill",
    label: "Referência: classificação (número)",
    type: "text",
    icon: Info,
    placeholder: "14",
    help: "Número dentro do quadrado laranja na faixa de referência.",
    group: "details",
  },
  {
    key: "app_age_label",
    label: "Referência: classificação (texto)",
    type: "text",
    icon: Info,
    placeholder: "Classificação 14 anos",
    help: "Texto abaixo do quadrado de classificação.",
    group: "details",
  },
  {
    key: "app_top_downloads",
    label: "Referência: downloads",
    type: "text",
    icon: Info,
    placeholder: "10 bi+",
    help: "Número grande de downloads na faixa de referência.",
    group: "details",
  },
  {
    key: "app_reviews",
    label: "Avaliações dos usuários",
    type: "reviews",
    icon: MessageSquare,
    help: "Cada avaliação: nome, data, estrelas (1-5), texto e curtidas.",
    group: "social",
  },
  {
    key: "app_similar",
    label: "Apps semelhantes",
    type: "similar",
    icon: Grid3x3,
    help: "Cartões da seção 'Apps semelhantes'. Nome, dev, nota e ícone.",
    group: "social",
  },
  {
    key: "apk_url",
    label: "Arquivo APK",
    type: "apk",
    icon: Package,
    help: "Envie o APK ou cole um link direto. Ao clicar em Instalar, o cliente baixa este arquivo.",
    group: "apk",
  },
];

const GROUPS: { id: HomeField["group"]; title: string; subtitle: string }[] = [
  { id: "identity", title: "Identidade", subtitle: "Nome e quem fez o app." },
  { id: "media", title: "Mídia visual", subtitle: "Ícone e capturas de tela." },
  { id: "content", title: "Conteúdo", subtitle: "Texto descritivo do app." },
  { id: "details", title: "Avaliações (cabeçalho)", subtitle: "Nota média e total." },
  { id: "social", title: "Avaliações e similares", subtitle: "Comentários e cartões de outros apps." },
  { id: "apk", title: "Download (APK)", subtitle: "Arquivo enviado ao tocar em Instalar." },
];

const EMPTY_SETTINGS: Array<{ key: string; value: unknown }> = [];
const SITE_SETTINGS_STORAGE_KEY = "lovable:site-settings";
const SITE_SETTINGS_CHANNEL = "lovable-site-settings";

function publishSiteSettingsUpdate(settings: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const version = Date.now();

  const message = {
    type: "lovable-site-settings-updated",
    payload: settings,
    updatedAt: version,
  };

  try {
    window.localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(message));
  } catch {}

  try {
    const channel = new BroadcastChannel(SITE_SETTINGS_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {}
}

function HomePanel() {
  const qc = useQueryClient();
  const list = adminListSettings;
  const setFn = adminSetSetting;
  const { data: settingsData } = useQuery({ queryKey: ["admin-settings"], queryFn: () => list() });
  const settings = (settingsData ?? EMPTY_SETTINGS) as Array<{ key: string; value: unknown }>;

  const editableKeys = useMemo(() => new Set(HOME_FIELDS.map((field) => field.key)), []);
  const initial = useMemo(() => {
    const values: Record<string, unknown> = {};
    settings.forEach((s) => {
      if (editableKeys.has(s.key)) values[s.key] = s.value;
    });
    return values;
  }, [editableKeys, settings]);
  const initialSnapshot = JSON.stringify(initial);
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    setForm((current) => (JSON.stringify(current) === initialSnapshot ? current : initial));
  }, [initial, initialSnapshot]);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  // Push live updates to the iframe on every form change
  useEffect(() => {
    const f = iframeRef.current;
    if (!f || !f.contentWindow) return;
    try { f.contentWindow.postMessage({ type: "lovable-preview", payload: form }, "*"); } catch {}
  }, [form]);

  const save = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      // Save only keys that actually changed vs the initial snapshot.
      // Run in parallel and surface partial failures instead of stopping mid-loop.
      const initialMap = initial as Record<string, unknown>;
      const changed = Object.entries(payload).filter(
        ([k, v]) => JSON.stringify(v ?? "") !== JSON.stringify(initialMap[k] ?? ""),
      );
      if (!changed.length) return { ok: 0, failed: [] as string[] };
      const results = await Promise.allSettled(
        changed.map(([key, value]) => setFn({ data: { key, value: value ?? "" } })),
      );
      const failed = results
        .map((r, i) => (r.status === "rejected" ? changed[i][0] : null))
        .filter(Boolean) as string[];
      if (failed.length) throw new Error(`Falha ao salvar: ${failed.join(", ")}`);
      return { ok: changed.length, failed };
    },
    onSuccess: async (r, savedForm) => {
      qc.setQueryData<Array<{ key: string; value: unknown }>>(["admin-settings"], (current = []) => {
        const rows = new Map(current.map((row) => [row.key, row]));
        Object.entries(savedForm).forEach(([key, value]) => {
          if (editableKeys.has(key)) rows.set(key, { key, value: value ?? "" });
        });
        return Array.from(rows.values());
      });
      publishSiteSettingsUpdate(savedForm);
      // Force the preview iframe to hard-reload so it re-fetches server truth
      // instead of relying on partial broadcast payloads.
      setPreviewKey((k) => k + 1);
      toast.success(r.ok ? `${r.ok} campo(s) salvo(s)` : "Nada a salvar");
      await qc.refetchQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Página Inicial</h2>
            {dirty && (
              <span className="text-[11px] uppercase tracking-wider font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                Não salvo
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Edite textos e imagens. O preview ao lado atualiza em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setForm(initial)} disabled={!dirty}>
            Desfazer
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("/", "_blank")}>
            <ExternalLink className="w-4 h-4 mr-2" /> Abrir em nova aba
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
        <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-foreground" />
        <div className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Como editar:</strong> mude qualquer campo abaixo e
          veja a tela do site mudar ao lado na hora. Quando estiver satisfeito, clique em{" "}
          <strong className="text-foreground">Salvar tudo</strong> no rodapé. Sem código.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Formulário */}
        <div className="space-y-6">
          {GROUPS.map((g) => {
            const fields = HOME_FIELDS.filter((f) => f.group === g.id);
            if (!fields.length) return null;
            return (
              <section key={g.id} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">{g.title}</h3>
                  <span className="text-xs text-muted-foreground">{g.subtitle}</span>
                </div>
                <div className="space-y-3">
                  {fields.map((f) => (
                    <Card key={f.key} className="shadow-none">
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 border">
                            <f.icon className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-semibold">{f.label}</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.help}</p>
                          </div>
                        </div>
                        {f.type === "text" && (
                          <Input
                            placeholder={f.placeholder}
                            value={form[f.key] ?? ""}
                            onChange={(e) => set(f.key, e.target.value)}
                          />
                        )}
                        {f.type === "textarea" && (
                          <Textarea
                            placeholder={f.placeholder}
                            rows={4}
                            value={form[f.key] ?? ""}
                            onChange={(e) => set(f.key, e.target.value)}
                          />
                        )}
                        {f.type === "image" && (
                          <ImageUpload
                            value={form[f.key] || null}
                            onChange={(url) => set(f.key, url ?? "")}
                            aspect="square"
                            label=""
                          />
                        )}
                        {f.type === "images" && (
                          <MultiImageUpload
                            value={Array.isArray(form[f.key]) ? form[f.key] : []}
                            onChange={(urls) => set(f.key, urls)}
                            label=""
                          />
                        )}
                        {f.type === "tags" && (
                          <Textarea
                            placeholder={f.placeholder}
                            rows={3}
                            value={Array.isArray(form[f.key]) ? form[f.key].join("\n") : (form[f.key] ?? "")}
                            onChange={(e) => set(f.key, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                          />
                        )}
                        {f.type === "reviews" && (
                          <ReviewsEditor
                            value={Array.isArray(form[f.key]) ? form[f.key] : []}
                            onChange={(v) => set(f.key, v)}
                          />
                        )}
                        {f.type === "similar" && (
                          <SimilarEditor
                            value={Array.isArray(form[f.key]) ? form[f.key] : []}
                            onChange={(v) => set(f.key, v)}
                          />
                        )}
                        {f.type === "apk" && (
                          <ApkUpload
                            value={form[f.key] ?? ""}
                            onChange={(url) => set(f.key, url)}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
          <div className="sticky bottom-4 bg-card border rounded-md p-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {dirty ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Alterações não salvas
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Tudo salvo
                </>
              )}
            </div>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !dirty}>
              <Save className="w-4 h-4 mr-2" />
              {save.isPending ? "Salvando…" : "Salvar tudo"}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Preview ao vivo
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center rounded-md border bg-card p-0.5">
                <button
                  onClick={() => setDevice("mobile")}
                  aria-label="Visualizar como celular"
                  className={cn(
                    "px-2 py-1 rounded text-xs flex items-center gap-1",
                    device === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Celular
                </button>
                <button
                  onClick={() => setDevice("desktop")}
                  aria-label="Visualizar como desktop"
                  className={cn(
                    "px-2 py-1 rounded text-xs flex items-center gap-1",
                    device === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewKey((k) => k + 1)}
                className="h-7 text-xs"
                aria-label="Recarregar preview"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="border rounded-md overflow-hidden bg-muted/30">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/50">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="ml-2 text-[11px] text-muted-foreground font-mono truncate">/</div>
            </div>
            <div
              className="mx-auto bg-background transition-all"
              style={{ maxWidth: device === "mobile" ? 420 : "100%" }}
            >
              <iframe
                ref={(el) => { iframeRef.current = el; }}
                key={previewKey}
                src={`/clone/index.html?v=${previewKey}`}
                title="Preview"
                className="w-full block bg-background"
                style={{ height: "calc(100vh - 240px)", minHeight: 520 }}
                onLoad={(e) => {
                  try {
                    (e.currentTarget as HTMLIFrameElement).contentWindow?.postMessage(
                      { type: "lovable-preview", payload: form }, "*",
                    );
                  } catch {}
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Apps ----------

function AppsManager() {
  const qc = useQueryClient();
  const list = adminListApps;
  const upsert = adminUpsertApp;
  const del = adminDeleteApp;
  const { data: apps = [], isLoading } = useQuery({ queryKey: ["admin-apps"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const save = useMutation({
    mutationFn: (payload: any) => upsert({ data: payload }),
    onSuccess: () => {
      toast.success("App salvo");
      qc.invalidateQueries({ queryKey: ["admin-apps"] });
      qc.invalidateQueries({ queryKey: ["apps_public"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["admin-apps"] });
      qc.invalidateQueries({ queryKey: ["apps_public"] });
    },
  });

  const filtered = (apps as any[]).filter((a) =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.slug?.includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Apps</h2>
          <p className="text-sm text-muted-foreground">{(apps as any[]).length} apps cadastrados</p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome ou slug…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum app. Importe da Play Store ou crie um novo.</p>
          ) : (
            <div className="grid gap-2">
              {filtered.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors">
                  {a.icon_url ? (
                    <img src={siteAssetDisplayUrl(a.icon_url) ?? a.icon_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.slug} · {a.developer ?? "—"} · {a.published ? "Publicado" : "Rascunho"}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm(`Remover ${a.name}?`) && remove.mutate(a.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && <AppEditor app={editing} onClose={() => setEditing(null)} onSave={(p: any) => save.mutate(p)} saving={save.isPending} />}
    </div>
  );
}

function AppEditor({ app, onClose, onSave, saving }: any) {
  const [form, setForm] = useState<any>({
    ...app,
    screenshots: Array.isArray(app.screenshots) ? app.screenshots : [],
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-auto" onClick={onClose}>
      <Card className="w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="sticky top-0 bg-card z-10 border-b">
          <CardTitle>{app.id ? "Editar app" : "Novo app"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Slug (URL) *</Label>
              <Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Desenvolvedor</Label>
              <Input value={form.developer ?? ""} onChange={(e) => set("developer", e.target.value || null)} />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input value={form.category ?? ""} onChange={(e) => set("category", e.target.value || null)} />
            </div>
            <div className="space-y-1">
              <Label>Avaliação (0-5)</Label>
              <Input type="number" step="0.1" min="0" max="5" value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="space-y-1">
              <Label>Downloads (texto livre)</Label>
              <Input value={form.downloads ?? ""} onChange={(e) => set("downloads", e.target.value || null)} placeholder="ex: 1B+" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Link da Play Store</Label>
              <Input value={form.play_url ?? ""} onChange={(e) => set("play_url", e.target.value || null)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea rows={5} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <ImageUpload label="Ícone" aspect="square" value={form.icon_url} onChange={(url) => set("icon_url", url)} />
            <ImageUpload label="Capa (cover)" aspect="wide" value={form.cover_url} onChange={(url) => set("cover_url", url)} />
          </div>

          <MultiImageUpload label="Screenshots" value={form.screenshots ?? []} onChange={(urls) => set("screenshots", urls)} />

          <div className="flex items-center gap-4 pt-2 border-t">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.published} onChange={(e) => set("published", e.target.checked)} />
              Publicado
            </label>
            <div className="space-y-0 flex-1">
              <Label className="text-xs">Posição (ordem)</Label>
              <Input type="number" value={form.position ?? 0} onChange={(e) => set("position", Number(e.target.value))} className="w-24" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-card pb-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(form)} disabled={saving || !form.name || !form.slug}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Import ----------

function ImportPanel() {
  const qc = useQueryClient();
  const importFn = importFromPlayStore;
  const [url, setUrl] = useState("");
  const [lastImport, setLastImport] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importSteps = [
    "Conectando na página oficial",
    "Lendo título, descrição e avaliações",
    "Baixando ícone e screenshots reais",
    "Salvando assets no site",
  ];
  const mut = useMutation({
    mutationFn: (u: string) => {
      setImportError(null);
      setLastImport(null);
      return importFn({ data: { url: u.trim() } });
    },
    onSuccess: async (d: any) => {
      if (d?.ok === false) {
        const message = d.error ?? "Falha ao importar da Play Store";
        setImportError(message);
        toast.error(message);
        return;
      }
      setLastImport(d);
      if (d?.settings && typeof d.settings === "object") {
        publishSiteSettingsUpdate(d.settings);
      }
      toast.success(`Importado: ${d.name}. Baixadas ${d.counts?.downloadedImages ?? 0} imagem(ns).`);
      qc.invalidateQueries({ queryKey: ["admin-apps"] });
      qc.invalidateQueries({ queryKey: ["apps_public"] });
      await qc.refetchQueries({ queryKey: ["admin-settings"] });
      setUrl("");
    },
    onError: (e: any) => {
      let msg = e?.message || "Falha ao importar";
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed) && parsed[0]?.message) msg = parsed[0].message;
      } catch {}
      setImportError(msg);
      toast.error(msg);
    },
  });
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-sm">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Importar da Google Play</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Cole a URL e o sistema baixa tudo automaticamente.</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">URL da Play Store</Label>
            <Input
              placeholder="Cole link do app, link de busca ou pacote (ex: com.bradesco)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Links de busca também funcionam; o importador usa o primeiro app encontrado no resultado.
            </p>
            <button
              type="button"
              onClick={() => setUrl("https://play.google.com/store/apps/details?id=com.whatsapp")}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Usar exemplo (WhatsApp)
            </button>
          </div>
          <Button
            onClick={() => mut.mutate(url)}
            disabled={mut.isPending || !url}
            className="w-full"
            size="lg"
          >
            {mut.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {mut.isPending ? "Baixando dados e imagens…" : "Importar app"}
          </Button>
          {importError && !mut.isPending && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {importError}
            </div>
          )}
          {mut.isPending && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3" role="status" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Importação em andamento</p>
                  <p className="text-xs text-muted-foreground">Não feche esta tela: as imagens oficiais estão sendo baixadas.</p>
                </div>
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
              </div>
              <Progress value={72} />
              <div className="grid gap-2">
                {importSteps.map((step) => (
                  <div key={step} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}
          {lastImport && !mut.isPending && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <div className="font-medium">Última importação aplicada</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted/50 p-2">
                  <div className="font-semibold">{lastImport.counts?.screenshots ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">screenshots</div>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <div className="font-semibold">{lastImport.counts?.downloadedImages ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">imagens baixadas</div>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <div className="font-semibold">{lastImport.counts?.reviews ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">avaliações</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { icon: ImageIcon, title: "Ícone oficial", desc: "Baixado e salvo no site" },
          { icon: Grid3x3, title: "Screenshots reais", desc: "Galeria da página oficial" },
          { icon: Info, title: "Descrição completa", desc: "Texto oficial da loja" },
          { icon: Star, title: "Nota + avaliações", desc: "Dados exibidos no app" },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <f.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{f.title}</div>
              <div className="text-xs text-muted-foreground">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Settings (advanced raw key/value) ----------

function SettingsPanel() {
  // moved below
  return <SettingsPanelImpl />;
}

// ---------- Small structured editors (reviews / similar / APK) ----------

type Review = { name?: string; date?: string; stars?: number; text?: string; helpful?: string };
function ReviewsEditor({ value, onChange }: { value: Review[]; onChange: (v: Review[]) => void }) {
  const update = (i: number, patch: Partial<Review>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { name: "", date: "", stars: 5, text: "", helpful: "" }]);
  return (
    <div className="space-y-3">
      {value.map((r, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Avaliação #{i + 1}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => remove(i)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome" value={r.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} />
            <Input placeholder="Data (ex.: 10 de junho de 2026)" value={r.date ?? ""} onChange={(e) => update(i, { date: e.target.value })} />
            <Input type="number" min={1} max={5} placeholder="Estrelas (1-5)" value={r.stars ?? 5} onChange={(e) => update(i, { stars: Number(e.target.value) })} />
            <Input placeholder="Curtidas (ex.: 1.872 pessoas...)" value={r.helpful ?? ""} onChange={(e) => update(i, { helpful: e.target.value })} />
          </div>
          <Textarea rows={2} placeholder="Comentário" value={r.text ?? ""} onChange={(e) => update(i, { text: e.target.value })} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar avaliação
      </Button>
    </div>
  );
}

type Similar = { name?: string; developer?: string; rating?: string; icon_url?: string | null };
function SimilarEditor({ value, onChange }: { value: Similar[]; onChange: (v: Similar[]) => void }) {
  const update = (i: number, patch: Partial<Similar>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { name: "", developer: "", rating: "", icon_url: null }]);
  const RANDOM_POOL: Similar[] = [
    { name: "WhatsApp Messenger", developer: "WhatsApp LLC", rating: "4,3", icon_url: "https://play-lh.googleusercontent.com/bYtqbOcTYOlgc6gqZ2rwb8lptHuwlNE75zYJu6Bn076-hTmvd96HH-6v7S0YUAAJXoJN" },
    { name: "Instagram", developer: "Instagram", rating: "4,1", icon_url: "https://play-lh.googleusercontent.com/VRMWkE5p3CkWhJs6nv-9ZsLAs1QOg5ob1_3qg-rckwYW7yp1fMrYZqnEFpk0IoVP4LM" },
    { name: "TikTok", developer: "TikTok Pte. Ltd.", rating: "4,4", icon_url: "https://play-lh.googleusercontent.com/iBYjvYuNq8BB7EEEHktPG1fpX9NmzZlrHKPWKAQCoAUgL5vJU3ffTPFI9QW4B5-jgAU" },
    { name: "Facebook", developer: "Meta Platforms, Inc.", rating: "4,2", icon_url: "https://play-lh.googleusercontent.com/KCMTYuiTrKom4Vyf0G4foetVOwhKWzNbHWumV73IXexAIy5TTgZipL52WTt8ICL-oIo" },
    { name: "Telegram", developer: "Telegram FZ-LLC", rating: "4,3", icon_url: "https://play-lh.googleusercontent.com/ZU9cSsyIJZo6Oy7HTHiEPwZg0m2Crep-d5ZrfajqtsH-qgUXSqKpNA2FpPDTn-7qA5Q" },
    { name: "Spotify", developer: "Spotify AB", rating: "4,5", icon_url: "https://play-lh.googleusercontent.com/UrY7BAZ-XfXGpfkeWg0zCCeo-7ras4DCoRalC_WXXWTK9q5b0Iw7B0YQMsVxZaNB7DM" },
    { name: "YouTube", developer: "Google LLC", rating: "4,2", icon_url: "https://play-lh.googleusercontent.com/lMoItBgdPPVDJsNOVtP26EKHePkwBg-PkuY9NOrc-fumRtTFP4XhpUNk_22syN4Datc" },
    { name: "Netflix", developer: "Netflix, Inc.", rating: "4,4", icon_url: "https://play-lh.googleusercontent.com/TBRwjS_qfJCSjmnvLhLXXLXOaqM_QsAOxAtnZL_-jr-QwXWzhOlKuRAOTHiJXpKgTA" },
    { name: "Uber", developer: "Uber Technologies, Inc.", rating: "4,3", icon_url: "https://play-lh.googleusercontent.com/uHb9KstyOphIMymCsCbe6d8vSNTZ4TXbYCiRTfahRAiFyyaTGVJKPFZdC-yvKHOKFLA" },
    { name: "Mercado Livre", developer: "Mercado Libre", rating: "4,6", icon_url: "https://play-lh.googleusercontent.com/1Nsb0dyzoQtNkjYvJ4rmYVOZaMCJj9YbYFHRHo6EMwGjqvYyR-yOePLcbHtDurQ4qA" },
    { name: "Gmail", developer: "Google LLC", rating: "4,3", icon_url: "https://play-lh.googleusercontent.com/KSuaRLiI_FlDP8cM4MzJ23ml3og5Hxb9AapaGTMZ2GgR103mvJ3AAnoOFz1yheeQBBI" },
    { name: "Google Maps", developer: "Google LLC", rating: "4,3", icon_url: "https://play-lh.googleusercontent.com/Kf8WTct65hFJxBUDm5E-EpYsiDoLQiGGbnuyP6HBNax43YShXti9THPon1YKB6zPYpA" },
  ];
  const addRandom = () => {
    const existing = new Set(value.map((v) => (v.name || "").toLowerCase()));
    const available = RANDOM_POOL.filter((p) => !existing.has((p.name || "").toLowerCase()));
    if (!available.length) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    onChange([...value, { ...pick }]);
  };
  const addRandomBatch = () => {
    const existing = new Set(value.map((v) => (v.name || "").toLowerCase()));
    const available = RANDOM_POOL.filter((p) => !existing.has((p.name || "").toLowerCase()));
    const shuffled = available.sort(() => Math.random() - 0.5).slice(0, 4);
    if (!shuffled.length) return;
    onChange([...value, ...shuffled]);
  };
  return (
    <div className="space-y-3">
      {value.map((r, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">App #{i + 1}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => remove(i)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome" value={r.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} />
            <Input placeholder="Desenvolvedor" value={r.developer ?? ""} onChange={(e) => update(i, { developer: e.target.value })} />
            <Input placeholder="Nota (ex.: 4,5)" value={r.rating ?? ""} onChange={(e) => update(i, { rating: e.target.value })} />
          </div>
          <ImageUpload label="Ícone" aspect="square" value={r.icon_url ?? null} onChange={(url) => update(i, { icon_url: url })} />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar app semelhante
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={addRandom}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar aleatório
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={addRandomBatch}>
          <Plus className="w-4 h-4 mr-1" /> Preencher 4 aleatórios
        </Button>
      </div>
    </div>
  );
}

function ApkUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onPick = async (file: File) => {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error("APK maior que 200MB");
      return;
    }
    setBusy(true);
    try {
      const path = `apk/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/vnd.android.package-archive",
      });
      if (error) throw error;
      const publicUrl = supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
      onChange(publicUrl);
      toast.success("APK enviado");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Input
        placeholder="https://... (ou envie um arquivo abaixo)"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        ref={ref}
        type="file"
        accept=".apk,application/vnd.android.package-archive"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
          <Package className="w-4 h-4 mr-2" /> {busy ? "Enviando…" : value ? "Trocar APK" : "Enviar APK"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remover
          </Button>
        )}
      </div>
      {value && <p className="text-xs text-muted-foreground truncate">Atual: {value}</p>}
    </div>
  );
}

function SettingsPanelImpl() {
  const qc = useQueryClient();
  const list = adminListSettings;
  const setFn = adminSetSetting;
  const { data: settings = [] } = useQuery({ queryKey: ["admin-settings"], queryFn: () => list() });
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const save = useMutation({
    mutationFn: (p: { key: string; value: any }) => setFn({ data: p }),
    onSuccess: () => {
      toast.success("Salvo");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Configurações avançadas</h2>
        <p className="text-sm text-muted-foreground">Chave/valor genérico. Use a aba "Página Inicial" para o conteúdo da home.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2 border-b pb-4">
            <Input placeholder="chave" value={key} onChange={(e) => setKey(e.target.value)} />
            <Textarea placeholder='valor (string ou JSON)' rows={3} value={value} onChange={(e) => setValue(e.target.value)} />
            <Button onClick={() => {
              let parsed: any = value;
              try { parsed = JSON.parse(value); } catch {}
              save.mutate({ key, value: parsed });
            }} disabled={!key}>Salvar</Button>
          </div>
          <div className="space-y-2">
            {(settings as any[]).map((s) => (
              <div key={s.key} className="p-3 border rounded text-sm">
                <div className="font-mono font-medium">{s.key}</div>
                <pre className="text-xs text-muted-foreground overflow-auto mt-1 max-h-32">{JSON.stringify(s.value, null, 2)}</pre>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { setKey(s.key); setValue(typeof s.value === "string" ? s.value : JSON.stringify(s.value, null, 2)); }}>
                  Editar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
