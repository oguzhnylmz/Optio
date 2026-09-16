import type { Metadata } from "next";

import CalendarPage from "@/components/dashboard/CalendarPage";

export const metadata: Metadata = {
  title: "Takvim | Optio",
  description:
    "İşletmenizin randevu takvimini görüntüleyin.",
};

export default function CalendarRoute() {
  return <CalendarPage />;
}