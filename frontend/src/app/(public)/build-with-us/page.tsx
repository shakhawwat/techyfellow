import { InquiryPage, inquiryMetadata } from '@/components/public/inquiry-page';
export const dynamic = 'force-dynamic';
export function generateMetadata() { return inquiryMetadata(true); }
export default function Page() { return <InquiryPage engineering />; }
