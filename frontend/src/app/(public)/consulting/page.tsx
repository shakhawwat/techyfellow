import { ServiceGroupPage, serviceMetadata } from '@/components/public/service-pages';
export const dynamic = 'force-dynamic';
export function generateMetadata() { return serviceMetadata('consulting'); }
export default function Page() { return <ServiceGroupPage group="consulting"/>; }
