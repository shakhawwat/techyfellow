import { DetailPage, detailMetadata } from '@/components/public/content-pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return detailMetadata('team', (await params).slug); }
export default async function Page({ params }: Props) { return <DetailPage kind="team" slug={(await params).slug}/>; }
