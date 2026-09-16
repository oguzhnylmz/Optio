import type { Metadata } from "next";

import DashboardPage from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard | Optio",
  description:
    "İşletmenizin randevularını Optio ile yönetin.",
};

export default function DashboardRoute() {
  return <DashboardPage />;
}