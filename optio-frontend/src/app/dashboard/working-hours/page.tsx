import type { Metadata } from "next";

import WorkingHoursPage from "@/components/dashboard/WorkingHoursPage";

export const metadata: Metadata = {
  title: "Çalışma Saatleri | Optio",
  description:
    "İşletme ve çalışan çalışma saatlerini yönetin.",
};

export default function WorkingHoursRoute() {
  return <WorkingHoursPage />;
}