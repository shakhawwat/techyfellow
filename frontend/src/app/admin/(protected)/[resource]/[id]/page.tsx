import { notFound } from "next/navigation";
import { isResource } from "@/lib/admin/contracts";
import { ContentEditor } from "@/components/admin/content-editor";
export default async function EditPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params; if (!isResource(resource) || !/^[a-f0-9]{24}$/.test(id)) notFound(); return <ContentEditor resource={resource} id={id} />;
}
