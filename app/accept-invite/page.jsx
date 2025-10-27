export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";

export default function Page({ searchParams }) {
  const qs = new URLSearchParams(searchParams).toString();
  redirect(`/accept-invite${qs ? `?${qs}` : ""}`);
}