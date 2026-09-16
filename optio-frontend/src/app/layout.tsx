import type { Metadata } from "next";

import "./globals.css";

import Header from "@/components/layout/Header";

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
    <html lang="tr">
      <body className="antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}