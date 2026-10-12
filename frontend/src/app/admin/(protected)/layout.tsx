import type { ReactNode } from "react";
import { AdminSession } from "@/components/admin/session";
export default function ProtectedLayout({ children }: { children: ReactNode }) { return <AdminSession>{children}</AdminSession>; }
