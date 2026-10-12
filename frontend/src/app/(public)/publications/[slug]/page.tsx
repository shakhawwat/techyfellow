import { DetailPage, detailMetadata } from '@/components/public/content-pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return detailMetadata('publications', (await params).slug); }
export default async function Page({ params }: Props) { return <DetailPage kind="publications" slug={(await params).slug}/>; }
