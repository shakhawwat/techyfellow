import type { HTMLAttributes } from "react";
import { classes } from "@/lib/classes";
import { Container } from "./container";

type Props = HTMLAttributes<HTMLElement> & { tone?: "light" | "dark" | "navy" };

export function Section({ tone = "light", className, children, ...props }: Props) {
  return <section data-theme={tone === "light" ? "light" : "dark"} data-surface={tone}
    className={classes("section-shell bg-background text-foreground", className)} {...props}>
    <Container>{children}</Container>
  </section>;
}
