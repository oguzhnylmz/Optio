import type { Metadata } from "next";

import "./globals.css";

import ConditionalHeader from "@/components/layout/ConditionalHeader";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Optio | Kendine zaman ayır.",
  description:
    "Favori işletmenizi bulun, uygun zamanı seçin ve randevunuzu kolayca oluşturun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}