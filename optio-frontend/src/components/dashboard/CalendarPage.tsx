"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getBusinessHours,
  getMe,
  getOwnerAppointments,
  type AuthUser,
  type BusinessHour,
  type OwnerAppointment,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const FALLBACK_START_MINUTES = 8 * 60;
const FALLBACK_END_MINUTES = 20 * 60;
const SLOT_MINUTES = 30;

function startOfWeek(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + mondayOffset,
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

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatWeekRange(
  start: Date,
  end: Date,
) {
  const sameMonth =
    start.getMonth() ===
    end.getMonth();

  const startDay = new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "numeric",
    },
  ).format(start);

  const endDay = new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "numeric",
    },
  ).format(end);

  const endMonth = new Intl.DateTimeFormat(
    "tr-TR",
    {
      month: "long",
    },
  ).format(end);

  if (sameMonth) {
    return `${startDay} – ${endDay} ${endMonth}`;
  }

  const startMonth = new Intl.DateTimeFormat(
    "tr-TR",
    {
      month: "short",
    },
  ).format(start);

  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

function formatDayNumber(date: Date) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "numeric",
    },
  ).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      weekday: "short",
    },
  )
    .format(date)
    .replace(".", "");
}

function formatTimeFromMinutes(
  minutes: number,
) {
  const hours =
    Math.floor(minutes / 60);

  const mins = minutes % 60;

  return `${String(hours).padStart(
    2,
    "0",
  )}:${String(mins).padStart(2, "0")}`;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(
      2,
      "0",
    ),
    String(date.getDate()).padStart(
      2,
      "0",
    ),
  ].join("-");
}

function timeToMinutes(
  value: string,
) {
  const [hours, minutes] =
    value.split(":").map(Number);

  return hours * 60 + minutes;
}

function getBusinessDayOfWeek(
  date: Date,
) {
  // Backend: Monday = 0 ... Sunday = 6
  const jsDay = date.getDay();

  return jsDay === 0
    ? 6
    : jsDay - 1;
}

function getDayIntervals(
  date: Date,
  businessHours: BusinessHour[],
) {
  const dayOfWeek =
    getBusinessDayOfWeek(date);

  return businessHours
    .filter(
      (item) =>
        item.day_of_week ===
        dayOfWeek,
    )
    .map((item) => ({
      start:
        timeToMinutes(
          item.start_time,
        ),
      end:
        timeToMinutes(
          item.end_time,
        ),
    }))
    .filter(
      (item) =>
        item.end > item.start,
    )
    .sort(
      (a, b) =>
        a.start - b.start,
    );
}

function mergeIntervals(
  intervals: Array<{
    start: number;
    end: number;
  }>,
) {
  if (!intervals.length) {
    return [];
  }

  const sorted = [...intervals].sort(
    (a, b) => a.start - b.start,
  );

  const merged: Array<{
    start: number;
    end: number;
  }> = [];

  for (const interval of sorted) {
    const last =
      merged[merged.length - 1];

    if (
      !last ||
      interval.start > last.end
    ) {
      merged.push({
        ...interval,
      });
      continue;
    }

    last.end = Math.max(
      last.end,
      interval.end,
    );
  }

  return merged;
}

function formatBusinessHours(
  intervals: Array<{
    start: number;
    end: number;
  }>,
) {
  if (!intervals.length) {
    return "Kapalı";
  }

  return intervals
    .map(
      (interval) =>
        `${formatTimeFromMinutes(
          interval.start,
        )}–${formatTimeFromMinutes(
          interval.end,
        )}`,
    )
    .join(" · ");
}

