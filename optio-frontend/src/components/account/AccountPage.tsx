"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getCustomerAppointments,
  getMe,
  type AuthUser,
  type CustomerAppointment,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

function formatAppointmentDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      dateStyle: "long",
      timeStyle: "short",
    },
  ).format(date);
}

function getStatusStyle(
  status: string,
) {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "confirmed":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";

    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "cancelled":
    case "canceled":
      return "bg-red-50 text-red-600 border-red-100";

    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

function formatStatus(
  status: string,
) {
  switch (status.toLowerCase()) {
    case "pending":
      return "Bekliyor";

    case "confirmed":
      return "Onaylandı";

    case "completed":
      return "Tamamlandı";

    case "cancelled":
    case "canceled":
      return "İptal edildi";

    default:
      return status;
  }
}

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [appointments, setAppointments] =
    useState<CustomerAppointment[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const token =
        getAccessToken();

      if (!token) {
        router.replace(
          "/login",
        );
        return;
      }

      try {
        const [
          userData,
          appointmentData,
        ] =
          await Promise.all([
            getMe(token),
            getCustomerAppointments(
              token,
            ),
          ]);

        if (cancelled) {
          return;
        }

        setUser(userData);
        setAppointments(
          appointmentData,
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        clearAccessToken();

        setError(
          err instanceof Error
            ? err.message
            : "Hesap bilgileri yüklenemedi.",
        );

        router.replace(
          "/login",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    clearAccessToken();
    router.push("/");
    router.refresh();
  }

  const upcomingAppointments =
    appointments.filter(
      (appointment) => {
        const appointmentDate =
          new Date(
            appointment.start_at,
          );

        return (
          !Number.isNaN(
            appointmentDate.getTime(),
          ) &&
          appointmentDate >=
            new Date() &&
          ![
            "completed",
            "cancelled",
            "canceled",
          ].includes(
            appointment.status.toLowerCase(),
          )
        );
      },
    );

  const pastAppointments =
    appointments.filter(
      (appointment) => {
        const appointmentDate =
          new Date(
            appointment.start_at,
          );

        return (
          appointmentDate <
            new Date() ||
          [
            "completed",
            "cancelled",
            "canceled",
          ].includes(
            appointment.status.toLowerCase(),
          )
        );
      },
    );

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[#f7f8ff]">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center px-5 sm:px-8">
          <div className="rounded-2xl border border-indigo-100 bg-white px-7 py-5 text-sm font-semibold text-slate-500 shadow-sm">
            Hesabınız yükleniyor...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      {/* HERO */}
      <section className="border-b border-indigo-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Hesabım
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Hoş geldin
                {user?.first_name
                  ? `, ${user.first_name}`
                  : ""}
                .
              </h1>

              <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
                Randevularını görüntüle ve hesabını kolayca
                yönet.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-xl border border-indigo-100 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        {error && (
          <div className="mb-7 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* ACCOUNT INFO */}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg">
              👤
            </div>

            <div className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
              Profil
            </div>

            <div className="mt-2 text-lg font-bold text-slate-950">
              {user?.first_name ||
              user?.last_name
                ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
                : "Kullanıcı"}
            </div>

            <div className="mt-2 break-all text-sm text-slate-500">
              {user?.email ||
                "E-posta bilgisi yok"}
            </div>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-lg">
              📅
            </div>

            <div className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-violet-500">
              Yaklaşan
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-950">
              {upcomingAppointments.length}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              yaklaşan randevu
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg">
              ✓
            </div>

            <div className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-500">
              Toplam
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-950">
              {appointments.length}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              kayıtlı randevu
            </div>
          </div>
        </div>

        {/* UPCOMING */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Randevularım
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Yaklaşan randevular
              </h2>
            </div>

            <Link
              href="/"
              className="hidden text-sm font-bold text-indigo-600 hover:text-indigo-700 sm:block"
            >
              Yeni randevu →
            </Link>
          </div>

          <div className="mt-6">
            {upcomingAppointments.length ===
            0 ? (
              <div className="rounded-3xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  📅
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  Henüz yaklaşan randevun yok.
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Kendin için biraz zaman ayır ve yeni bir
                  randevu oluştur.
                </p>

                <Link
                  href="/"
                  className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  Randevu keşfet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map(
                  (
                    appointment,
                  ) => (
                    <article
                      key={
                        appointment.id
                      }
                      className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                            ✨
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-950">
                              {appointment.service_name ||
                                "Randevu"}
                            </h3>

                            <div className="mt-1 text-sm font-medium text-slate-500">
                              {appointment.business_name ||
                                "İşletme"}
                            </div>

                            {appointment.employee_name && (
                              <div className="mt-1 text-sm text-slate-400">
                                {appointment.employee_name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:items-end">
                          <div className="text-sm font-bold text-slate-900">
                            {formatAppointmentDate(
                              appointment.start_at,
                            )}
                          </div>

                          <span
                            className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                              appointment.status,
                            )}`}
                          >
                            {formatStatus(
                              appointment.status,
                            )}
                          </span>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {/* PAST */}
        <section className="mt-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Geçmiş
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Geçmiş randevular
            </h2>
          </div>

          <div className="mt-6">
            {pastAppointments.length ===
            0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-7 text-sm text-slate-500">
                Henüz geçmiş randevun bulunmuyor.
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
                <div className="divide-y divide-indigo-50">
                  {pastAppointments.map(
                    (
                      appointment,
                    ) => (
                      <div
                        key={
                          appointment.id
                        }
                        className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {appointment.service_name ||
                              "Randevu"}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            {appointment.business_name ||
                              "İşletme"}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          <div className="text-sm font-medium text-slate-600">
                            {formatAppointmentDate(
                              appointment.start_at,
                            )}
                          </div>

                          <span
                            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                              appointment.status,
                            )}`}
                          >
                            {formatStatus(
                              appointment.status,
                            )}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-indigo-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-[15px] text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="font-bold text-slate-950"
          >
            Optio
          </Link>

          <span>
            Daha fazla müşteri, daha mutlu günler.
          </span>

          <span>
            © 2026 Optio
          </span>
        </div>
      </footer>
    </main>
  );
}