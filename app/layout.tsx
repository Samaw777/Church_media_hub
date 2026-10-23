import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MemberProvider } from "@/components/MemberProvider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Media Team Hub",
  description: "Scheduling, livestream setup, troubleshooting, and checklists for the church media team.",
  // Opens full-screen from the iPhone home screen, with its own long-lived saved login.
  appleWebApp: {
    capable: true,
    title: "Media Hub",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#101315",
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
