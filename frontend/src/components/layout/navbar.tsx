"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { NavigationItem } from "./navigation";

type Props = { links: readonly NavigationItem[]; wordmarkHref?: string; demo?: boolean };

export function Navbar({ links, wordmarkHref = "/", demo = false }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const wordmark = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1280px)");
    const resize = () => { if (desktop.matches) dialog.current?.close(); };
    desktop.addEventListener("change", resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", resize);
    };
  }, [open]);

  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex='0']");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function closeMenu() { dialog.current?.close(); }
  function restoreFocus() {
    setOpen(false);
    (window.matchMedia("(min-width: 1280px)").matches ? wordmark.current : trigger.current)?.focus();
  }
  function menuLinkClick(href: string) {
    closeMenu();
    if (href.startsWith("#")) {
      requestAnimationFrame(() => document.getElementById(href.slice(1))?.focus());
    }
  }

  return <header className="site-header" data-theme="dark">
    <Container className="navbar-shell">
      <a ref={wordmark} className="wordmark" href={wordmarkHref} aria-label="Techy Fellow home">Techy<span>Fellow</span><span className="wordmark-dot" aria-hidden="true" /></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(link => <a key={link.label} href={link.href} className={link.label === "Build With Us" ? "nav-cta" : "nav-link"}>
          {link.label}{link.label === "Build With Us" && <ArrowUpRight aria-hidden="true" />}
        </a>)}
      </nav>
      <button ref={trigger} className="menu-trigger" type="button" aria-label="Open navigation menu" aria-expanded={open}
        aria-controls="mobile-navigation" aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
        <Menu aria-hidden="true" />
      </button>
      <dialog ref={dialog} id="mobile-navigation" className="mobile-menu" aria-labelledby="mobile-menu-title" onClose={restoreFocus} onKeyDown={containFocus}
        onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}>
        <div className="mobile-menu-heading"><h2 id="mobile-menu-title">Navigation</h2>
          <button autoFocus type="button" className="menu-trigger" aria-label="Close navigation menu" onClick={closeMenu}><X aria-hidden="true" /></button>
        </div>
        {demo && <p className="mobile-menu-note">Demo links stay within this preview.</p>}
        <nav aria-label="Mobile navigation">{links.map(link => <a key={link.label} href={link.href} onClick={() => menuLinkClick(link.href)}>
          {link.label}<ArrowUpRight aria-hidden="true" />
        </a>)}</nav>
      </dialog>
    </Container>
  </header>;
}
