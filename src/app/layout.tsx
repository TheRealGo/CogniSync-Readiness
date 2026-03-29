import type { Metadata } from "next";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";

export const metadata: Metadata = {
  title: "CogniSync-Readiness",
  description: "認知的レディネス計測ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <SidebarNav />
        <main className="ml-56 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}
