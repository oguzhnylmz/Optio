import type { Metadata } from "next";

import AppointmentsPage from "@/components/dashboard/AppointmentsPage";

export const metadata: Metadata = {
  title: "Randevular | Optio",
  description:
    "İşletmenizin randevularını yönetin.",
};

export default function AppointmentsRoute() {
  return <AppointmentsPage />;
}