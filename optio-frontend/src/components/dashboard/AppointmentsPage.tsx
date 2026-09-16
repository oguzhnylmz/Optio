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
  updateOwnerAppointmentStatus,
  type AuthUser,
  type OwnerAppointment,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

type AppointmentFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

type StatusValue =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

function startOfDay(date = new Date()) {
  const result = new Date(date);

  result.setHours(
    0,
    0,
    0,
    0,
  );

  return result;
}

function addDays(
  date: Date,
  days: number,
) {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days,
  );

  return result;
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
      year: "numeric",
    },
  ).format(date);
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
      return "İptal edildi";

    case "no_show":
      return "Gelmedi";

    default:
      return status;
  }
}

function statusClasses(
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

function getCustomerName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.customer_name ||
    "Müşteri"
  );
}

function getServiceName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.service_name ||
    "Hizmet"
  );
}

function getEmployeeName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.employee_name ||
    "Çalışan"
  );
}

export default function AppointmentsPage() {
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

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<AppointmentFilter>(
      "all",
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [loading, setLoading] =
    useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState<string | null>(
    null,
  );

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    rangeLoading,
    setRangeLoading,
  ] = useState(false);

  async function loadAppointments(
    date: string,
  ) {
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

      setUser(currentUser);

      const selected =
        new Date(
          `${date}T00:00:00`,
        );

      const start =
        startOfDay(selected);

      const end = addDays(
        start,
        1,
      );

      const result =
        await getOwnerAppointments(
          token,
          start.toISOString(),
          end.toISOString(),
        );

      setAppointments(result);
    } catch (err) {
      clearAccessToken();

      setError(
        err instanceof Error
          ? err.message
          : "Randevular yüklenemedi.",
      );

      router.replace(
        "/login",
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await loadAppointments(
          selectedDate,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRangeLoading(
            false,
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDateChange(
    date: string,
  ) {
    setSelectedDate(date);
    setRangeLoading(true);
    setError(null);

    await loadAppointments(
      date,
    );

    setRangeLoading(false);
  }

  async function handleStatusChange(
    appointmentId: string,
    status: StatusValue,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );
      return;
    }

    setUpdatingId(
      appointmentId,
    );
    setError(null);

    try {
      const updated =
        await updateOwnerAppointmentStatus(
          token,
          appointmentId,
          status,
        );

      setAppointments(
        (current) =>
          current.map(
            (appointment) =>
              appointment.id ===
              updated.id
                ? {
                    ...appointment,
                    ...updated,
                  }
                : appointment,
          ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Randevu durumu güncellenemedi.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredAppointments =
    useMemo(() => {
      if (
        activeFilter ===
        "all"
      ) {
        return appointments;
      }

      return appointments.filter(
        (appointment) =>
          appointment.status.toLowerCase() ===
          activeFilter,
      );
    }, [
      appointments,
      activeFilter,
    ]);

  const counts = useMemo(
    () => ({
      all: appointments.length,

      pending:
        appointments.filter(
          (appointment) =>
            appointment.status.toLowerCase() ===
            "pending",
        ).length,

      confirmed:
        appointments.filter(
          (appointment) =>
            appointment.status.toLowerCase() ===
            "confirmed",
        ).length,

      completed:
        appointments.filter(
          (appointment) =>
            appointment.status.toLowerCase() ===
            "completed",
        ).length,

      cancelled:
        appointments.filter(
          (appointment) =>
            [
              "cancelled",
              "canceled",
            ].includes(
              appointment.status.toLowerCase(),
            ),
        ).length,
    }),
    [appointments],
  );

  function logout() {
    clearAccessToken();
    router.replace("/");
    router.refresh();
  }

  function moveDate(
    days: number,
  ) {
    const current =
      new Date(
        `${selectedDate}T00:00:00`,
      );

    const next =
      addDays(
        current,
        days,
      );

    handleDateChange(
      next
        .toISOString()
        .slice(0, 10),
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-indigo-100 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-sm">
            Randevular yükleniyor...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      {/* HEADER */}
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
              <div className="text-lg font-bold tracking-tight">
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
              onClick={logout}
              className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        {/* TOP */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              ← Dashboard
            </Link>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Randevular
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Randevuları yönet
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Randevularını görüntüle, durumlarını güncelle ve
              gününü kolayca yönet.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                moveDate(-1)
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-lg font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
              aria-label="Önceki gün"
            >
              ←
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                handleDateChange(
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-indigo-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <button
              type="button"
              onClick={() =>
                moveDate(1)
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-lg font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
              aria-label="Sonraki gün"
            >
              →
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

{/* STATS */}
<div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
  {(
    [
      {
        label: "Tümü",
        count: counts.all,
        filter: "all",
      },
      {
        label: "Bekliyor",
        count: counts.pending,
        filter: "pending",
      },
      {
        label: "Onaylandı",
        count: counts.confirmed,
        filter: "confirmed",
      },
      {
        label: "Tamamlandı",
        count: counts.completed,
        filter: "completed",
      },
      {
        label: "İptal",
        count: counts.cancelled,
        filter: "cancelled",
      },
    ] satisfies Array<{
      label: string;
      count: number;
      filter: AppointmentFilter;
    }>
  ).map(
    ({
      label,
      count,
      filter,
    }) => {
      const active =
        activeFilter === filter;

      return (
        <button
          key={filter}
          type="button"
          onClick={() =>
            setActiveFilter(filter)
          }
          className={[
            "rounded-2xl border bg-white p-5 text-left transition",
            active
              ? "border-indigo-400 bg-indigo-50 shadow-sm"
              : "border-indigo-100 hover:border-indigo-200",
          ].join(" ")}
        >
          <div
            className={[
              "text-sm font-semibold",
              active
                ? "text-indigo-600"
                : "text-slate-500",
            ].join(" ")}
          >
            {label}
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {count}
          </div>
        </button>
      );
    },
  )}
</div>
        {/* APPOINTMENTS */}
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                {new Intl.DateTimeFormat(
                  "tr-TR",
                  {
                    dateStyle:
                      "long",
                  },
                ).format(
                  new Date(
                    `${selectedDate}T12:00:00`,
                  ),
                )}
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Günün randevuları
              </h2>
            </div>

            {rangeLoading && (
              <span className="text-sm font-semibold text-slate-400">
                Güncelleniyor...
              </span>
            )}
          </div>

          {filteredAppointments.length ===
          0 ? (
            <div className="rounded-[2rem] border border-indigo-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                📅
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                Bu filtrede randevu yok.
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Seçtiğin gün veya durum için gösterilecek başka
                randevu bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map(
                (appointment) => {
                  const status =
                    appointment.status.toLowerCase();

                  const isUpdating =
                    updatingId ===
                    appointment.id;

                  return (
                    <article
                      key={
                        appointment.id
                      }
                      className="rounded-[1.5rem] border border-indigo-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                        {/* TIME */}
                        <div className="flex shrink-0 items-center gap-4 xl:w-36 xl:flex-col xl:items-start xl:gap-1">
                          <div className="text-2xl font-bold text-indigo-600">
                            {formatTime(
                              appointment.start_at,
                            )}
                          </div>

                          <div className="text-sm text-slate-400">
                            {formatDate(
                              appointment.start_at,
                            )}
                          </div>
                        </div>

                        {/* MAIN INFO */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-950">
                              {getServiceName(
                                appointment,
                              )}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(
                                status,
                              )}`}
                            >
                              {formatStatus(
                                status,
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span>
                              👤{" "}
                              {getCustomerName(
                                appointment,
                              )}
                            </span>

                            <span>
                              ✦{" "}
                              {getEmployeeName(
                                appointment,
                              )}
                            </span>
                          </div>

                          {appointment.customer_note && (
                            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                              <span className="font-bold">
                                Müşteri notu:
                              </span>{" "}
                              {
                                appointment.customer_note
                              }
                            </div>
                          )}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          {status ===
                            "pending" && (
                            <button
                              type="button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                handleStatusChange(
                                  appointment.id,
                                  "confirmed",
                                )
                              }
                              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isUpdating
                                ? "Güncelleniyor..."
                                : "Onayla"}
                            </button>
                          )}

                          {status ===
                            "confirmed" && (
                            <button
                              type="button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                handleStatusChange(
                                  appointment.id,
                                  "completed",
                                )
                              }
                              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isUpdating
                                ? "Güncelleniyor..."
                                : "Tamamlandı"}
                            </button>
                          )}

                          {(status ===
                            "pending" ||
                            status ===
                              "confirmed") && (
                            <button
                              type="button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                handleStatusChange(
                                  appointment.id,
                                  "cancelled",
                                )
                              }
                              className="rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              İptal
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}