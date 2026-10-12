import { listMetadata } from '@/components/public/content-pages';
import { PublicationsPage } from '@/components/public/publication-pages';
import type { Search } from '@/lib/public/pages';
export const dynamic = 'force-dynamic';
type Props = { searchParams: Promise<Search> };
export async function generateMetadata({ searchParams }: Props) { return listMetadata('publications', await searchParams); }
export default async function Page({ searchParams }: Props) { return <PublicationsPage search={await searchParams}/>; }
