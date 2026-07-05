import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MatrixRain } from "@/components/MatrixRain";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
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
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("ACCESS GRANTED");
        navigate({ to: "/admin", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("OPERATOR REGISTERED :: JACKING IN");
          navigate({ to: "/admin", replace: true });
        } else {
          toast.success("CHECK YOUR INBOX TO CONFIRM");
          setMode("signin");
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "ACCESS DENIED");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "signin" ? "ACCESS" : "REGISTER";
  const cta = mode === "signin" ? "[ ENTER THE MATRIX ]" : "[ CREATE OPERATOR ]";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black font-mono text-[#00ff6a]">
      <MatrixRain />
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

              {/* mode tabs */}
              <div className="mb-5 grid grid-cols-2 gap-0 border border-[#00ff6a]/30 text-xs tracking-[0.25em]">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`py-2 transition ${
                    mode === "signin"
                      ? "bg-[#00ff6a]/15 text-[#00ff6a] shadow-[inset_0_0_12px_#00ff6a55]"
                      : "text-[#00ff6a]/50 hover:text-[#00ff6a]/80"
                  }`}
                >
                  LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`py-2 transition ${
                    mode === "signup"
                      ? "bg-[#00ff6a]/15 text-[#00ff6a] shadow-[inset_0_0_12px_#00ff6a55]"
                      : "text-[#00ff6a]/50 hover:text-[#00ff6a]/80"
                  }`}
                >
                  CRIAR CONTA
                </button>
              </div>

              <h1
                className="mb-4 text-center text-3xl font-bold tracking-[0.35em]"
                style={{ textShadow: "0 0 10px #00ff6a, 0 0 20px #00ff6a80" }}
              >
                {title}
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
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
                  {loading ? "PROCESSING..." : cta}
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
