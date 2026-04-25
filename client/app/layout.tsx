// Root layout wires the CrisisWeave dashboard shell and global styles for every page.
import type { Metadata } from "next";
import type React from "react";
import "antd/dist/reset.css";
import "./globals.css";
import { AppShell } from "../components/AppShell";
import { criticalStyles } from "./criticalStyles";

export const metadata: Metadata = {
  title: "CrisisWeave Dispatch Grid",
  description: "Smart city emergency transcript dispatch dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
