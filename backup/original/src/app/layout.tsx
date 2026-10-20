import type { Metadata } from "next";
import "./globals.css";
import { brand } from "@/data/brand";

export const metadata: Metadata = {
  title: `${brand.name} — Ideas that reach further`,
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    title: `${brand.name} — Ideas that reach further`,
    description: brand.description,
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

