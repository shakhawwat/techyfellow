import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Design system · Techy Fellow", robots: { index: false, follow: false } };

export default async function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { DesignSystemPreview } = await import("@/components/design-system/preview");
  return <DesignSystemPreview />;
}
