import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { classes } from "@/lib/classes";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "research";
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({ variant = "primary", loading = false, loadingLabel = "Loading…",
  disabled, type = "button", children, className, ...props }: Props) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
    className={classes("button", `button-${variant}`, className)}>
    {loading && <LoaderCircle className="loading-icon" aria-hidden="true" />}
    {loading ? loadingLabel : children}
  </button>;
}
