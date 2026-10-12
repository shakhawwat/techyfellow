import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";

export const metadata: Metadata = { title: "Techy Fellow" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className={`${GeistSans.variable} ${GeistMono.variable}`}>{children}</body></html>;
}
