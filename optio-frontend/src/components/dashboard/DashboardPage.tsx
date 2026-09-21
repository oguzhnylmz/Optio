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
  getOwnerCustomers,
  getOwnerEmployees,
  getOwnerServices,
  getBusinessHours,
  type AuthUser,
  type OwnerAppointment,
  type OwnerCustomer,
  type OwnerEmployee,
  type OwnerService,
  type BusinessHour,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

function startOfDay(
  date = new Date(),
) {
  const result =
    new Date(date);

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
  const result =
    new Date(date);

  result.setDate(
    result.getDate() + days,
  );

  return result;
}

function getDateKey(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function formatTime(
  value: string,
) {
  const date =
    new Date(value);

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
      hourCycle: "h23",
    },
  ).format(date);
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

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

function formatFullDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatDayShort(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      weekday: "short",
    },
  ).format(date);
}

function customerName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.customer_name ||
    "Müşteri"
  );
}

function serviceName(
  appointment: OwnerAppointment,
) {
  return (
    appointment.service_name ||
    "Hizmet"
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

function statusLabel(
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

function statusClass(
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

function getGreeting() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Günaydın";
  }

  if (hour < 18) {
    return "İyi günler";
  }

  return "İyi akşamlar";
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function CalendarIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="3"
      />
      <path d="M16 2v4M8 2v4M3 9h18" />
    </Icon>
  );
}

function UsersIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle
        cx="9.5"
        cy="7"
        r="4"
      />
      <path d="M17 11a4 4 0 0 0 0-8M21 21v-2a4 4 0 0 0-3-3.87" />
    </Icon>
  );
}

function UserIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  );
}

function BriefcaseIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
      />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </Icon>
  );
}

function ClockIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

function ChevronRightIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

function PlusIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

function CheckIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Icon
      className={className}
    >
      <path d="m5 12 4 4L19 6" />
    </Icon>
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

  const [
    customers,
    setCustomers,
  ] = useState<
    OwnerCustomer[]
  >([]);

  const [
    employees,
    setEmployees,
  ] = useState<
    OwnerEmployee[]
  >([]);

  const [
    services,
    setServices,
  ] = useState<
    OwnerService[]
  >([]);

  const [
    businessHours,
    setBusinessHours,
  ] = useState<
    BusinessHour[]
  >([]);

  const [
    pendingAppointmentsCount,
    setPendingAppointmentsCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    selectedDashboardDateKey,
    setSelectedDashboardDateKey,
  ] = useState(
    () => getDateKey(new Date()),
  );

  const today =
    useMemo(
      () => startOfDay(),
      [],
    );

  const tomorrow =
    useMemo(
      () =>
        addDays(
          today,
          1,
        ),
      [today],
    );

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

      setUser(
        currentUser,
      );

      const todayStart =
        startOfDay(
          new Date(),
        );

      const rangeEnd =
        addDays(
          todayStart,
          7,
        );

      const [
        appointmentResult,
        allAppointmentResult,
        customerResult,
        employeeResult,
        serviceResult,
        workingHoursResult,
      ] = await Promise.all([
        getOwnerAppointments(
          token,
          todayStart.toISOString(),
          rangeEnd.toISOString(),
        ),
        getOwnerAppointments(
          token,
        ),
        getOwnerCustomers(
          token,
        ),
        getOwnerEmployees(
          token,
        ),
        getOwnerServices(
          token,
        ),
        getBusinessHours(
          token,
        ),
      ]);

      setAppointments(
        appointmentResult,
      );

      setSelectedDashboardDateKey(
        getDateKey(
          todayStart,
        ),
      );

      setPendingAppointmentsCount(
        allAppointmentResult.filter(
          (appointment) =>
            appointment.status.toLowerCase() ===
            "pending",
        ).length,
      );

      setCustomers(
        customerResult,
      );

      setEmployees(
        employeeResult,
      );

      setServices(
        serviceResult,
      );

      setBusinessHours(
        workingHoursResult,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Dashboard verileri yüklenemedi.",
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await loadDashboard();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeEmployees =
    useMemo(
      () =>
        employees.filter(
          (employee) =>
            employee.is_active,
        ),
      [employees],
    );

  const activeServices =
    useMemo(
      () =>
        services.filter(
          (service) =>
            service.is_active,
        ),
      [services],
    );

  const todayAppointments =
    useMemo(
      () => {
        const todayKey =
          getDateKey(
            today,
          );

        return appointments
          .filter(
            (appointment) =>
              getDateKey(
                new Date(
                  appointment.start_at,
                ),
              ) === todayKey,
          )
          .sort(
            (a, b) =>
              new Date(
                a.start_at,
              ).getTime() -
              new Date(
                b.start_at,
              ).getTime(),
          );
      },
      [appointments, today],
    );

  const pendingToday =
    useMemo(
      () =>
        todayAppointments.filter(
          (appointment) =>
            appointment.status.toLowerCase() ===
            "pending",
        ).length,
      [todayAppointments],
    );

  const upcomingAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              new Date(
                appointment.start_at,
              ).getTime() >=
                Date.now() &&
              ![
                "cancelled",
                "canceled",
                "completed",
              ].includes(
                appointment.status.toLowerCase(),
              ),
          )
          .sort(
            (a, b) =>
              new Date(
                a.start_at,
              ).getTime() -
              new Date(
                b.start_at,
              ).getTime(),
          )
          .slice(
            0,
            5,
          ),
      [appointments],
    );

  const weeklyCounts =
    useMemo(() => {
      return Array.from(
        {
          length: 7,
        },
        (_, index) => {
          const date =
            addDays(
              today,
              index,
            );

          const key =
            getDateKey(
              date,
            );

          const count =
            appointments.filter(
              (appointment) =>
                getDateKey(
                  new Date(
                    appointment.start_at,
                  ),
                ) === key,
            ).length;

          return {
            date,
            count,
            label:
              index === 0
                ? "Bugün"
                : formatDayShort(
                    date,
                  ),
          };
        },
      );
    }, [
      appointments,
      today,
    ]);

  const weeklyMax =
    Math.max(
      ...weeklyCounts.map(
        (item) =>
          item.count,
      ),
      1,
    );

  const selectedDashboardDay =
    useMemo(
      () =>
        weeklyCounts.find(
          (item) =>
            getDateKey(item.date) ===
            selectedDashboardDateKey,
        ) ?? weeklyCounts[0] ?? {
          date: today,
          count: 0,
          label: "Bugün",
        },
      [
        weeklyCounts,
        selectedDashboardDateKey,
        today,
      ],
    );

  const selectedDayAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              getDateKey(
                new Date(
                  appointment.start_at,
                ),
              ) ===
              getDateKey(
                selectedDashboardDay.date,
              ),
          )
          .sort(
            (a, b) =>
              new Date(
                a.start_at,
              ).getTime() -
              new Date(
                b.start_at,
              ).getTime(),
          ),
      [
        appointments,
        selectedDashboardDay.date,
      ],
    );

  const selectedDayConfirmed =
    selectedDayAppointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "confirmed",
    ).length;

  const selectedDayPending =
    selectedDayAppointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "pending",
    ).length;

  const selectedDayCancelled =
    selectedDayAppointments.filter(
      (appointment) =>
        [
          "cancelled",
          "canceled",
        ].includes(
          appointment.status.toLowerCase(),
        ),
    ).length;

  const confirmedToday =
    todayAppointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "confirmed",
    ).length;

  const completedToday =
    todayAppointments.filter(
      (appointment) =>
        appointment.status.toLowerCase() ===
        "completed",
    ).length;

  const cancelledToday =
    todayAppointments.filter(
      (appointment) =>
        [
          "cancelled",
          "canceled",
        ].includes(
          appointment.status.toLowerCase(),
        ),
    ).length;

  const setupItems =
    useMemo(() => {
      return [
        {
          label:
            "Hizmetlerini ekle",
          done:
            activeServices.length >
            0,
          href:
            "/dashboard/services",
        },
        {
          label:
            "Çalışanlarını ekle",
          done:
            activeEmployees.length >
            0,
          href:
            "/dashboard/employees",
        },
        {
          label:
            "Çalışma saatlerini belirle",
          done:
            businessHours.length >
            0,
          href:
            "/dashboard/working-hours",
        },
        {
          label:
            "İlk müşterini al",
          done:
            customers.length >
            0,
          href:
            "/dashboard/customers",
        },
      ];
    }, [
      activeEmployees.length,
      activeServices.length,
      businessHours.length,
      customers.length,
    ]);

  const completedSetup =
    setupItems.filter(
      (item) =>
        item.done,
    ).length;

  function logout() {
    clearAccessToken();
    router.replace("/");
    router.refresh();
  }

  function goToAppointments(
    date?: Date,
  ) {
    const target =
      date ||
      today;

    const year =
      target.getFullYear();

    const month =
      String(
        target.getMonth() + 1,
      ).padStart(
        2,
        "0",
      );

    const day =
      String(
        target.getDate(),
      ).padStart(
        2,
        "0",
      );

    router.push(
      `/dashboard/appointments?date=${year}-${month}-${day}`,
    );
  }

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
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-indigo-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:px-8">
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
                İşletme Yönetim Paneli
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

      <div className="mx-auto flex max-w-[1500px] gap-8 px-5 py-8 sm:px-8 lg:py-10">
        <DashboardSidebar />

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* HERO */}
          <div className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
            <div className="relative px-6 py-7 sm:px-8 sm:py-8">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-100/60 blur-3xl" />
              <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-indigo-100/70 blur-3xl" />

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    {formatFullDate(
                      today,
                    )}
                  </p>

                  <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {getGreeting()},{" "}
                    {user?.first_name ||
                      "Owner"}{" "}
                    👋
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Bugün işletmende neler olduğunu tek bakışta gör.
                    Randevularını, müşterilerini ve ekibini kolayca yönet.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/appointments"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-white px-5 py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Takvimi aç
                  </Link>

                  <Link
                    href="/dashboard/customers"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Müşteri ekle
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* KPI */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-indigo-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CalendarIcon />
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-600">
                  Bugün
                </span>
              </div>

              <div className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                {
                  todayAppointments.length
                }
              </div>

              <div className="mt-1 text-sm font-semibold text-slate-500">
                Bugünün randevuları
              </div>

              <button
                type="button"
                onClick={() =>
                  goToAppointments()
                }
                className="mt-4 text-xs font-bold text-indigo-600 transition hover:text-indigo-700"
              >
                Takvimi görüntüle →
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <ClockIcon />
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
                  Bekleyen
                </span>
              </div>

              <div className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                {
                  pendingAppointmentsCount
                }
              </div>

              <div className="mt-1 text-sm font-semibold text-slate-500">
                Onay bekleyen randevu
              </div>

              <div className="mt-4 text-xs font-semibold text-slate-400">
                Tarihten bağımsız tüm bekleyenler
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-violet-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <UsersIcon />
                </div>

                <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-600">
                  Toplam
                </span>
              </div>

              <div className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                {
                  customers.length
                }
              </div>

              <div className="mt-1 text-sm font-semibold text-slate-500">
                Toplam müşteri
              </div>

              <Link
                href="/dashboard/customers"
                className="mt-4 inline-block text-xs font-bold text-violet-600 transition hover:text-violet-700"
              >
                Müşterileri yönet →
              </Link>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BriefcaseIcon />
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
                  Aktif
                </span>
              </div>

              <div className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                {
                  activeServices.length
                }
              </div>

              <div className="mt-1 text-sm font-semibold text-slate-500">
                Aktif hizmet
              </div>

              <div className="mt-4 text-xs font-semibold text-slate-400">
                {activeEmployees.length} aktif çalışan
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
            {/* TODAY'S SCHEDULE */}
            <section className="rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-indigo-100 px-6 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    {getDateKey(
                      selectedDashboardDay.date,
                    ) ===
                    getDateKey(today)
                      ? "Bugün"
                      : "Seçilen gün"}
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Günün programı
                  </h2>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {formatFullDate(
                      selectedDashboardDay.date,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    goToAppointments(
                      selectedDashboardDay.date,
                    )
                  }
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Tümünü gör
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {selectedDayAppointments.length ===
                0 ? (
                  <div className="px-7 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <CalendarIcon />
                    </div>

                    <h3 className="mt-4 text-base font-bold text-slate-900">
                      Bu gün için randevu yok
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Seçtiğin günde yeni bir randevu olduğunda programın burada görünecek.
                    </p>
                  </div>
                ) : (
                  selectedDayAppointments
                    .slice(
                      0,
                      6,
                    )
                    .map(
                      (
                        appointment,
                      ) => (
                        <button
                          key={
                            appointment.id
                          }
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/appointments?date=${getDateKey(
                                new Date(
                                  appointment.start_at,
                                ),
                              )}&appointment=${appointment.id}`,
                            )
                          }
                          className="group flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-50 sm:px-7"
                        >
                          <div className="w-16 shrink-0">
                            <div className="text-sm font-black text-indigo-600">
                              {formatTime(
                                appointment.start_at,
                              )}
                            </div>

                            <div className="mt-1 text-[11px] font-semibold text-slate-400">
                              {formatDate(
                                appointment.start_at,
                              )}
                            </div>
                          </div>

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-500">
                            {customerName(
                              appointment,
                            )
                              .charAt(
                                0,
                              )
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-bold text-slate-900">
                                {customerName(
                                  appointment,
                                )}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                                  appointment.status,
                                )}`}
                              >
                                {statusLabel(
                                  appointment.status,
                                )}
                              </span>
                            </div>

                            <div className="mt-1 truncate text-xs font-semibold text-slate-400">
                              {
                                serviceName(
                                  appointment,
                                )
                              }{" "}
                              ·{" "}
                              {
                                employeeName(
                                  appointment,
                                )
                              }
                            </div>
                          </div>

                          <ChevronRightIcon className="hidden h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-indigo-500 sm:block" />
                        </button>
                      ),
                    )
                )}
              </div>
            </section>

            {/* WEEKLY ACTIVITY */}
            <section className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                    Önümüzdeki 7 gün
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Randevu yoğunluğu
                  </h2>
                </div>

                <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-center">
                  <div className="text-lg font-black text-indigo-600">
                    {
                      appointments.length
                    }
                  </div>

                  <div className="text-[10px] font-bold text-indigo-400">
                    TOPLAM
                  </div>
                </div>
              </div>

              <div className="mt-8 flex h-52 items-end gap-2">
                {weeklyCounts.map(
                  (item) => {
                    const height =
                      item.count ===
                      0
                        ? 8
                        : Math.max(
                            20,
                            Math.round(
                              (item.count /
                                weeklyMax) *
                                100,
                            ),
                          );

                    const dateKey =
                      getDateKey(
                        item.date,
                      );

                    const isToday =
                      dateKey ===
                      getDateKey(
                        today,
                      );

                    const isSelected =
                      dateKey ===
                      selectedDashboardDateKey;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        title={`${formatFullDate(
                          item.date,
                        )} · ${item.count} randevu`}
                        aria-pressed={
                          isSelected
                        }
                        onClick={() =>
                          setSelectedDashboardDateKey(
                            dateKey,
                          )
                        }
                        className={[
                          "group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl bg-transparent p-0 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2",
                          isSelected
                            ? "ring-1 ring-indigo-100"
                            : "",
                        ].join(
                          " ",
                        )}
                      >
                        <span
                          className={[
                            "text-[10px] font-bold transition",
                            isSelected ||
                            isToday
                              ? "text-indigo-600"
                              : "text-slate-400",
                          ].join(
                            " ",
                          )}
                        >
                          {
                            item.count
                          }
                        </span>

                        <div
                          className={[
                            "flex h-36 w-full items-end rounded-xl p-1 transition",
                            isSelected
                              ? "bg-indigo-50"
                              : "bg-slate-50 group-hover:bg-indigo-50/70",
                          ].join(
                            " ",
                          )}
                        >
                          <div
                            className={[
                              "w-full rounded-lg transition-all duration-200",
                              isSelected
                                ? "bg-indigo-600 shadow-md shadow-indigo-100"
                                : isToday
                                  ? "bg-indigo-400"
                                  : "bg-indigo-100 group-hover:bg-indigo-200",
                            ].join(
                              " ",
                            )}
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span
                          className={[
                            "text-[10px] font-bold",
                            isSelected
                              ? "text-indigo-600"
                              : isToday
                                ? "text-indigo-500"
                                : "text-slate-400",
                          ].join(
                            " ",
                          )}
                        >
                          {
                            item.label
                          }
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              <div className="mt-6">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {getDateKey(
                    selectedDashboardDay.date,
                  ) ===
                  getDateKey(today)
                    ? "Bugünün durumu"
                    : `Seçilen gün · ${formatDayShort(
                        selectedDashboardDay.date,
                      )}`}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="text-lg font-black text-emerald-700">
                      {
                        selectedDayConfirmed
                      }
                    </div>

                    <div className="mt-1 text-[11px] font-bold text-emerald-600/70">
                      ONAYLI
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-4">
                    <div className="text-lg font-black text-amber-700">
                      {
                        selectedDayPending
                      }
                    </div>

                    <div className="mt-1 text-[11px] font-bold text-amber-600/70">
                      BEKLEYEN
                    </div>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4">
                    <div className="text-lg font-black text-red-600">
                      {
                        selectedDayCancelled
                      }
                    </div>

                    <div className="mt-1 text-[11px] font-bold text-red-500/70">
                      İPTAL
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* LOWER GRID */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* UPCOMING */}
            <section className="rounded-[2rem] border border-indigo-100 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-indigo-100 px-6 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Sıradaki
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Yaklaşan randevular
                  </h2>
                </div>

                <Link
                  href="/dashboard/calendar"
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Takvime git
                </Link>
              </div>

              <div className="grid gap-3 p-5 sm:p-6">
                {upcomingAppointments.length ===
                0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-500">
                      Yaklaşan randevu bulunmuyor.
                    </p>
                  </div>
                ) : (
                  upcomingAppointments.map(
                    (
                      appointment,
                    ) => (
                      <button
                        key={
                          appointment.id
                        }
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/appointments?date=${getDateKey(
                              new Date(
                                appointment.start_at,
                              ),
                            )}&appointment=${appointment.id}`,
                          )
                        }
                        className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left transition hover:border-indigo-100 hover:bg-indigo-50/50"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-sm">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {new Intl.DateTimeFormat(
                              "tr-TR",
                              {
                                month:
                                  "short",
                              },
                            ).format(
                              new Date(
                                appointment.start_at,
                              ),
                            )}
                          </span>

                          <span className="text-lg font-black text-indigo-600">
                            {new Date(
                              appointment.start_at,
                            ).getDate()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-slate-900">
                              {customerName(
                                appointment,
                              )}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                                appointment.status,
                              )}`}
                            >
                              {statusLabel(
                                appointment.status,
                              )}
                            </span>
                          </div>

                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            {formatTime(
                              appointment.start_at,
                            )}{" "}
                            ·{" "}
                            {
                              serviceName(
                                appointment,
                              )
                            }{" "}
                            ·{" "}
                            {
                              employeeName(
                                appointment,
                              )
                            }
                          </div>
                        </div>

                        <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
                      </button>
                    ),
                  )
                )}
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                Hızlı işlemler
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Buradan devam et
              </h2>

              <div className="mt-6 space-y-3">
                <Link
                  href="/dashboard/appointments"
                  className="group flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 transition hover:bg-indigo-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                    <CalendarIcon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      Randevuları yönet
                    </div>

                    <div className="mt-0.5 text-xs text-slate-500">
                      Bugününü planla
                    </div>
                  </div>

                  <ChevronRightIcon className="h-5 w-5 text-slate-300 transition group-hover:text-indigo-500" />
                </Link>

                <Link
                  href="/dashboard/services"
                  className="group flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 transition hover:bg-violet-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                    <BriefcaseIcon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      Hizmetleri düzenle
                    </div>

                    <div className="mt-0.5 text-xs text-slate-500">
                      Fiyat ve süreleri yönet
                    </div>
                  </div>

                  <ChevronRightIcon className="h-5 w-5 text-slate-300 transition group-hover:text-violet-500" />
                </Link>

                <Link
                  href="/dashboard/employees"
                  className="group flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition hover:bg-emerald-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <UsersIcon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      Ekibini yönet
                    </div>

                    <div className="mt-0.5 text-xs text-slate-500">
                      Çalışan ve uygunluk
                    </div>
                  </div>

                  <ChevronRightIcon className="h-5 w-5 text-slate-300 transition group-hover:text-emerald-500" />
                </Link>
              </div>
            </section>
          </div>

          {/* SETUP */}
          {completedSetup <
            setupItems.length && (
            <section className="mt-6 overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
              <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Kurulum
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Optio'yu kullanıma hazırla
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    İşletmeni birkaç adımda tamamla.
                  </p>
                </div>

                <div className="min-w-[180px]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">
                      Tamamlanma
                    </span>

                    <span className="text-indigo-600">
                      {completedSetup}/
                      {
                        setupItems.length
                      }
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{
                        width: `${
                          (completedSetup /
                            setupItems.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t border-indigo-100 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
                {setupItems.map(
                  (item) => (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      className={[
                        "flex items-center gap-3 rounded-2xl border p-4 transition",
                        item.done
                          ? "border-emerald-100 bg-emerald-50/60"
                          : "border-slate-100 bg-slate-50 hover:border-indigo-100 hover:bg-indigo-50/40",
                      ].join(
                        " ",
                      )}
                    >
                      <span
                        className={[
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          item.done
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-white text-slate-400 shadow-sm",
                        ].join(
                          " ",
                        )}
                      >
                        {item.done ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <PlusIcon className="h-4 w-4" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            "block text-sm font-bold",
                            item.done
                              ? "text-emerald-800"
                              : "text-slate-800",
                          ].join(
                            " ",
                          )}
                        >
                          {
                            item.label
                          }
                        </span>

                        <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                          {item.done
                            ? "Tamamlandı"
                            : "Ayarla →"}
                        </span>
                      </span>
                    </Link>
                  ),
                )}
              </div>
            </section>
          )}

          {/* FOOTER STAT STRIP */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <UsersIcon className="h-4 w-4" />
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {
                      activeEmployees.length
                    }
                  </div>

                  <div className="text-xs font-semibold text-slate-400">
                    Aktif çalışan
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <BriefcaseIcon className="h-4 w-4" />
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {
                      activeServices.length
                    }
                  </div>

                  <div className="text-xs font-semibold text-slate-400">
                    Aktif hizmet
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarIcon className="h-4 w-4" />
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {
                      appointments.length
                    }
                  </div>

                  <div className="text-xs font-semibold text-slate-400">
                    7 günlük randevu
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}