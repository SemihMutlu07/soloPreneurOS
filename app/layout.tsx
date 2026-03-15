import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "soloPreneurOS — Daily Dashboard",
  description: "AI-powered daily dashboard for EdTech solopreneurs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg antialiased">
        <Sidebar />
        <div className="lg:ml-48">
          {children}
        </div>
      </body>
    </html>
  );
}
