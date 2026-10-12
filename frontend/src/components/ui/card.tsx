import type { HTMLAttributes } from "react";
import { classes } from "@/lib/classes";

type Props = HTMLAttributes<HTMLElement> & { variant?: "default" | "research" };

export function Card({ variant = "default", className, ...props }: Props) {
  return <article className={classes("card", variant === "research" && "card-research", className)} {...props} />;
}
