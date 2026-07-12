import { createFileRoute } from "@tanstack/react-router";
import SaasAdminPage from "@/components/SaasAdminPage";
import { MatrixRain } from "@/components/MatrixRain";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
});

function AdminShell() {
  return (
    <div
      className="matrix-admin dark relative min-h-screen font-mono"
      style={
        {
          // Matrix-themed shadcn tokens (scoped to admin only)
          ["--background" as any]: "oklch(0.09 0.02 155)",
          ["--foreground" as any]: "oklch(0.92 0.22 148)",
          ["--card" as any]: "oklch(0.12 0.03 155 / 0.75)",
          ["--card-foreground" as any]: "oklch(0.92 0.22 148)",
          ["--popover" as any]: "oklch(0.11 0.03 155)",
          ["--popover-foreground" as any]: "oklch(0.92 0.22 148)",
          ["--primary" as any]: "oklch(0.85 0.24 145)",
          ["--primary-foreground" as any]: "oklch(0.1 0.02 155)",
          ["--secondary" as any]: "oklch(0.18 0.04 155)",
          ["--secondary-foreground" as any]: "oklch(0.92 0.22 148)",
          ["--muted" as any]: "oklch(0.15 0.03 155)",
          ["--muted-foreground" as any]: "oklch(0.7 0.15 148)",
          ["--accent" as any]: "oklch(0.22 0.08 148)",
          ["--accent-foreground" as any]: "oklch(0.92 0.22 148)",
          ["--destructive" as any]: "oklch(0.65 0.24 25)",
          ["--destructive-foreground" as any]: "oklch(0.98 0 0)",
          ["--border" as any]: "oklch(0.55 0.2 148 / 0.35)",
          ["--input" as any]: "oklch(0.55 0.2 148 / 0.4)",
          ["--ring" as any]: "oklch(0.85 0.24 145)",
          ["--sidebar" as any]: "oklch(0.08 0.02 155 / 0.85)",
          ["--sidebar-foreground" as any]: "oklch(0.92 0.22 148)",
          ["--sidebar-primary" as any]: "oklch(0.85 0.24 145)",
          ["--sidebar-primary-foreground" as any]: "oklch(0.1 0.02 155)",
          ["--sidebar-accent" as any]: "oklch(0.18 0.04 155)",
          ["--sidebar-accent-foreground" as any]: "oklch(0.92 0.22 148)",
          ["--sidebar-border" as any]: "oklch(0.55 0.2 148 / 0.3)",
          ["--sidebar-ring" as any]: "oklch(0.85 0.24 145)",
          color: "oklch(0.92 0.22 148)",
          background:
            "radial-gradient(ellipse at top, oklch(0.14 0.05 148) 0%, oklch(0.06 0.01 155) 60%, #000 100%)",
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.18]">
        <MatrixRain />
      </div>
      <div
        className="pointer-events-none fixed inset-0 -z-[5]"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-[4]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
        }}
        aria-hidden
      />
      <style>{`
        .matrix-admin { text-shadow: 0 0 1px rgba(0,255,106,0.25); }
        .matrix-admin h1, .matrix-admin h2, .matrix-admin h3, .matrix-admin [data-slot="card-title"] {
          text-shadow: 0 0 8px rgba(0,255,106,0.55), 0 0 16px rgba(0,255,106,0.25);
          letter-spacing: 0.04em;
        }
        .matrix-admin [data-slot="card"] {
          background: linear-gradient(180deg, rgba(0,20,10,0.75), rgba(0,10,6,0.85));
          border-color: rgba(0,255,106,0.28);
          box-shadow: 0 0 24px rgba(0,255,106,0.08), inset 0 0 20px rgba(0,255,106,0.05);
          backdrop-filter: blur(6px);
        }
        .matrix-admin aside {
          background: linear-gradient(180deg, rgba(0,15,8,0.92), rgba(0,8,4,0.95)) !important;
          border-right: 1px solid rgba(0,255,106,0.3);
          box-shadow: inset -1px 0 20px rgba(0,255,106,0.08);
        }
        .matrix-admin input, .matrix-admin textarea, .matrix-admin select {
          background: rgba(0,0,0,0.55) !important;
          border-color: rgba(0,255,106,0.35) !important;
          color: #00ff6a !important;
        }
        .matrix-admin input:focus, .matrix-admin textarea:focus, .matrix-admin select:focus {
          border-color: #00ff6a !important;
          box-shadow: 0 0 0 2px rgba(0,255,106,0.25), 0 0 12px rgba(0,255,106,0.45) !important;
        }
        .matrix-admin button[data-slot="button"] {
          text-shadow: 0 0 6px rgba(0,255,106,0.55);
        }
      `}</style>
      <div className="relative z-0">
        <SaasAdminPage />
      </div>
    </div>
  );
}
