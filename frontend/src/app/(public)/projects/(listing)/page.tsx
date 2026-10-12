import { ListPage, listMetadata } from '@/components/public/content-pages';
import type { Search } from '@/lib/public/pages';
export const dynamic = 'force-dynamic';
type Props = { searchParams: Promise<Search> };
export async function generateMetadata({ searchParams }: Props) { return listMetadata('projects', await searchParams); }
export default async function Page({ searchParams }: Props) { return <ListPage kind="projects" search={await searchParams}/>; }
