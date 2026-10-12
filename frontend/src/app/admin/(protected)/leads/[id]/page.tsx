import { LeadDetail } from '@/components/admin/leads';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <LeadDetail id={id}/>; }
