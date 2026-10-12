import { AboutPage, academyAboutMetadata } from '@/components/public/academy-about';
export const dynamic = 'force-dynamic';
export function generateMetadata() { return academyAboutMetadata('about'); }
export default function Page() { return <AboutPage/>; }
