import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/*_-=+#$%@";
    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = Array(columns).fill(1);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = Array(columns).fill(1);
    };
    window.addEventListener("resize", handleResize);

    let raf = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // brighter head
        if (Math.random() > 0.975) {
          ctx.fillStyle = "#d1ffd1";
        } else {
          ctx.fillStyle = "#00ff6a";
        }
        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden
    />
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [boot, setBoot] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const lines = [
      "> initializing secure shell...",
      "> connection: 192.168.0.1 :: encrypted",
      "> loading kernel modules... [OK]",
      "> access restricted :: authorization required",
    ];
    let i = 0;
    const id = setInterval(() => {
      setBoot((prev) => (i < lines.length ? [...prev, lines[i++]] : prev));
      if (i >= lines.length) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("ACCESS GRANTED");
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "ACCESS DENIED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black font-mono text-[#00ff6a]">
      <MatrixRain />
      {/* scanline + vignette overlays */}
      <div
        className="pointer-events-none fixed inset-0 -z-[5]"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-[4]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)",
        }}
        aria-hidden
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div
            className="rounded-md border border-[#00ff6a]/40 bg-black/70 backdrop-blur-sm"
            style={{
              boxShadow:
                "0 0 30px rgba(0,255,106,0.25), inset 0 0 20px rgba(0,255,106,0.08)",
            }}
          >
            {/* terminal header */}
            <div className="flex items-center justify-between border-b border-[#00ff6a]/30 px-4 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00ff6a]/70 shadow-[0_0_6px_#00ff6a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#00ff6a]/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#00ff6a]/20" />
              </div>
              <span className="tracking-widest opacity-70">root@matrix ~ #</span>
            </div>

            <div className="p-6">
              <div className="mb-4 space-y-1 text-xs leading-relaxed opacity-80">
                {boot.map((l, i) => (
                  <div key={i} className="animate-fade-in">{l}</div>
                ))}
              </div>

              <h1
                className="mb-4 text-center text-3xl font-bold tracking-[0.35em]"
                style={{ textShadow: "0 0 10px #00ff6a, 0 0 20px #00ff6a80" }}
              >
                ACCESS
              </h1>

              <form onSubmit={submit} className="space-y-4 text-sm">
                <div>
                  <label htmlFor="email" className="mb-1 block opacity-80">
                    &gt; user@id:
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    spellCheck={false}
                    className="w-full border border-[#00ff6a]/40 bg-black/60 px-3 py-2 text-[#00ff6a] caret-[#00ff6a] outline-none placeholder:text-[#00ff6a]/30 focus:border-[#00ff6a] focus:shadow-[0_0_10px_#00ff6a80]"
                    placeholder="operator@matrix"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1 block opacity-80">
                    &gt; passkey:
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    className="w-full border border-[#00ff6a]/40 bg-black/60 px-3 py-2 text-[#00ff6a] caret-[#00ff6a] outline-none placeholder:text-[#00ff6a]/30 focus:border-[#00ff6a] focus:shadow-[0_0_10px_#00ff6a80]"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full border border-[#00ff6a] bg-[#00ff6a]/10 py-2.5 font-bold tracking-[0.3em] text-[#00ff6a] transition hover:bg-[#00ff6a]/20 hover:shadow-[0_0_20px_#00ff6a] disabled:opacity-50"
                  style={{ textShadow: "0 0 8px #00ff6a" }}
                >
                  {loading ? "AUTHENTICATING..." : "[ ENTER THE MATRIX ]"}
                </button>

                <div className="flex items-center gap-2 pt-2 text-[10px] opacity-60">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#00ff6a] shadow-[0_0_6px_#00ff6a]" />
                  <span>secure channel active · trace: disabled</span>
                </div>

                <Link
                  to="/"
                  className="block text-center text-xs opacity-60 transition hover:opacity-100 hover:underline"
                >
                  &lt; return to surface
                </Link>
              </form>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] tracking-widest opacity-50">
            THE MATRIX HAS YOU · FOLLOW THE WHITE RABBIT
          </p>
        </div>
      </div>
    </main>
  );
}
