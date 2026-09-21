import type { Metadata } from "next";

import CustomersPage from "@/components/dashboard/CustomersPage";

export const metadata: Metadata = {
  title: "Müşteriler | Optio",
  description:
    "İşletmenizin müşterilerini yönetin.",
};

export default function CustomersRoute() {
  return <CustomersPage />;
}