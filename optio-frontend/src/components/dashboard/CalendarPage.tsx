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

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MINUTES = 30;

const TOTAL_MINUTES =
  (END_HOUR - START_HOUR) * 60;

function startOfWeek(
  date: Date,
) {
  const result = new Date(date);

  result.setHours(
    0,
    0,
    0,
    0,
  );

  const day =
    result.getDay();

  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() +
      mondayOffset,
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

function formatMonthYear(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatDayNumber(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "numeric",
    },
  ).format(date);
}

function formatWeekday(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      weekday: "short",
    },
  )
    .format(date)
    .replace(".", "");
}

function formatTime(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getDateKey(
  date: Date,
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-");
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

function statusLabel(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
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
      return "Bekliyor";
  }
}

function serviceName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.service_name ||
    "Hizmet"
  );
}

function customerName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.customer_name ||
    "Müşteri"
  );
}

function employeeName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.employee_name ||
    "Çalışan"
  );
}

function getAppointmentPosition(
  appointment: OwnerAppointment,
) {
  const start = new Date(
    appointment.start_at,
  );

  const end = new Date(
    appointment.end_at,
  );

  const startMinutes =
    start.getHours() * 60 +
    start.getMinutes();

  const endMinutes =
    end.getHours() * 60 +
    end.getMinutes();

  const topMinutes =
    startMinutes -
    START_HOUR * 60;

  const duration =
    Math.max(
      endMinutes -
        startMinutes,
      SLOT_MINUTES,
    );

  const top =
    (topMinutes /
      TOTAL_MINUTES) *
    100;

  const height =
    (duration /
      TOTAL_MINUTES) *
    100;

  return {
    top,
    height,
  };
}

