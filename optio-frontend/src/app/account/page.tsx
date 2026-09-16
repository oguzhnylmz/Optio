import type { Metadata } from "next";

import AccountPage from "@/components/account/AccountPage";

export const metadata: Metadata = {
  title: "Hesabım | Optio",
  description:
    "Optio randevularınızı ve hesabınızı yönetin.",
};

export default function AccountRoute() {
  return <AccountPage />;
}