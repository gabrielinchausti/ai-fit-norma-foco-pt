"use client";

import { Suspense } from "react";
import ChatPage from "./ChatPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Carregando…</div>}>
      <ChatPage />
    </Suspense>
  );
}