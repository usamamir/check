import { Suspense } from "react";

export default function OutreachLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>{children}</Suspense>;
}
