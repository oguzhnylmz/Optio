import type { Metadata } from "next";

import EmployeesPage from "@/components/dashboard/EmployeesPage";

export const metadata: Metadata = {
  title: "Çalışanlar | Optio",
  description:
    "İşletmenizin çalışanlarını yönetin.",
};

export default function EmployeesRoute() {
  return <EmployeesPage />;
}