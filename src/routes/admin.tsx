import { createFileRoute } from "@tanstack/react-router";
import AdminPageDefault from "@/components/AdminPage";

export const Route = createFileRoute("/admin")({
  component: AdminPageDefault,
});
