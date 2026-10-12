import { detailMetadata } from '@/components/public/content-pages';
import { ResearchRecordPage } from '@/components/public/research-pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return detailMetadata('research', (await params).slug); }
export default async function Page({ params }: Props) { return <ResearchRecordPage slug={(await params).slug}/>; }
