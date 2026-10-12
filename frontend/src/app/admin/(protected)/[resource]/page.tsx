import { notFound } from "next/navigation";
import { isResource } from "@/lib/admin/contracts";
import { ContentList } from "@/components/admin/content-list";
export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params; if (!isResource(resource)) notFound(); return <ContentList key={resource} resource={resource} />;
}
