import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FolderKanban,
  Home,
  Image as ImageIcon,
  Link as LinkIcon,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  Star,
  Tag,
  Trash2,
  Type,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload, MultiImageUpload, siteAssetDisplayUrl } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { importFromPlayStore } from "@/lib/admin";
import {
  type AppProject,
  createAppProject,
  deleteAppProject,
  getCurrentUserAndRole,
  listAppProjects,
  saveProjectSettings,
  slugifyProject,
  updateAppProject,
} from "@/lib/projects";
import { createManagedUser } from "@/lib/users.functions";
import { cn } from "@/lib/utils";

type Section = "project" | "import" | "projects" | "users";

const FIELDS = [
  { key: "app_title", label: "Nome do app", type: "text", icon: Type, group: "main", placeholder: "Ex.: WhatsApp Messenger" },
  { key: "app_developer", label: "Desenvolvedor", type: "text", icon: Shield, group: "main", placeholder: "Ex.: WhatsApp LLC" },
  { key: "app_icon", label: "Ícone", type: "image", icon: ImageIcon, group: "media" },
  { key: "app_screenshots", label: "Screenshots", type: "images", icon: ImageIcon, group: "media" },
  { key: "apk_url", label: "APK de download", type: "apk", icon: FileArchive, group: "media" },
  { key: "app_description", label: "Descrição", type: "textarea", icon: Type, group: "content" },
  { key: "app_tags", label: "Tags", type: "tags", icon: Tag, group: "content" },
  { key: "app_rating", label: "Nota média", type: "text", icon: Star, group: "details", placeholder: "4,4" },
  { key: "app_rating_count", label: "Total de avaliações", type: "text", icon: Star, group: "details", placeholder: "237 mi" },
  { key: "app_top_reviews_count", label: "Avaliações no topo", type: "text", icon: Star, group: "details", placeholder: "237 mi avaliações" },
  { key: "app_top_downloads", label: "Downloads no topo", type: "text", icon: Download, group: "details", placeholder: "10 bi+" },
  { key: "app_age_pill", label: "Classificação número", type: "text", icon: Shield, group: "details", placeholder: "14" },
  { key: "app_age_label", label: "Classificação texto", type: "text", icon: Shield, group: "details", placeholder: "Classificação 14 anos" },
  { key: "app_updated", label: "Atualizado em", type: "text", icon: RefreshCw, group: "details", placeholder: "16 de jun. de 2026" },
  { key: "app_news", label: "Novidades", type: "textarea", icon: Type, group: "content" },
  { key: "app_reviews", label: "Avaliações dos usuários", type: "reviews", icon: Users, group: "social" },
  { key: "app_similar", label: "Apps semelhantes", type: "similar", icon: Package, group: "social" },
] as const;

const GROUPS = [
  { id: "main", title: "Identidade" },
  { id: "media", title: "Arquivos e imagens" },
  { id: "content", title: "Conteúdo" },
  { id: "details", title: "Detalhes da loja" },
  { id: "social", title: "Avaliações e similares" },
];

function publicUrl(path: string) {
  return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
}

function publicProjectUrl(slug: string) {
  if (typeof window === "undefined") return `/app/${slug}`;
  return `${window.location.origin}/app/${slug}`;
}

function publishPreview(settings: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const msg = { type: "lovable-site-settings-updated", payload: settings, updatedAt: Date.now() };
  try { localStorage.setItem("lovable:site-settings", JSON.stringify(msg)); } catch {}
  try {
    const channel = new BroadcastChannel("lovable-site-settings");
    channel.postMessage(msg);
    channel.close();
  } catch {}
}

