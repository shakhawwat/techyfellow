import { notFound } from "next/navigation";
import { isResource } from "@/lib/admin/contracts";
import { ContentEditor } from "@/components/admin/content-editor";
export default async function CreatePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params; if (!isResource(resource)) notFound(); return <ContentEditor resource={resource} />;
}
