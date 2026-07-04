import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <iframe
      src="/clone/index.html"
      title="Google Play Clone"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}
