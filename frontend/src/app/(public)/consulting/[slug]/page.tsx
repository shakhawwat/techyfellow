import { ServicePage, serviceMetadata } from '@/components/public/service-pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return serviceMetadata('consulting', (await params).slug); }
export default async function Page({ params }: Props) { return <ServicePage group="consulting" slug={(await params).slug}/>; }
