import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  onUploaded?: (asset: { path: string; url: string }) => void;
  label?: string;
  aspect?: "square" | "wide" | "tall";
}

function publicSiteAssetUrl(path: string) {
  return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
}

export function siteAssetDisplayUrl(url: string | null | undefined) {
  if (!url) return null;
  if (typeof window === "undefined") return url;
  // Legacy URLs like "/api/public/site-asset?path=..." → convert to public storage URL.
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith("/api/public/site-asset")) {
      const path = parsed.searchParams.get("path");
      if (path) return publicSiteAssetUrl(path);
    }
  } catch {}
  return url;
}

export function ImageUpload({ value, onChange, onUploaded, label = "Imagem", aspect = "square" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem maior que 5MB");
      return;
    }
    setBusy(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Faça login novamente para enviar arquivos.");
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${userId}/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const url = publicSiteAssetUrl(path);
      onUploaded?.({ path, url });
      onChange(url);
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setBusy(false);
    }
  };

  const aspectCls =
    aspect === "wide" ? "aspect-video" : aspect === "tall" ? "aspect-[9/16]" : "aspect-square";
  const displayValue = siteAssetDisplayUrl(value);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className={`relative ${aspectCls} w-full max-w-xs border-2 border-dashed rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center`}>
        {displayValue ? (
          <>
            <img src={displayValue} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-1 right-1 bg-foreground/70 text-background rounded-full p-1 hover:bg-foreground/90"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-xs text-muted-foreground text-center p-2">Nenhuma imagem</div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-background animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
        <Upload className="w-4 h-4 mr-2" /> {value ? "Trocar" : "Enviar foto"}
      </Button>
    </div>
  );
}

export function MultiImageUpload({
  value,
  onChange,
  label = "Imagens",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const add = (url: string | null) => url && onChange([...(value ?? []), url]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label} ({value.length})</div>
      <div className="grid grid-cols-3 gap-2">
        {value.map((u, i) => (
          <div key={i} className="relative aspect-[9/16] rounded-md overflow-hidden border bg-muted/30">
            <img src={siteAssetDisplayUrl(u) ?? u} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-foreground/70 text-background rounded-full p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <ImageUpload value={null} onChange={add} label="Adicionar" aspect="tall" />
    </div>
  );
}