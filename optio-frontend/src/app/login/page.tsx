import type { Metadata } from "next";

import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Giriş Yap | Optio",
  description:
    "Optio hesabınıza giriş yapın.",
};

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f7f8ff]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center px-5 py-12 sm:px-8">
        <AuthCard mode="login" />
      </div>
    </main>
  );
}