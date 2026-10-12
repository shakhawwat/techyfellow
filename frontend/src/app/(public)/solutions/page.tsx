import { ServiceGroupPage, serviceMetadata } from '@/components/public/service-pages';
export const dynamic = 'force-dynamic';
export function generateMetadata() { return serviceMetadata('solutions'); }
export default function Page() { return <ServiceGroupPage group="solutions"/>; }
