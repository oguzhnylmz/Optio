"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getMe,
  getOwnerAppointments,
  type AuthUser,
  type OwnerAppointment,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

function getStartOfToday() {
  const date = new Date();

  date.setHours(
    0,
    0,
    0,
    0,
  );

  return date;
}

function getEndOfToday() {
  const date = getStartOfToday();

  date.setDate(
    date.getDate() + 1,
  );

  return date;
}

function toUTCISOString(
  date: Date,
) {
  return date.toISOString();
}

function formatTime(
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
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatDate(
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
      day: "numeric",
      month: "long",
    },
  ).format(date);
}

function formatStatus(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case "pending":
      return "Bekliyor";

    case "confirmed":
      return "Onaylandı";

    case "completed":
      return "Tamamlandı";

    case "cancelled":
    case "canceled":
      return "İptal";

    case "no_show":
      return "Gelmedi";

    default:
      return status;
  }
}

function getStatusClasses(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case "confirmed":
      return "border-indigo-100 bg-indigo-50 text-indigo-700";

    case "completed":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "cancelled":
    case "canceled":
      return "border-red-100 bg-red-50 text-red-600";

    case "no_show":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

function getAppointmentLabel(
  appointment: OwnerAppointment,
) {
  return (
    appointment.service_name ||
    "Randevu"
  );
}

function getCustomerLabel(
  appointment: OwnerAppointment,
) {
  return (
    appointment.customer_name ||
    "Müşteri"
  );
}

function getEmployeeLabel(
  appointment: OwnerAppointment,
) {
  return (
    appointment.employee_name ||
    "Çalışan"
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    appointments,
    setAppointments,
  ] = useState<
    OwnerAppointment[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const token =
        getAccessToken();

      if (!token) {
        router.replace(
          "/login",
        );
        return;
      }

      try {
        const currentUser =
          await getMe(token);

        if (
          currentUser.role !==
          "owner"
        ) {
          router.replace(
            "/account",
          );
          return;
        }

        const todayStart =
          getStartOfToday();

        const rangeStart =
          toUTCISOString(
            todayStart,
          );

        const rangeEndDate =
          new Date(
            todayStart,
          );

        rangeEndDate.setDate(
          rangeEndDate.getDate() +
            7,
        );

        const rangeEnd =
          toUTCISOString(
            rangeEndDate,
          );

        const ownerAppointments =
          await getOwnerAppointments(
            token,
            rangeStart,
            rangeEnd,
          );

        if (cancelled) {
          return;
        }

        setUser(
          currentUser,
        );

        setAppointments(
          ownerAppointments,
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Dashboard yüklenemedi.",
        );

        clearAccessToken();

        router.replace(
          "/login",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const todayAppointments =
    useMemo(() => {
      const start =
        getStartOfToday();

      const end =
        getEndOfToday();

      return appointments.filter(
        (appointment) => {
          const date =
            new Date(
              appointment.start_at,
            );

          return (
            date >= start &&
            date < end
          );
        },
      );
    }, [appointments]);

  const upcomingAppointments =
    useMemo(() => {
      const now =
        new Date();

      return appointments.filter(
        (appointment) => {
          const date =
            new Date(
              appointment.start_at,
            );

          return (
            date >= now &&
            ![
              "cancelled",
              "canceled",
              "completed",
              "no_show",
            ].includes(
              appointment.status.toLowerCase(),
            )
          );
        },
      );
    }, [appointments]);

  const pendingCount =
    appointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "pending",
    ).length;

  const confirmedCount =
    appointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "confirmed",
    ).length;

  const handleLogout =
    () => {
      clearAccessToken();

      router.replace("/");

      router.refresh();
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-indigo-100 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-sm">
            Dashboard yükleniyor...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-indigo-100 bg-white/95 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200">
              O
            </span>

            <div>
              <div className="text-lg font-bold tracking-tight text-slate-950">
                Optio
              </div>

              <div className="text-xs font-medium text-slate-400">
                Business Dashboard
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-bold text-slate-900">
                {user?.first_name ||
                  "Owner"}{" "}
                {user?.last_name ||
                  ""}
              </div>

              <div className="text-xs text-slate-400">
                İşletme sahibi
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* OWNER NAVIGATION */}
      <nav className="sticky top-20 z-30 border-b border-indigo-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-5 sm:px-8">
          <Link
            href="/dashboard"
            className="whitespace-nowrap border-b-2 border-indigo-600 px-3 py-4 text-sm font-bold text-indigo-600"
          >
            Genel Bakış
          </Link>

          <Link
            href="/dashboard/appointments"
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-4 text-sm font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Randevular
          </Link>

          <Link
            href="/dashboard/calendar"
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-4 text-sm font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Takvim
          </Link>

          <Link
            href="/dashboard/services"
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-4 text-sm font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Hizmetler
          </Link>

          <Link
            href="/dashboard/employees"
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-4 text-sm font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Çalışanlar
          </Link>

          <Link
            href="/dashboard/customers"
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-4 text-sm font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Müşteriler
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* WELCOME */}
        <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50 p-7 shadow-[0_20px_55px_rgba(79,70,229,0.06)] sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Genel bakış
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Günaydın,{" "}
                {user?.first_name ||
                  "Owner"}.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                İşletmenizin yaklaşan randevularını ve bugünkü
                yoğunluğunu buradan takip edebilirsiniz.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Müşteri sayfasını gör
              <span className="ml-2">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Bugün
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                📅
              </span>
            </div>

            <div className="mt-5 text-3xl font-bold text-slate-950">
              {
                todayAppointments.length
              }
            </div>

            <div className="mt-1 text-sm text-slate-400">
              bugünkü randevu
            </div>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Yaklaşan
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                ✦
              </span>
            </div>

            <div className="mt-5 text-3xl font-bold text-slate-950">
              {
                upcomingAppointments.length
              }
            </div>

            <div className="mt-1 text-sm text-slate-400">
              aktif randevu
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Bekleyen
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                ⏳
              </span>
            </div>

            <div className="mt-5 text-3xl font-bold text-slate-950">
              {pendingCount}
            </div>

            <div className="mt-1 text-sm text-slate-400">
              onay bekliyor
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Onaylı
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                ✓
              </span>
            </div>

            <div className="mt-5 text-3xl font-bold text-slate-950">
              {confirmedCount}
            </div>

            <div className="mt-1 text-sm text-slate-400">
              onaylanmış randevu
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* TODAY */}
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Bugün
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Bugünkü randevular
                </h2>
              </div>

              <span className="text-sm font-semibold text-slate-400">
                {new Intl.DateTimeFormat(
                  "tr-TR",
                  {
                    day: "numeric",
                    month: "long",
                  },
                ).format(
                  new Date(),
                )}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {todayAppointments.length ===
              0 ? (
                <div className="rounded-3xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                    ✓
                  </div>

                  <h3 className="mt-4 font-bold text-slate-950">
                    Bugün randevu yok
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Bugün için planlanmış aktif randevu bulunmuyor.
                  </p>
                </div>
              ) : (
                todayAppointments.map(
                  (appointment) => (
                    <article
                      key={
                        appointment.id
                      }
                      className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-indigo-50">
                          <span className="text-lg font-bold text-indigo-700">
                            {formatTime(
                              appointment.start_at,
                            )}
                          </span>

                          <span className="text-[10px] font-semibold uppercase text-indigo-400">
                            bugün
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-950">
                              {getAppointmentLabel(
                                appointment,
                              )}
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                                appointment.status,
                              )}`}
                            >
                              {formatStatus(
                                appointment.status,
                              )}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span>
                              👤{" "}
                              {getCustomerLabel(
                                appointment,
                              )}
                            </span>

                            <span>
                              ✦{" "}
                              {getEmployeeLabel(
                                appointment,
                              )}
                            </span>
                          </div>

                          {appointment.customer_note && (
                            <p className="mt-2 text-xs text-slate-400">
                              Not:{" "}
                              {
                                appointment.customer_note
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ),
                )
              )}
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <aside>
            {/* UPCOMING */}
            <div className="rounded-[1.75rem] border border-indigo-100 bg-white p-5 shadow-[0_15px_45px_rgba(79,70,229,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Önümüzdeki günler
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                Yaklaşan randevular
              </h2>

              <div className="mt-5 space-y-2">
                {upcomingAppointments.length ===
                0 ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Yaklaşan randevu bulunmuyor.
                  </div>
                ) : (
                  upcomingAppointments
                    .slice(0, 6)
                    .map(
                      (appointment) => (
                        <div
                          key={
                            appointment.id
                          }
                          className="rounded-2xl bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">
                                {getAppointmentLabel(
                                  appointment,
                                )}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {getCustomerLabel(
                                  appointment,
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-sm font-bold text-indigo-600">
                                {formatTime(
                                  appointment.start_at,
                                )}
                              </div>

                              <div className="mt-1 text-xs text-slate-400">
                                {formatDate(
                                  appointment.start_at,
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )
                )}
              </div>

              <Link
                href="/dashboard/appointments"
                className="mt-5 flex items-center justify-center rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
              >
                Tüm randevular
                <span className="ml-2">
                  →
                </span>
              </Link>
            </div>

            {/* QUICK ACTIONS */}
            <div className="mt-5 rounded-[1.75rem] border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-[0_20px_45px_rgba(79,70,229,0.20)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
                Hızlı erişim
              </div>

              <h3 className="mt-3 text-xl font-bold">
                İşletmeni yönet
              </h3>

              <p className="mt-2 text-sm leading-6 text-indigo-100">
                Hizmetlerini, çalışanlarını ve randevularını tek
                yerden yönet.
              </p>

              <div className="mt-5 space-y-2">
                <Link
                  href="/dashboard/appointments"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
                >
                  Randevular
                  <span>→</span>
                </Link>

                <Link
                  href="/dashboard/calendar"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
                >
                  Takvim
                  <span>→</span>
                </Link>

                <Link
                  href="/dashboard/services"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
                >
                  Hizmetler
                  <span>→</span>
                </Link>

                <Link
                  href="/dashboard/employees"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
                >
                  Çalışanlar
                  <span>→</span>
                </Link>

                <Link
                  href="/dashboard/customers"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
                >
                  Müşteriler
                  <span>→</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 border-t border-indigo-100 pt-7">
          <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-bold text-slate-700">
              Optio Business
            </span>

            <span>
              İşletmenizi daha kolay yönetin.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}