export default function CalendarPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    currentWeek,
    setCurrentWeek,
  ] = useState(() =>
    startOfWeek(
      new Date(),
    ),
  );

  const [
    appointments,
    setAppointments,
  ] = useState<
    OwnerAppointment[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    changingWeek,
    setChangingWeek,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const weekDays =
    useMemo(() => {
      return Array.from(
        { length: 7 },
        (_, index) =>
          addDays(
            currentWeek,
            index,
          ),
      );
    }, [currentWeek]);

  async function loadWeek(
    week: Date,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );
      return;
    }

    const weekStart =
      startOfWeek(week);

    const weekEnd =
      addDays(
        weekStart,
        7,
      );

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

      setUser(
        currentUser,
      );

      const result =
        await getOwnerAppointments(
          token,
          weekStart.toISOString(),
          weekEnd.toISOString(),
        );

      setAppointments(
        result,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Takvim yüklenemedi.",
      );

      clearAccessToken();

      router.replace(
        "/login",
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        await loadWeek(
          currentWeek,
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  async function changeWeek(
    direction: number,
  ) {
    const nextWeek =
      addDays(
        currentWeek,
        direction * 7,
      );

    setCurrentWeek(
      nextWeek,
    );

    setChangingWeek(true);
    setError(null);

    await loadWeek(
      nextWeek,
    );

    setChangingWeek(false);
  }

  async function goToToday() {
    const today =
      startOfWeek(
        new Date(),
      );

    setCurrentWeek(
      today,
    );

    setChangingWeek(true);
    setError(null);

    await loadWeek(today);

    setChangingWeek(false);
  }

  function logout() {
    clearAccessToken();
    router.replace("/");
    router.refresh();
  }

  const appointmentsByDay =
    useMemo(() => {
      const map =
        new Map<
          string,
          OwnerAppointment[]
        >();

      weekDays.forEach(
        (day) => {
          map.set(
            getDateKey(day),
            [],
          );
        },
      );

      appointments.forEach(
        (appointment) => {
          const date =
            new Date(
              appointment.start_at,
            );

          const key =
            getDateKey(date);

          const list =
            map.get(key);

          if (list) {
            list.push(
              appointment,
            );
          }
        },
      );

      return map;
    }, [
      appointments,
      weekDays,
    ]);

  const todayKey =
    getDateKey(
      new Date(),
    );

  const totalAppointments =
    appointments.length;

  const activeAppointments =
    appointments.filter(
      (appointment) =>
        ![
          "cancelled",
          "canceled",
          "completed",
          "no_show",
        ].includes(
          appointment.status.toLowerCase(),
        ),
    ).length;

  const pendingAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "pending",
    ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-indigo-100 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-sm">
            Takvim yükleniyor...
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
              onClick={
                logout
              }
              className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* PAGE HEADING */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              ← Dashboard
            </Link>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Takvim
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Randevu takvimi
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Haftalık görünümden işletmenizin randevu yoğunluğunu
              hızlıca takip edin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                changeWeek(-1)
              }
              disabled={
                changingWeek
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-lg font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
            >
              ←
            </button>

            <button
              type="button"
              onClick={
                goToToday
              }
              disabled={
                changingWeek
              }
              className="h-11 rounded-xl border border-indigo-100 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
            >
              Bugün
            </button>

            <button
              type="button"
              onClick={() =>
                changeWeek(1)
              }
              disabled={
                changingWeek
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-lg font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
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

        {/* SUMMARY */}
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Bu hafta
            </div>

            <div className="mt-2 text-3xl font-bold">
              {totalAppointments}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              toplam randevu
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Aktif
            </div>

            <div className="mt-2 text-3xl font-bold">
              {activeAppointments}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              yaklaşan / devam eden
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Bekleyen
            </div>

            <div className="mt-2 text-3xl font-bold">
              {pendingAppointments}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              onay bekleyen
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-indigo-100 bg-white shadow-[0_18px_50px_rgba(79,70,229,0.06)]">
          {/* MONTH BAR */}
          <div className="flex items-center justify-between border-b border-indigo-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold capitalize text-slate-950">
                {formatMonthYear(
                  currentWeek,
                )}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {formatDayNumber(
                  weekDays[0],
                )}{" "}
                –{" "}
                {formatDayNumber(
                  weekDays[6],
                )}{" "}
                {new Intl.DateTimeFormat(
                  "tr-TR",
                  {
                    month:
                      "long",
                  },
                ).format(
                  weekDays[6],
                )}
              </p>
            </div>

            {changingWeek && (
              <span className="text-sm font-semibold text-slate-400">
                Güncelleniyor...
              </span>
            )}
          </div>

          {/* HORIZONTAL SCROLL CONTAINER */}
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              {/* DAY HEADERS */}
              <div className="grid grid-cols-[72px_repeat(7,minmax(140px,1fr))] border-b border-indigo-100">
                <div className="border-r border-indigo-100 bg-slate-50" />

                {weekDays.map(
                  (day) => {
                    const key =
                      getDateKey(
                        day,
                      );

                    const isToday =
                      key ===
                      todayKey;

                    return (
                      <div
                        key={key}
                        className={[
                          "border-r border-indigo-100 px-3 py-4 text-center last:border-r-0",
                          isToday
                            ? "bg-indigo-50/70"
                            : "bg-white",
                        ].join(
                          " ",
                        )}
                      >
                        <div
                          className={[
                            "text-[11px] font-bold uppercase tracking-[0.12em]",
                            isToday
                              ? "text-indigo-600"
                              : "text-slate-400",
                          ].join(
                            " ",
                          )}
                        >
                          {formatWeekday(
                            day,
                          )}
                        </div>

                        <div
                          className={[
                            "mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                            isToday
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                              : "text-slate-700",
                          ].join(
                            " ",
                          )}
                        >
                          {formatDayNumber(
                            day,
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* BODY */}
              <div className="grid grid-cols-[72px_repeat(7,minmax(140px,1fr))]">
                {/* TIME COLUMN */}
                <div className="border-r border-indigo-100 bg-slate-50">
                  <div
                    className="relative"
                    style={{
                      height: `${TOTAL_MINUTES * 2}px`,
                    }}
                  >
                    {Array.from(
                      {
                        length:
                          END_HOUR -
                          START_HOUR +
                          1,
                      },
                      (_, index) => {
                        const hour =
                          START_HOUR +
                          index;

                        const top =
                          index *
                          60 *
                          2;

                        return (
                          <div
                            key={
                              hour
                            }
                            className="absolute left-0 right-0"
                            style={{
                              top: `${top}px`,
                            }}
                          >
                            <span className="absolute -top-2 left-2 text-[10px] font-semibold text-slate-400">
                              {String(
                                hour,
                              ).padStart(
                                2,
                                "0",
                              )}
                              :00
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* DAYS */}
                {weekDays.map(
                  (day) => {
                    const key =
                      getDateKey(
                        day,
                      );

                    const dayAppointments =
                      appointmentsByDay.get(
                        key,
                      ) ?? [];

                    const isToday =
                      key ===
                      todayKey;

                    return (
                      <div
                        key={key}
                        className={[
                          "relative border-r border-indigo-100 last:border-r-0",
                          isToday
                            ? "bg-indigo-50/10"
                            : "bg-white",
                        ].join(
                          " ",
                        )}
                      >
                        {/* GRID LINES */}
                        <div
                          className="relative"
                          style={{
                            height: `${TOTAL_MINUTES * 2}px`,
                          }}
                        >
                          {Array.from(
                            {
                              length:
                                TOTAL_MINUTES /
                                  SLOT_MINUTES,
                            },
                            (
                              _,
                              index,
                            ) => {
                              const top =
                                index *
                                SLOT_MINUTES *
                                2;

                              const major =
                                index %
                                  2 ===
                                0;

                              return (
                                <div
                                  key={
                                    index
                                  }
                                  className={[
                                    "absolute left-0 right-0 border-t",
                                    major
                                      ? "border-slate-200"
                                      : "border-slate-100",
                                  ].join(
                                    " ",
                                  )}
                                  style={{
                                    top: `${top}px`,
                                  }}
                                />
                              );
                            },
                          )}

                          {/* APPOINTMENTS */}
                          {dayAppointments.map(
                            (
                              appointment,
                            ) => {
                              const {
                                top,
                                height,
                              } =
                                getAppointmentPosition(
                                  appointment,
                                );

                              return (
                                <Link
                                  key={
                                    appointment.id
                                  }
                                  href={`/dashboard/appointments?date=${key}`}
                                  className="absolute left-1.5 right-1.5 overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                  style={{
                                    top: `${top}%`,
                                    height: `${height}%`,
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="text-[11px] font-bold text-indigo-700">
                                      {formatTime(
                                        new Date(
                                          appointment.start_at,
                                        ),
                                      )}
                                    </span>

                                    <span
                                      className={[
                                        "hidden rounded-full border px-1.5 py-0.5 text-[9px] font-bold sm:inline-flex",
                                        statusClasses(
                                          appointment.status,
                                        ),
                                      ].join(
                                        " ",
                                      )}
                                    >
                                      {statusLabel(
                                        appointment.status,
                                      )}
                                    </span>
                                  </div>

                                  <div className="mt-1 truncate text-xs font-bold text-slate-900">
                                    {serviceName(
                                      appointment,
                                    )}
                                  </div>

                                  <div className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                                    {customerName(
                                      appointment,
                                    )}
                                  </div>

                                  <div className="mt-1 hidden truncate text-[10px] text-slate-400 sm:block">
                                    {employeeName(
                                      appointment,
                                    )}
                                  </div>
                                </Link>
                              );
                            },
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE / SMALL SCREEN INFO */}
        <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4 text-xs leading-5 text-slate-400 lg:hidden">
          Takvimi yatay kaydırarak haftanın tüm günlerini
          görüntüleyebilirsin.
        </div>
      </div>
    </main>
  );
}