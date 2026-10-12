import type { HTMLAttributes } from "react";
import { classes } from "@/lib/classes";

type Props = HTMLAttributes<HTMLSpanElement> & { variant?: "neutral" | "accent" | "research" | "success" };

export function Badge({ variant = "neutral", className, ...props }: Props) {
  return <span className={classes("badge", `badge-${variant}`, className)} {...props} />;
}
