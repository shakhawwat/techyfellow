import { AcademyLanding } from '@/components/public/academy-landing';
import { academyAboutMetadata } from '@/components/public/academy-about';
export const dynamic = 'force-dynamic';
export function generateMetadata() { return academyAboutMetadata('academy'); }
export default async function Page({searchParams}:{searchParams:Promise<import('@/lib/public/pages').Search>}) { return <AcademyLanding search={await searchParams}/>; }
