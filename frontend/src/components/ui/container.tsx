import type { HTMLAttributes } from "react";
import { classes } from "@/lib/classes";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes("container-shell", className)} {...props} />;
}
