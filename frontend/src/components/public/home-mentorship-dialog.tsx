"use client";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
export function HomeMentorshipDialog({ title, children, busy, onCancel, onConfirm, presentation = "confirm", className, headerClassName, contentClassName, onEscape, detailsLabel = "Project details", closeLabel = "Close project details" }: { title: string; children: ReactNode; busy: boolean; onCancel: () => void; onConfirm?: () => void; presentation?: "confirm" | "details"; className?: string; headerClassName?: string; contentClassName?: string; onEscape?: () => void; detailsLabel?: string; closeLabel?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current; element?.showModal();
    const overflow = document.body.style.overflow, padding = document.body.style.paddingRight;
    if (presentation === "details") {
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      if (gutter > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + gutter}px`;
    }
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; document.body.style.paddingRight = padding; previous?.focus({ preventScroll: true }); };
  }, [presentation]);
  function trap(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),a[href],iframe,[tabindex='0']"));
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <dialog ref={dialog} className={presentation === "details" ? className : "admin-dialog"} data-theme={presentation === "details" ? "dark" : undefined} aria-labelledby="action-title" onKeyDown={trap} onCancel={event => { event.preventDefault(); if (!busy) { if (presentation === "details" && onEscape) onEscape(); else onCancel(); } }}>
    {presentation === "details" ? <><header className={headerClassName}><Button variant="ghost" autoFocus aria-label={closeLabel} onClick={onCancel}><X aria-hidden="true"/></Button><h2 id="action-title">{title}</h2></header><div className={contentClassName} tabIndex={0} role="region" aria-label={detailsLabel}>{children}</div></> : <><h2 id="action-title">{title}</h2>{children}<div className="admin-actions"><Button variant="secondary" autoFocus disabled={busy} onClick={onCancel}>Cancel</Button><Button loading={busy} loadingLabel="Confirming…" onClick={onConfirm}>Confirm {title.toLowerCase()}</Button></div></>}
  </dialog>;
}
