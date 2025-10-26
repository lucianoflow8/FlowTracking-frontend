import { redirect } from "next/navigation";

export default function SettingsPage({ params }) {
  // Al entrar a /projects/[id]/settings te manda directo a "general"
  const { id } = params;
  redirect(`/projects/${id}/settings/general`);
  return null;
}