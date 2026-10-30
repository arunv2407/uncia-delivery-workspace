import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: 'Uncia Delivery Workspace', description: 'Capacity, priorities and release visibility for more predictable delivery.' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
