// Extrai dados básicos de uma página da Play Store (nome, ícone, screenshots, descrição).
// Faz o parse do HTML retornado por play.google.com.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function pickMeta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]+)"`, "i");
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractImages(html: string): string[] {
  const urls = new Set<string>();
  const re = /https:\/\/play-lh\.googleusercontent\.com\/[A-Za-z0-9_\-]+(?:=[A-Za-z0-9\-_]+)?/g;
  let m;
  while ((m = re.exec(html))) urls.add(m[0].replace(/=.*$/, "=w1024"));
  return Array.from(urls);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { url } = await req.json();
    if (!url || !String(url).includes("play.google.com")) {
      throw new Error("URL inválida");
    }
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36" },
    });
    const html = await res.text();

    const name = pickMeta(html, "og:title") || "";
    const description = pickMeta(html, "og:description") || pickMeta(html, "description") || "";
    const icon = pickMeta(html, "og:image") || "";
    const images = extractImages(html);
    const screenshots = images.filter((u) => u !== icon).slice(0, 8);

    const payload = {
      ok: true,
      name,
      counts: { screenshots: screenshots.length, reviews: 0, descriptionChars: description.length, downloadedImages: 0 },
      data: { name, description, icon, screenshots, url },
    };
    return new Response(JSON.stringify(payload), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(e?.message || e),
        name: "Importação não concluída",
        counts: { screenshots: 0, reviews: 0, descriptionChars: 0, downloadedImages: 0 },
      }),
      { status: 200, headers: { ...cors, "content-type": "application/json" } },
    );
  }
});
