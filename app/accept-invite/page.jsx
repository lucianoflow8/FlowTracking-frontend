// app/accept-invite/page.jsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import AcceptInviteClient from "./AcceptInviteClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Verificando invitación…</div>}>
      <AcceptInviteClient />
    </Suspense>
  );
}