function statusMeta(status: string) {
  switch (
    status.toLowerCase()
  ) {
    case "confirmed":
      return {
        label: "Onaylandı",
        badge:
          "border-indigo-100 bg-indigo-50 text-indigo-700",
        dot: "bg-indigo-500",
        card:
          "border-indigo-200 bg-indigo-50/90",
      };

    case "completed":
      return {
        label: "Tamamlandı",
        badge:
          "border-emerald-100 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
        card:
          "border-emerald-200 bg-emerald-50/90",
      };

    case "cancelled":
    case "canceled":
      return {
        label: "İptal",
        badge:
          "border-red-100 bg-red-50 text-red-600",
        dot: "bg-red-500",
        card:
          "border-red-200 bg-red-50/90",
      };

    case "no_show":
      return {
        label: "Gelmedi",
        badge:
          "border-slate-200 bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
        card:
          "border-slate-200 bg-slate-100/90",
      };

    default:
      return {
        label: "Bekliyor",
        badge:
          "border-amber-100 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
        card:
          "border-amber-200 bg-amber-50/90",
      };
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

function getInitials(
  value: string,
) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) =>
      part.charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CalendarPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [businessHours, setBusinessHours] =
    useState<BusinessHour[]>([]);

  const [
    currentWeek,
    setCurrentWeek,
  ] = useState(() =>
    startOfWeek(new Date()),
  );

  const [
    appointments,
    setAppointments,
  ] = useState<
    OwnerAppointment[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    changingWeek,
    setChangingWeek,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const weekDays = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, index) =>
          addDays(
            currentWeek,
            index,
          ),
      ),
    [currentWeek],
  );

  const weekEnd = useMemo(
    () =>
      addDays(
        currentWeek,
        6,
      ),
    [currentWeek],
  );

  /*
   * Business hours for every day.
   */
  const businessIntervalsByDay =
    useMemo(() => {
      const map =
        new Map<
          string,
          Array<{
            start: number;
            end: number;
          }>
        >();

      weekDays.forEach(
        (day) => {
          map.set(
            getDateKey(day),
            mergeIntervals(
              getDayIntervals(
                day,
                businessHours,
              ),
            ),
          );
        },
      );

      return map;
    }, [
      weekDays,
      businessHours,
    ]);

  /*
   * Determine the global calendar bounds
   * from the business hours.
   */
  const calendarBounds =
    useMemo(() => {
      const intervals =
        businessHours.flatMap(
          (businessHour) => [
            timeToMinutes(
              businessHour.start_time,
            ),
            timeToMinutes(
              businessHour.end_time,
            ),
          ],
        );

      if (!intervals.length) {
        return {
          start: FALLBACK_START_MINUTES,
          end: FALLBACK_END_MINUTES,
        };
      }

      return {
        start: Math.min(
          ...intervals,
        ),
        end: Math.max(
          ...intervals,
        ),
      };
    }, [businessHours]);

  const calendarTotalMinutes =
    Math.max(
      calendarBounds.end -
        calendarBounds.start,
      60,
    );

  const calendarHeight =
    calendarTotalMinutes * 2;

  async function loadWeek(
    week: Date,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const weekStart =
      startOfWeek(week);

    const apiWeekEnd =
      addDays(
        weekStart,
        7,
      );

    try {
      const [
        currentUser,
        appointmentsResult,
        businessHoursResult,
      ] = await Promise.all([
        getMe(token),
        getOwnerAppointments(
          token,
          weekStart.toISOString(),
          apiWeekEnd.toISOString(),
        ),
        getBusinessHours(token),
      ]);

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

      setAppointments(
        appointmentsResult,
      );

      setBusinessHours(
        businessHoursResult,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Takvim yüklenemedi.",
      );

      clearAccessToken();

      router.replace("/login");
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
        if (!cancelled) {
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

    setCurrentWeek(nextWeek);
    setChangingWeek(true);
    setError(null);

    await loadWeek(nextWeek);

    setChangingWeek(false);
  }

  async function goToToday() {
    const today =
      startOfWeek(new Date());

    setCurrentWeek(today);
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
          const date = new Date(
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

      map.forEach((list) => {
        list.sort(
          (a, b) =>
            new Date(
              a.start_at,
            ).getTime() -
            new Date(
              b.start_at,
            ).getTime(),
        );
      });

      return map;
    }, [
      appointments,
      weekDays,
    ]);

  const todayKey =
    getDateKey(new Date());

  const totalAppointments =
    appointments.length;

  const pendingAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "pending",
    ).length;

  const completedAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "completed",
    ).length;

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

  const todayAppointments =
    appointments.filter(
      (appointment) =>
        getDateKey(
          new Date(
            appointment.start_at,
          ),
        ) === todayKey,
    );

  const todayActiveCount =
    todayAppointments.filter(
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

  const todayIntervals =
    businessIntervalsByDay.get(
      todayKey,
    ) ?? [];

  const now = new Date();

  const nowMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const currentTimePosition =
    ((nowMinutes -
      calendarBounds.start) /
      calendarTotalMinutes) *
    100;

  const isNowWithinBusinessHours =
    todayIntervals.some(
      (interval) =>
        nowMinutes >= interval.start &&
        nowMinutes <= interval.end,
    );

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
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard",
              )
            }
            className="group flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition group-hover:scale-105">
              O
            </span>

            <div className="text-left">
              <div className="text-lg font-bold tracking-tight text-slate-950">
                Optio
              </div>

              <div className="text-xs font-medium text-slate-400">
                Business Dashboard
              </div>
            </div>
          </button>

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

      {/* MAIN */}
      <div className="mx-auto flex max-w-[1500px] gap-8 px-5 py-8 sm:px-8 lg:py-10">
        <DashboardSidebar />

        <section className="min-w-0 flex-1">
          {/* INTRO */}
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Takvim
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Randevu Takvimi
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                İşletmenizin çalışma saatlerine göre haftalık
                randevu akışını takip edin.
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
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-lg font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Önceki hafta"
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
                className="h-11 rounded-xl border border-indigo-100 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-lg font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Sonraki hafta"
              >
                →
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
              <span>!</span>
              <span>{error}</span>
            </div>
          )}

          {/* SUMMARY */}
          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-indigo-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Bu hafta
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {formatWeekRange(
                      weekDays[0],
                      weekEnd,
                    )}
                  </p>
                </div>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  📅
                </span>
              </div>

              <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                {totalAppointments}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                toplam randevu
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-violet-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Aktif
                </p>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  ◷
                </span>
              </div>

              <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                {activeAppointments}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                yaklaşan / devam eden
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Bekleyen
                </p>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  !
                </span>
              </div>

              <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                {pendingAppointments}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                onay bekleyen
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Tamamlanan
                </p>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  ✓
                </span>
              </div>

              <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                {completedAppointments}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                tamamlanmış
              </p>
            </div>
          </div>

          {/* CALENDAR */}
          <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-[0_24px_70px_rgba(79,70,229,0.08)]">
            {/* TOP BAR */}
            <div className="flex flex-col gap-4 border-b border-indigo-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black capitalize text-slate-950">
                    {formatMonthYear(
                      currentWeek,
                    )}
                  </h2>

                  {changingWeek && (
                    <span className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-600">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                      Güncelleniyor
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs font-medium capitalize text-slate-400">
                  {formatWeekRange(
                    weekDays[0],
                    weekEnd,
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-1 hidden items-center gap-2 text-xs font-medium text-slate-400 lg:flex">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  Açık saatler
                </div>

                <Link
                  href="/dashboard/working-hours"
                  className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Çalışma Saatlerini Düzenle
                </Link>

                <Link
                  href="/dashboard/appointments"
                  className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
                >
                  Randevuları Yönet →
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                {/* DAY HEADERS */}
                <div className="grid grid-cols-[78px_repeat(7,minmax(145px,1fr))] border-b border-indigo-100">
                  <div className="border-r border-indigo-100 bg-slate-50/80" />

                  {weekDays.map(
                    (day) => {
                      const key =
                        getDateKey(day);

                      const isToday =
                        key ===
                        todayKey;

                      const intervals =
                        businessIntervalsByDay.get(
                          key,
                        ) ?? [];

                      const isClosed =
                        intervals.length ===
                        0;

                      const dayAppointments =
                        appointmentsByDay.get(
                          key,
                        ) ?? [];

                      return (
                        <div
                          key={key}
                          className={[
                            "border-r border-indigo-100 px-3 py-4 text-center last:border-r-0",
                            isClosed
                              ? "bg-slate-100/80"
                              : isToday
                                ? "bg-indigo-50/80"
                                : "bg-white",
                          ].join(
                            " ",
                          )}
                        >
                          <div
                            className={[
                              "text-[10px] font-black uppercase tracking-[0.16em]",
                              isClosed
                                ? "text-slate-400"
                                : isToday
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

                          <div className="mt-1">
                            <span
                              className={[
                                "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-black",
                                isClosed
                                  ? "bg-slate-200 text-slate-400"
                                  : isToday
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                    : "text-slate-700",
                              ].join(
                                " ",
                              )}
                            >
                              {formatDayNumber(
                                day,
                              )}
                            </span>
                          </div>

                          {isClosed ? (
                            <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                              Kapalı
                            </div>
                          ) : (
                            <>
                              <div className="mt-2 text-[9px] font-bold leading-4 text-slate-400">
                                {formatBusinessHours(
                                  intervals,
                                )}
                              </div>

                              <div
                                className={[
                                  "mt-1.5 text-[10px] font-bold",
                                  dayAppointments.length >
                                  0
                                    ? isToday
                                      ? "text-indigo-500"
                                      : "text-slate-400"
                                    : "text-slate-300",
                                ].join(
                                  " ",
                                )}
                              >
                                {dayAppointments.length >
                                0
                                  ? `${dayAppointments.length} randevu`
                                  : "Randevu yok"}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {/* BODY */}
                <div className="grid grid-cols-[78px_repeat(7,minmax(145px,1fr))]">
                  {/* TIME COLUMN */}
                  <div className="border-r border-indigo-100 bg-slate-50/70">
                    <div
                      className="relative"
                      style={{
                        height: `${calendarHeight}px`,
                      }}
                    >
                      {Array.from(
                        {
                          length:
                            Math.floor(
                              calendarTotalMinutes /
                                60,
                            ) + 1,
                        },
                        (_, index) => {
                          const minutes =
                            Math.min(
                              calendarBounds.start +
                                index *
                                  60,
                              calendarBounds.end,
                            );

                          const top =
                            ((minutes -
                              calendarBounds.start) /
                              calendarTotalMinutes) *
                            100;

                          return (
                            <div
                              key={
                                `${minutes}-${index}`
                              }
                              className="absolute left-0 right-0"
                              style={{
                                top: `${top}%`,
                              }}
                            >
                              <span className="absolute -top-2 right-3 text-[10px] font-bold tabular-nums text-slate-400">
                                {formatTimeFromMinutes(
                                  minutes,
                                )}
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
                        getDateKey(day);

                      const intervals =
                        businessIntervalsByDay.get(
                          key,
                        ) ?? [];

                      const dayAppointments =
                        appointmentsByDay.get(
                          key,
                        ) ?? [];

                      const isToday =
                        key ===
                        todayKey;

                      const isClosed =
                        intervals.length ===
                        0;

                      return (
                        <div
                          key={key}
                          className={[
                            "relative border-r border-indigo-100 last:border-r-0",
                            isClosed
                              ? "bg-slate-100"
                              : isToday
                                ? "bg-indigo-50/[0.03]"
                                : "bg-white",
                          ].join(
                            " ",
                          )}
                        >
                          <div
                            className="relative"
                            style={{
                              height: `${calendarHeight}px`,
                            }}
                          >
                            {/* CLOSED DAY OVERLAY */}
                            {isClosed && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-200/45">
                                <div className="rotate-[-8deg] rounded-2xl border border-slate-300 bg-white/90 px-5 py-3 text-center shadow-sm">
                                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                    İşletme kapalı
                                  </div>

                                  <div className="mt-1 text-sm font-black text-slate-500">
                                    Kapalı
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* OPEN HOUR WHITE AREAS */}
                            {!isClosed &&
                              intervals.map(
                                (
                                  interval,
                                  index,
                                ) => {
                                  const top =
                                    ((interval.start -
                                      calendarBounds.start) /
                                      calendarTotalMinutes) *
                                    100;

                                  const height =
                                    ((interval.end -
                                      interval.start) /
                                      calendarTotalMinutes) *
                                    100;

                                  return (
                                    <div
                                      key={
                                        `${key}-${index}`
                                      }
                                      className={[
                                        "absolute left-0 right-0 bg-white",
                                        isToday
                                          ? "bg-indigo-50/[0.025]"
                                          : "",
                                      ].join(
                                        " ",
                                      )}
                                      style={{
                                        top: `${top}%`,
                                        height: `${height}%`,
                                      }}
                                    />
                                  );
                                },
                              )}

                            {/* GRID LINES */}
                            {Array.from(
                              {
                                length:
                                  Math.ceil(
                                    calendarTotalMinutes /
                                      SLOT_MINUTES,
                                  ),
                              },
                              (
                                _,
                                index,
                              ) => {
                                const minutes =
                                  calendarBounds.start +
                                  index *
                                    SLOT_MINUTES;

                                if (
                                  minutes >
                                  calendarBounds.end
                                ) {
                                  return null;
                                }

                                const top =
                                  ((minutes -
                                    calendarBounds.start) /
                                    calendarTotalMinutes) *
                                  100;

                                const major =
                                  minutes %
                                    60 ===
                                  0;

                                return (
                                  <div
                                    key={
                                      `${key}-grid-${minutes}`
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
                                      top: `${top}%`,
                                    }}
                                  />
                                );
                              },
                            )}

                            {/* CURRENT TIME LINE */}
                            {isToday &&
                              !isClosed &&
                              isNowWithinBusinessHours && (
                                <div
                                  className="pointer-events-none absolute left-0 right-0 z-30"
                                  style={{
                                    top: `${currentTimePosition}%`,
                                  }}
                                >
                                  <div className="flex items-center">
                                    <span className="h-2.5 w-2.5 -translate-x-1 rounded-full bg-indigo-500 shadow-sm" />

                                    <div className="h-px flex-1 bg-indigo-500/70" />
                                  </div>
                                </div>
                              )}

                            {/* CLOSED GAPS */}
                            {!isClosed &&
                              intervals.length >
                                1 &&
                              intervals
                                .slice(
                                  0,
                                  -1,
                                )
                                .map(
                                  (
                                    interval,
                                    index,
                                  ) => {
                                    const next =
                                      intervals[
                                        index +
                                          1
                                      ];

                                    if (
                                      !next ||
                                      next.start <=
                                        interval.end
                                    ) {
                                      return null;
                                    }

                                    const top =
                                      ((interval.end -
                                        calendarBounds.start) /
                                        calendarTotalMinutes) *
                                      100;

                                    const height =
                                      ((next.start -
                                        interval.end) /
                                        calendarTotalMinutes) *
                                      100;

                                    return (
                                      <div
                                        key={
                                          `${key}-gap-${index}`
                                        }
                                        className="absolute left-0 right-0 z-[2] bg-slate-100/85"
                                        style={{
                                          top: `${top}%`,
                                          height: `${height}%`,
                                        }}
                                      >
                                        <div className="flex h-full items-center justify-center">
                                          <span className="rounded-full border border-slate-200 bg-white/90 px-2 py-1 text-[8px] font-bold text-slate-400">
                                            Kapalı
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}

                            {/* APPOINTMENTS */}
                            {!isClosed &&
                              dayAppointments.map(
                                (
                                  appointment,
                                ) => {
                                  const start =
                                    new Date(
                                      appointment.start_at,
                                    );

                                  const end =
                                    new Date(
                                      appointment.end_at,
                                    );

                                  const startMinutes =
                                    start.getHours() *
                                      60 +
                                    start.getMinutes();

                                  const endMinutes =
                                    end.getHours() *
                                      60 +
                                    end.getMinutes();

                                  const top =
                                    ((startMinutes -
                                      calendarBounds.start) /
                                      calendarTotalMinutes) *
                                    100;

                                  const duration =
                                    Math.max(
                                      endMinutes -
                                        startMinutes,
                                      SLOT_MINUTES,
                                    );

                                  const height =
                                    Math.max(
                                      (duration /
                                        calendarTotalMinutes) *
                                        100,
                                      4.5,
                                    );

                                  const meta =
                                    statusMeta(
                                      appointment.status,
                                    );

                                  return (
                                    <Link
                                      key={
                                        appointment.id
                                      }
                                      href={`/dashboard/appointments?date=${key}&appointment=${appointment.id}`}
                                      className={[
                                        "group absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-2xl border p-2.5 shadow-sm transition-all duration-150 hover:z-40 hover:-translate-y-0.5 hover:shadow-xl",
                                        meta.card,
                                      ].join(
                                        " ",
                                      )}
                                      style={{
                                        top: `${Math.max(
                                          0,
                                          top,
                                        )}%`,
                                        height: `${Math.min(
                                          height,
                                          100,
                                        )}%`,
                                      }}
                                    >
                                      <span
                                        className={`absolute bottom-0 left-0 top-0 w-1 ${meta.dot}`}
                                      />

                                      <div className="pl-1">
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="flex min-w-0 items-center gap-1.5">
                                            <span
                                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                                            />

                                            <span className="text-[10px] font-black tabular-nums text-slate-700">
                                              {formatTime(
                                                start,
                                              )}
                                            </span>
                                          </div>

                                          <span
                                            className={`hidden rounded-full border px-1.5 py-0.5 text-[8px] font-black sm:inline-flex ${meta.badge}`}
                                          >
                                            {meta.label}
                                          </span>
                                        </div>

                                        <div className="mt-1.5 truncate text-[11px] font-black text-slate-950">
                                          {serviceName(
                                            appointment,
                                          )}
                                        </div>

                                        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] font-semibold text-slate-500">
                                          <span className="shrink-0">
                                            {getInitials(
                                              customerName(
                                                appointment,
                                              ),
                                            )}
                                          </span>

                                          <span className="truncate">
                                            {customerName(
                                              appointment,
                                            )}
                                          </span>
                                        </div>

                                        <div className="mt-0.5 hidden truncate text-[9px] font-medium text-slate-400 sm:block">
                                          {employeeName(
                                            appointment,
                                          )}
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                },
                              )}

                            {!isClosed &&
                              dayAppointments.length ===
                                0 && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                  <div className="rounded-full border border-slate-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-300">
                                    Randevu yok
                                  </div>
                                </div>
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

          {/* BOTTOM INFO */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_330px]">
            <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                Çalışma düzeni
              </p>

              <h3 className="mt-1 text-sm font-black text-slate-950">
                Takvim işletme saatlerini takip ediyor
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {weekDays.map(
                  (day) => {
                    const key =
                      getDateKey(day);

                    const intervals =
                      businessIntervalsByDay.get(
                        key,
                      ) ?? [];

                    return (
                      <div
                        key={key}
                        className={[
                          "rounded-xl border px-3 py-2",
                          intervals.length
                            ? "border-indigo-100 bg-indigo-50/60"
                            : "border-slate-200 bg-slate-50",
                        ].join(
                          " ",
                        )}
                      >
                        <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                          {formatWeekday(
                            day,
                          )}
                        </div>

                        <div
                          className={[
                            "mt-1 text-xs font-bold",
                            intervals.length
                              ? "text-indigo-700"
                              : "text-slate-400",
                          ].join(
                            " ",
                          )}
                        >
                          {formatBusinessHours(
                            intervals,
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                    Bugün
                  </p>

                  <h3 className="mt-1 text-sm font-black text-slate-950">
                    Günlük görünüm
                  </h3>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                  {todayAppointments.length}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Toplam
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950">
                    {
                      todayAppointments.length
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-indigo-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-400">
                    Aktif
                  </p>

                  <p className="mt-1 text-xl font-black text-indigo-700">
                    {todayActiveCount}
                  </p>
                </div>
              </div>

              <Link
                href={`/dashboard/appointments?date=${todayKey}`}
                className="mt-3 block text-center text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Bugünün randevularını aç →
              </Link>
            </div>
          </div>

          {/* MOBILE */}
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4 text-xs leading-5 text-slate-400 lg:hidden">
            Takvim geniş olduğu için yatay kaydırarak haftanın tüm
            günlerini görüntüleyebilirsin.
          </div>
        </section>
      </div>
    </main>
  );
}