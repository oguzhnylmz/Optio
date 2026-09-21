"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/layout/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();

  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute) {
    return null;
  }

  return <Header />;
}