// app/login/page.js
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando login…</div>}>
      <LoginClient />
    </Suspense>
  );
}