export default function SaasAdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("project");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const me = useQuery({ queryKey: ["panel-me"], queryFn: getCurrentUserAndRole });
  useEffect(() => {
    if (me.data && !me.data.user) navigate({ to: "/auth", replace: true });
  }, [me.data, navigate]);

  const userId = me.data?.user?.id ?? "";
  const projectsQuery = useQuery({
    queryKey: ["app-projects", userId, me.data?.isAdmin],
    enabled: !!userId,
    queryFn: () => listAppProjects(!!me.data?.isAdmin, userId),
  });
  const projects = projectsQuery.data ?? [];
  const selectedProject = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;

  useEffect(() => {
    if (!selectedId && projects[0]) setSelectedId(projects[0].id);
    if (selectedId && projects.length && !projects.some((p) => p.id === selectedId)) setSelectedId(projects[0].id);
  }, [projects, selectedId]);

  const createProject = useMutation({
    mutationFn: () => createAppProject("Meu app", userId),
    onSuccess: async (project) => {
      toast.success("Projeto criado");
      setSelectedId(project.id);
      setSection("project");
      await qc.invalidateQueries({ queryKey: ["app-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (me.isLoading || (userId && projectsQuery.isLoading)) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  if (!me.data?.user) return <div className="p-8 text-muted-foreground">Redirecionando…</div>;

  const nav = [
    { id: "project" as const, label: "Meu APK", icon: Home },
    { id: "import" as const, label: "Importar Play Store", icon: Download },
    { id: "projects" as const, label: me.data.isAdmin ? "Projetos dos usuários" : "Meus projetos", icon: FolderKanban },
    ...(me.data.isAdmin ? [{ id: "users" as const, label: "Criar usuários", icon: UserPlus }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col p-4 gap-1 sticky top-0 h-screen">
        <div className="px-2 pb-4 mb-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold">{me.data.isAdmin ? "A" : "U"}</div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight">{me.data.isAdmin ? "Painel Admin" : "Painel do Usuário"}</h1>
              <p className="text-[10px] text-sidebar-foreground/65 truncate">{me.data.user.email}</p>
            </div>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="px-2 pb-3">
            <Label className="text-[10px] uppercase tracking-widest text-sidebar-foreground/65">Projeto ativo</Label>
            <select
              value={selectedProject?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-2 w-full rounded-md border border-sidebar-border bg-background px-2 py-2 text-xs text-foreground"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} /{p.slug}</option>)}
            </select>
          </div>
        )}

        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "group flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-left transition-all",
              section === n.id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground/80",
            )}
          >
            <n.icon className="w-4 h-4 shrink-0" />
            <span className="font-medium truncate">{n.label}</span>
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-sidebar-border space-y-1">
          <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={() => createProject.mutate()} disabled={createProject.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Novo projeto
          </Button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 bg-muted/20">
        {!selectedProject && section !== "users" ? (
          <EmptyProjectState onCreate={() => createProject.mutate()} loading={createProject.isPending} />
        ) : (
          <>
            {section === "project" && selectedProject && <ProjectEditor project={selectedProject} />}
            {section === "import" && selectedProject && <ImportPanel project={selectedProject} />}
            {section === "projects" && <ProjectsPanel projects={projects} selectedId={selectedProject?.id} setSelectedId={setSelectedId} setSection={setSection} isAdmin={!!me.data.isAdmin} />}
            {section === "users" && me.data.isAdmin && <UsersPanel />}
          </>
        )}
      </main>
    </div>
  );
}

function EmptyProjectState({ onCreate, loading }: { onCreate: () => void; loading: boolean }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader><CardTitle>Criar primeiro projeto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Cada usuário terá seus próprios links, APKs e dados importados sem interferir nos outros.</p>
          <Button onClick={onCreate} disabled={loading}><Plus className="w-4 h-4 mr-2" /> Criar projeto</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectEditor({ project }: { project: AppProject }) {
  const qc = useQueryClient();
  const initial = useMemo(() => (project.settings && typeof project.settings === "object" ? project.settings as Record<string, unknown> : {}), [project.settings]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [projectName, setProjectName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);

  useEffect(() => {
    setForm(initial);
    setProjectName(project.name);
    setSlug(project.slug);
  }, [initial, project.id, project.name, project.slug]);

  useEffect(() => {
    try { iframeRef.current?.contentWindow?.postMessage({ type: "lovable-preview", payload: form }, "*"); } catch {}
  }, [form]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || projectName !== project.name || slug !== project.slug;
  const save = useMutation({
    mutationFn: async () => {
      const cleanSlug = slugifyProject(slug);
      const updated = await updateAppProject(project.id, { name: projectName.trim() || "Meu app", slug: cleanSlug, settings: form });
      return updated;
    },
    onSuccess: async (updated) => {
      toast.success("Projeto salvo");
      publishPreview(form);
      setPreviewKey((k) => k + 1);
      await qc.invalidateQueries({ queryKey: ["app-projects"] });
      setSlug(updated.slug);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const link = publicProjectUrl(slugifyProject(slug));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap border-b pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Editor do APK</h2>
          <p className="text-sm text-muted-foreground mt-1">Tudo salvo aqui fica separado para este link final.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copiado"))}>
            <Copy className="w-4 h-4 mr-2" /> Copiar link
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(link, "_blank")}>
            <ExternalLink className="w-4 h-4 mr-2" /> Abrir
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome interno do projeto</Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Final do link</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">/app/</span>
              <Input value={slug} onChange={(e) => setSlug(slugifyProject(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_430px] gap-6 items-start">
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <section key={group.id} className="space-y-3">
              <h3 className="text-sm font-semibold tracking-tight">{group.title}</h3>
              <div className="space-y-3">
                {FIELDS.filter((f) => f.group === group.id).map((field) => (
                  <Card key={field.key} className="shadow-none">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center border"><field.icon className="w-4 h-4" /></div>
                        <Label className="text-sm font-semibold">{field.label}</Label>
                      </div>
                      {field.type === "text" && <Input placeholder={field.placeholder} value={form[field.key] ?? ""} onChange={(e) => set(field.key, e.target.value)} />}
                      {field.type === "textarea" && <Textarea rows={4} value={form[field.key] ?? ""} onChange={(e) => set(field.key, e.target.value)} />}
                      {field.type === "image" && <ImageUpload value={form[field.key] || null} onChange={(url) => set(field.key, url ?? "")} aspect="square" label="" />}
                      {field.type === "images" && <MultiImageUpload value={Array.isArray(form[field.key]) ? form[field.key] : []} onChange={(urls) => set(field.key, urls)} label="" />}
                      {field.type === "apk" && <ApkUpload value={form[field.key] ?? ""} onChange={(url) => set(field.key, url)} />}
                      {field.type === "tags" && <Textarea rows={3} value={Array.isArray(form[field.key]) ? form[field.key].join("\n") : (form[field.key] ?? "")} onChange={(e) => set(field.key, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />}
                      {field.type === "reviews" && <ReviewsEditor value={Array.isArray(form[field.key]) ? form[field.key] : []} onChange={(v) => set(field.key, v)} />}
                      {field.type === "similar" && <SimilarEditor value={Array.isArray(form[field.key]) ? form[field.key] : []} onChange={(v) => set(field.key, v)} />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          <div className="sticky bottom-4 bg-card border rounded-md p-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {dirty ? <><span className="w-2 h-2 rounded-full bg-amber-500" /> Alterações não salvas</> : <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tudo salvo</>}
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !dirty}>
              <Save className="w-4 h-4 mr-2" /> {save.isPending ? "Salvando…" : "Salvar tudo"}
            </Button>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Preview tela cheia</div>
            <Button variant="ghost" size="sm" onClick={() => setPreviewKey((k) => k + 1)}><RefreshCw className="w-3 h-3" /></Button>
          </div>
          <div className="mx-auto max-w-[420px] overflow-hidden rounded-md border bg-background">
            <iframe
              ref={(el) => { iframeRef.current = el; }}
              key={`${project.slug}-${previewKey}`}
              src={`/clone/index.html?project=${encodeURIComponent(project.slug)}&v=${previewKey}`}
              title="Preview"
              className="w-full block bg-background"
              style={{ height: "calc(100vh - 160px)", minHeight: 640 }}
              onLoad={(e) => {
                try { (e.currentTarget as HTMLIFrameElement).contentWindow?.postMessage({ type: "lovable-preview", payload: form }, "*"); } catch {}
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportPanel({ project }: { project: AppProject }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [lastImport, setLastImport] = useState<any>(null);
  const mut = useMutation({
    mutationFn: async (u: string) => importFromPlayStore({ data: { url: u.trim() } }),
    onSuccess: async (d: any) => {
      if (d?.ok === false) throw new Error(d.error ?? "Falha ao importar");
      const imported = d.data ?? d;
      const nextSettings = {
        ...(project.settings && typeof project.settings === "object" ? project.settings as Record<string, unknown> : {}),
        app_title: imported.name || d.name || "",
        app_description: imported.description || "",
        app_icon: imported.icon || "",
        app_screenshots: imported.screenshots || [],
        app_updated: new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }),
      };
      await saveProjectSettings(project, nextSettings);
      publishPreview(nextSettings);
      setLastImport(d);
      toast.success(`Importado para ${project.name}`);
      setUrl("");
      await qc.invalidateQueries({ queryKey: ["app-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Importar da Google Play</h2>
        <p className="text-sm text-muted-foreground mt-1">Os dados serão aplicados somente no projeto ativo: {project.name}.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Label>URL da Play Store</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." className="font-mono text-sm" />
          <Button onClick={() => mut.mutate(url)} disabled={mut.isPending || !url} className="w-full" size="lg">
            {mut.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {mut.isPending ? "Importando…" : "Importar para este projeto"}
          </Button>
          {mut.isPending && <Progress value={72} />}
          {lastImport && <div className="rounded-md border bg-muted/40 p-3 text-sm">Última importação: {lastImport.name}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectsPanel({ projects, selectedId, setSelectedId, setSection, isAdmin }: { projects: AppProject[]; selectedId?: string; setSelectedId: (id: string) => void; setSection: (s: Section) => void; isAdmin: boolean }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: deleteAppProject,
    onSuccess: async () => {
      toast.success("Projeto removido");
      await qc.invalidateQueries({ queryKey: ["app-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{isAdmin ? "Projetos dos usuários" : "Meus projetos"}</h2>
        <p className="text-sm text-muted-foreground">Cada projeto gera um link isolado com final próprio.</p>
      </div>
      <div className="grid gap-3">
        {projects.map((p) => {
          const settings = p.settings as Record<string, any>;
          return (
            <Card key={p.id} className={cn("shadow-none", selectedId === p.id && "border-primary")}>
              <CardContent className="pt-5 flex items-center gap-3">
                {settings?.app_icon ? <img src={siteAssetDisplayUrl(settings.app_icon) ?? settings.app_icon} alt="" className="w-12 h-12 rounded-md object-cover" /> : <div className="w-12 h-12 rounded-md bg-muted" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">/app/{p.slug}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(publicProjectUrl(p.slug)).then(() => toast.success("Link copiado"))}><Copy className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => window.open(publicProjectUrl(p.slug), "_blank")}><ExternalLink className="w-4 h-4" /></Button>
                <Button size="sm" onClick={() => { setSelectedId(p.id); setSection("project"); }}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => confirm(`Remover ${p.name}?`) && remove.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UsersPanel() {
  const createUser = useServerFn(createManagedUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const mut = useMutation({
    mutationFn: () => createUser({ data: { email, password, admin } }),
    onSuccess: () => {
      toast.success("Usuário criado");
      setEmail("");
      setPassword("");
      setAdmin(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Criar usuários</h2>
        <p className="text-sm text-muted-foreground mt-1">O usuário entra em /auth e terá o próprio painel para gerar APKs.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label>Senha</Label><Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} /> Dar permissão de admin</label>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !email || password.length < 6}>
            <UserPlus className="w-4 h-4 mr-2" /> {mut.isPending ? "Criando…" : "Criar usuário"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ApkUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onPick = async (file: File) => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return toast.error("Faça login novamente");
    if (file.size > 200 * 1024 * 1024) return toast.error("APK maior que 200MB");
    setBusy(true);
    try {
      const path = `${userId}/apk/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "application/vnd.android.package-archive" });
      if (error) throw error;
      onChange(publicUrl(path));
      toast.success("APK enviado");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Input placeholder="https://... ou envie um APK" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      <input ref={ref} type="file" accept=".apk,application/vnd.android.package-archive" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}><Package className="w-4 h-4 mr-2" />{busy ? "Enviando…" : "Enviar APK"}</Button>{value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Remover</Button>}</div>
      {value && <p className="text-xs text-muted-foreground truncate">Atual: {value}</p>}
    </div>
  );
}

type Review = { name?: string; date?: string; stars?: number; text?: string; helpful?: string };
function ReviewsEditor({ value, onChange }: { value: Review[]; onChange: (v: Review[]) => void }) {
  const update = (i: number, patch: Partial<Review>) => onChange(value.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  return <div className="space-y-3">{value.map((r, i) => <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/20"><div className="flex justify-between text-xs text-muted-foreground"><span>Avaliação #{i + 1}</span><button onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></button></div><div className="grid grid-cols-2 gap-2"><Input placeholder="Nome" value={r.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} /><Input placeholder="Data" value={r.date ?? ""} onChange={(e) => update(i, { date: e.target.value })} /><Input type="number" min={1} max={5} value={r.stars ?? 5} onChange={(e) => update(i, { stars: Number(e.target.value) })} /><Input placeholder="Curtidas" value={r.helpful ?? ""} onChange={(e) => update(i, { helpful: e.target.value })} /></div><Textarea rows={2} placeholder="Comentário" value={r.text ?? ""} onChange={(e) => update(i, { text: e.target.value })} /></div>)}<Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { stars: 5 }])}><Plus className="w-4 h-4 mr-1" />Adicionar avaliação</Button></div>;
}

type Similar = { name?: string; developer?: string; rating?: string; icon_url?: string | null };
function SimilarEditor({ value, onChange }: { value: Similar[]; onChange: (v: Similar[]) => void }) {
  const update = (i: number, patch: Partial<Similar>) => onChange(value.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  return <div className="space-y-3">{value.map((r, i) => <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/20"><div className="flex justify-between text-xs text-muted-foreground"><span>App #{i + 1}</span><button onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></button></div><div className="grid grid-cols-2 gap-2"><Input placeholder="Nome" value={r.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} /><Input placeholder="Desenvolvedor" value={r.developer ?? ""} onChange={(e) => update(i, { developer: e.target.value })} /><Input placeholder="Nota" value={r.rating ?? ""} onChange={(e) => update(i, { rating: e.target.value })} /></div><ImageUpload label="Ícone" aspect="square" value={r.icon_url ?? null} onChange={(url) => update(i, { icon_url: url })} /></div>)}<Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, {}])}><Plus className="w-4 h-4 mr-1" />Adicionar semelhante</Button></div>;
}