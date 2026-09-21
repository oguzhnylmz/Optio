import type { Metadata } from "next";

import ServicesPage from "@/components/dashboard/ServicesPage";

export const metadata: Metadata = {
  title: "Hizmetler | Optio",
  description:
    "İşletmenizin hizmetlerini yönetin.",
};

export default function ServicesRoute() {
  return <ServicesPage />;
}