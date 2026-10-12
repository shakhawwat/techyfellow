"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { api, errorOf, session, type ApiError } from "@/lib/admin/api";
import { labels, resources, type Resource, type User } from "@/lib/admin/contracts";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Context = { user: User; can: (resource: Resource | "leads", action: string) => boolean; call: <T>(path: string, method?: string, body?: unknown) => Promise<T>; notify: (message: string) => void };
const AdminContext = createContext<Context | null>(null);
export function useAdmin(): Context { const value = useContext(AdminContext); if (!value) throw new Error("Admin session required"); return value; }
export function AdminSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [identity, setIdentity] = useState<Awaited<ReturnType<typeof session>> | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const expire = useCallback(() => { setIdentity(null); router.replace("/admin/login"); }, [router]);
  const call = useCallback(async <T,>(path: string, method?: string, body?: unknown): Promise<T> => {
    try { return await api<T>(path, method, body); } catch (failure) { const e = errorOf(failure); if (e.status === 401) expire(); throw e; }
  }, [expire]);
  useEffect(() => {
    let active = true;
    const check = async () => {
      try { const result = await session(); if (active) { setIdentity(result); setError(null); } }
      catch (failure) { if (!active) return; const e = errorOf(failure); if (e.status === 401) expire(); else { setIdentity(null); setError(e); } }
    };
    void check();
    const visible = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; document.removeEventListener("visibilitychange", visible); };
  }, [attempt, expire]);
  if (!identity) return <main className="admin-login"><Card><ShieldCheck aria-hidden="true" /><h1>{error?.status === 403 ? "Access denied" : error ? "Unable to verify access" : "Verifying your session…"}</h1>
    {error ? <><p role="alert">{error.message}</p>{error.code === "ADMIN_ACCOUNT_REQUIRED" && <p><Link href="/admin/login">Sign in with an admin account</Link></p>}<Button onClick={() => { setError(null); setAttempt(previous => previous + 1); }}>Retry session check</Button></> : <p role="status">Protected content stays hidden while access is checked.</p>}</Card></main>;
  const can = (resource: Resource | "leads", action: string) => identity.permissions.includes(`${resource}:${action}`);
  async function logout() {
    setLoggingOut(true); setNotice("");
    try { await call("/auth/logout", "POST", {}); expire(); }
    catch (failure) { setError(errorOf(failure)); } finally { setLoggingOut(false); }
  }
  return <AdminContext.Provider value={{ user: identity.user, can, call, notify: setNotice }}>
    <a href="#admin-main" className="skip-link">Skip to content</a>
    <Navbar wordmarkHref="/admin" links={[...resources.filter(resource => can(resource, "read")).map(resource => ({ label: labels[resource], href: `/admin/${resource}` })), ...(can("courses", "edit") ? [{ label: "Academy", href: "/admin/academy" }, { label: "Academy access", href: "/admin/academy-access" }] : []), ...(can("leads", "read") ? [{ label: "Leads", href: "/admin/leads" }] : []), ...(resources.some(resource => can(resource, "read")) ? [{ label: "Media", href: "/admin/media" }] : [])]} />
    <div className="admin-session-bar"><Container><span><ShieldCheck aria-hidden="true" />{identity.user.role.replaceAll("_", " ")}<span className="admin-email">{identity.user.email}</span></span>
      <Button variant="ghost" loading={loggingOut} loadingLabel="Signing out…" onClick={logout}><LogOut aria-hidden="true" />Log out</Button></Container></div>
    <main id="admin-main" tabIndex={-1} className="admin-main"><Container>
      {error && <p className="admin-alert" role="alert">{error.message}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}
      {children}
    </Container></main>
  </AdminContext.Provider>;
}
export function ResourceGate({ resource, edit = false, children }: { resource: Resource; edit?: boolean; children: ReactNode }) {
  const { can } = useAdmin();
  if (!can(resource, edit ? "edit" : "read")) return <Card><h1>Access denied</h1><p role="alert">Your role does not permit this resource or action.</p></Card>;
  return children;
}
