import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { pageCopy } from '@/content/public-pages';
export default function NotFound() { return <main id="public-main" tabIndex={-1}><Section><span className="eyebrow">404</span><h1 className="content-missing-title">{pageCopy.missingTitle}</h1><p>{pageCopy.missing}</p><Link className="button button-primary" href="/">Return home</Link></Section></main>; }
