import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { NavigationItem } from "./navigation";

type Props = { links: readonly NavigationItem[]; wordmarkHref?: string; demo?: boolean };

export function Footer({ links, wordmarkHref = "/", demo = false }: Props) {
  return <footer className="site-footer" data-theme="dark">
    <Container>
      <div className="footer-top"><a className="wordmark" href={wordmarkHref}>Techy<span>Fellow</span><span className="wordmark-dot" aria-hidden="true" /></a>
        {demo && <p>Shared interface preview. Demo destinations only.</p>}
      </div>
      <nav aria-label="Footer navigation" className="footer-nav">{links.map(link => <a key={link.label} href={link.href}>{link.label}<ArrowUpRight aria-hidden="true" /></a>)}</nav>
      {demo && <div className="footer-bottom"><span>Text wordmark · Approved logo pending</span><span>Development preview</span></div>}
    </Container>
  </footer>;
}
