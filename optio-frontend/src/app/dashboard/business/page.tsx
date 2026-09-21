import type { Metadata } from "next";

import BusinessSettingsPage from "@/components/dashboard/BusinessSettingsPage";

export const metadata: Metadata = {
  title: "İşletmem | Optio",
  description:
    "İşletme bilgilerinizi güncelleyin.",
};

export default function Page() {
  return <BusinessSettingsPage />;
}