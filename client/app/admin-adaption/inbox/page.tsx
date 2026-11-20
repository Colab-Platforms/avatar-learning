"use client";

import { Suspense } from "react";
import { InboxTabs } from "@/components/business-admin/inbox/InboxTabs";

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxTabs />
    </Suspense>
  );
}
