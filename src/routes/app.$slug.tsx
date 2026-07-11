import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$slug")({
  component: AppSlugPage,
});

function AppSlugPage() {
  const { slug } = Route.useParams();
  return (
    <iframe
      src={`/clone/index.html?project=${encodeURIComponent(slug)}`}
      title={`App ${slug}`}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}