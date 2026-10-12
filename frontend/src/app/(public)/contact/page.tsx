import { InquiryPage, inquiryMetadata } from '@/components/public/inquiry-page';
import type { InquirySearch } from '@/lib/inquiry/schema';
export const dynamic = 'force-dynamic';
export function generateMetadata() { return inquiryMetadata(false); }
export default async function Page({ searchParams }: { searchParams: Promise<InquirySearch> }) { return <InquiryPage search={await searchParams} />; }
