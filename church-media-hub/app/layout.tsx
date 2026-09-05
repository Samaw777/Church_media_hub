import type { Metadata } from "next";
import "./globals.css";
import { MemberProvider } from "@/components/MemberProvider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Media Team Hub",
  description: "Scheduling, livestream setup, troubleshooting, and checklists for the church media team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MemberProvider>
          <AppShell>{children}</AppShell>
        </MemberProvider>
      </body>
    </html>
  );
}
