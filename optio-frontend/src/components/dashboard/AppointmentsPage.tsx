"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

import {
  createOwnerAppointment,
  createOwnerCustomer,
  getBusinessHours,
  getEmployeeAvailability,
  getEmployeeServices,
  getMe,
  getOwnerAppointments,
  getOwnerCustomers,
  getOwnerEmployees,
  getOwnerServices,
  updateOwnerAppointment,
  updateOwnerAppointmentStatus,
  type AuthUser,
  type BusinessHour,
  type EmployeeAvailability,
  type OwnerAppointment,
  type OwnerAppointmentStatus,
  type OwnerCustomer,
  type OwnerEmployee,
  type OwnerService,
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
  | "cancelled"
  | "no_show";

type AppointmentModalMode =
  | "create"
  | "edit";

type CustomerEntryMode =
  | "new"
  | "existing";

interface AppointmentFormState {
  customer_id: string;

  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_profile_note: string;

  service_id: string;
  employee_id: string;

  date: string;
  time: string;

  customer_note: string;
  internal_note: string;
}

const HALF_HOUR_HEIGHT = 42;
const HALF_HOUR_MINUTES = 30;

const DEFAULT_START_MINUTES =
  8 * 60;

const DEFAULT_END_MINUTES =
  21 * 60;

const EMPTY_FORM: AppointmentFormState = {
  customer_id: "",

  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_profile_note: "",

  service_id: "",
  employee_id: "",

  date: "",
  time: "",

  customer_note: "",
  internal_note: "",
};

const WEEKDAY_LABELS = [
  "Pzt",
  "Sal",
  "Çar",
  "Per",
  "Cum",
  "Cmt",
  "Paz",
];

function getLocalDateString(
  date = new Date(),
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateString(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0,
  );
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

function startOfDay(
  date: Date,
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

function startOfWeek(
  date: Date,
) {
  const result =
    startOfDay(date);

  const jsDay =
    result.getDay();

  const diff =
    jsDay === 0
      ? -6
      : 1 - jsDay;

  result.setDate(
    result.getDate() + diff,
  );

  return result;
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
      year: "numeric",
    },
  ).format(date);
}

function formatDateShort(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "numeric",
      month: "short",
    },
  ).format(date);
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

function formatTimeInput(
  value: string,
) {
  return value.slice(
    0,
    5,
  );
}

function timeToMinutes(
  value: string,
) {
  const [
    hours,
    minutes,
  ] = value
    .slice(0, 5)
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

function minutesToTime(
  minutes: number,
) {
  const normalized =
    Math.max(
      0,
      Math.min(
        23 * 60 + 59,
        minutes,
      ),
    );

  const hours =
    Math.floor(
      normalized / 60,
    );

  const remaining =
    normalized % 60;

  return `${String(
    hours,
  ).padStart(2, "0")}:${String(
    remaining,
  ).padStart(2, "0")}`;
}

function ceilToHalfHour(
  minutes: number,
) {
  return (
    Math.ceil(
      minutes / HALF_HOUR_MINUTES,
    ) *
    HALF_HOUR_MINUTES
  );
}

function getWeekdayIndex(
  date: Date,
) {
  const jsDay =
    date.getDay();

  return jsDay === 0
    ? 6
    : jsDay - 1;
}

function getDateKey(
  value: string | Date,
) {
  if (
    value instanceof Date
  ) {
    return getLocalDateString(
      value,
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return getLocalDateString(
    date,
  );
}

function getMinutesOfDay(
  value: string,
) {
  const date =
    new Date(value);

  return (
    date.getHours() * 60 +
    date.getMinutes()
  );
}

function getDurationMinutes(
  startAt: string,
  endAt: string,
) {
  const start =
    new Date(
      startAt,
    ).getTime();

  const end =
    new Date(
      endAt,
    ).getTime();

  return Math.max(
    15,
    Math.round(
      (end - start) /
        60000,
    ),
  );
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

function calendarCardClasses(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case "confirmed":
      return "border-indigo-200 bg-indigo-50 text-indigo-900 hover:border-indigo-300";

    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300";

    case "cancelled":
    case "canceled":
      return "border-red-200 bg-red-50 text-red-800 hover:border-red-300";

    case "no_show":
      return "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300";

    default:
      return "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300";
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

function getDateAndTimeISO(
  date: string,
  time: string,
) {
  return new Date(
    `${date}T${time}:00`,
  ).toISOString();
}

function normalizePhone(
  value: string,
) {
  let digits =
    value.replace(
      /\D/g,
      "",
    );

  if (
    digits.startsWith("90") &&
    digits.length >= 12
  ) {
    digits =
      "0" +
      digits.slice(
        2,
      );
  }

  return digits;
}

function getDefaultTimeForDate(
  dateString: string,
  businessHours: BusinessHour[],
) {
  const date =
    parseDateString(
      dateString,
    );

  const weekday =
    getWeekdayIndex(date);

  const dayHours =
    businessHours
      .filter(
        (item) =>
          item.day_of_week ===
          weekday,
      )
      .sort(
        (a, b) =>
          timeToMinutes(
            a.start_time,
          ) -
          timeToMinutes(
            b.start_time,
          ),
      );

  if (
    dayHours.length ===
    0
  ) {
    return "09:00";
  }

  const firstOpening =
    timeToMinutes(
      dayHours[0].start_time,
    );

  const today =
    getLocalDateString();

  if (
    dateString !== today
  ) {
    return minutesToTime(
      firstOpening,
    );
  }

  const now =
    new Date();

  const roundedNow =
    ceilToHalfHour(
      now.getHours() * 60 +
        now.getMinutes(),
    );

  return minutesToTime(
    Math.max(
      firstOpening,
      roundedNow,
    ),
  );
}

export default function AppointmentsPage() {
  const router =
    useRouter();

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
    businessHours,
    setBusinessHours,
  ] = useState<
    BusinessHour[]
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
    employeeServices,
    setEmployeeServices,
  ] = useState<
    Record<string, string[]>
  >({});

  const [
    employeeAvailability,
    setEmployeeAvailability,
  ] = useState<
    Record<string, EmployeeAvailability[]>
  >({});

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getLocalDateString(),
  );

  const [
    weekStart,
    setWeekStart,
  ] = useState(
    startOfWeek(
      new Date(),
    ),
  );

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<AppointmentFilter>(
      "all",
    );

  const [
    selectedAppointmentId,
    setSelectedAppointmentId,
  ] = useState<
    string | null
  >(null);

  const [loading, setLoading] =
    useState(true);

  const [
    rangeLoading,
    setRangeLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    updatingId,
    setUpdatingId,
  ] = useState<
    string | null
  >(null);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    modalMode,
    setModalMode,
  ] =
    useState<AppointmentModalMode>(
      "create",
    );

  const [
    customerEntryMode,
    setCustomerEntryMode,
  ] =
    useState<CustomerEntryMode>(
      "new",
    );

  const [
    customerFilter,
    setCustomerFilter,
  ] = useState("");

  const [
    employeeFilter,
    setEmployeeFilter,
  ] = useState("");

  const [
    serviceFilter,
    setServiceFilter,
  ] = useState("");

  const [
    editingAppointment,
    setEditingAppointment,
  ] =
    useState<
      OwnerAppointment | null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<AppointmentFormState>(
      EMPTY_FORM,
    );

  const [
    resourceLoading,
    setResourceLoading,
  ] = useState(false);

  async function loadWeek(
    dateString: string,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    const selected =
      parseDateString(
        dateString,
      );

    const currentWeek =
      startOfWeek(
        selected,
      );

    const end =
      addDays(
        currentWeek,
        7,
      );

    setWeekStart(
      currentWeek,
    );

    const result =
      await getOwnerAppointments(
        token,
        currentWeek.toISOString(),
        end.toISOString(),
      );

    setAppointments(
      result,
    );
  }

  async function loadInitialData(
    initialDate: string,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

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

    const selected =
      parseDateString(
        initialDate,
      );

    const currentWeek =
      startOfWeek(
        selected,
      );

    const end =
      addDays(
        currentWeek,
        7,
      );

    const [
      appointmentResult,
      workingHours,
      customerResult,
      employeeResult,
      serviceResult,
    ] = await Promise.all([
      getOwnerAppointments(
        token,
        currentWeek.toISOString(),
        end.toISOString(),
      ),
      getBusinessHours(
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
    ]);

    setAppointments(
      appointmentResult,
    );

    setBusinessHours(
      workingHours,
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

    setWeekStart(
      currentWeek,
    );

    setResourceLoading(
      true,
    );

    try {
      const activeEmployees =
        employeeResult.filter(
          (employee) =>
            employee.is_active,
        );

      const resourceResults =
        await Promise.all(
          activeEmployees.map(
            async (
              employee,
            ) => {
              const [
                assigned,
                availability,
              ] = await Promise.all([
                getEmployeeServices(
                  token,
                  employee.id,
                ),
                getEmployeeAvailability(
                  token,
                  employee.id,
                ),
              ]);

              return [
                employee.id,
                assigned.map(
                  (service) =>
                    service.id,
                ),
                availability,
              ] as const;
            },
          ),
        );

      const serviceMap: Record<
        string,
        string[]
      > = {};

      const availabilityMap: Record<
        string,
        EmployeeAvailability[]
      > = {};

      for (
        const [
          employeeId,
          serviceIds,
          availability,
        ] of resourceResults
      ) {
        serviceMap[
          employeeId
        ] = serviceIds;

        availabilityMap[
          employeeId
        ] = availability;
      }

      setEmployeeServices(
        serviceMap,
      );

      setEmployeeAvailability(
        availabilityMap,
      );
    } finally {
      setResourceLoading(
        false,
      );
    }
  }

  useEffect(() => {
    let cancelled =
      false;

    async function boot() {
      const params =
        new URLSearchParams(
          window.location.search,
        );

      const urlDate =
        params.get("date");

      const urlAppointment =
        params.get(
          "appointment",
        );

      const initialDate =
        urlDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(
          urlDate,
        )
          ? urlDate
          : getLocalDateString();

      setSelectedDate(
        initialDate,
      );

      try {
        await loadInitialData(
          initialDate,
        );

        if (
          cancelled
        ) {
          return;
        }

        if (
          urlAppointment
        ) {
          setSelectedAppointmentId(
            urlAppointment,
          );
        }
      } catch (err) {
        if (
          cancelled
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Randevular yüklenemedi.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      !selectedAppointmentId
    ) {
      return;
    }

    function onKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        closeAppointmentDetail();
      }
    }

    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [
    selectedAppointmentId,
    selectedDate,
  ]);

  const weekDays =
    useMemo(
      () =>
        Array.from(
          {
            length: 7,
          },
          (_, index) =>
            addDays(
              weekStart,
              index,
            ),
        ),
      [weekStart],
    );

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

  const selectedAppointment =
    useMemo(
      () =>
        appointments.find(
          (appointment) =>
            appointment.id ===
            selectedAppointmentId,
        ) ?? null,
      [
        appointments,
        selectedAppointmentId,
      ],
    );

  const selectedDayAppointments =
    useMemo(
      () => {
        const normalizedCustomer =
          customerFilter
            .trim()
            .toLocaleLowerCase(
              "tr-TR",
            );

        const normalizedEmployee =
          employeeFilter
            .trim()
            .toLocaleLowerCase(
              "tr-TR",
            );

        const normalizedService =
          serviceFilter
            .trim()
            .toLocaleLowerCase(
              "tr-TR",
            );

        return appointments
          .filter(
            (appointment) =>
              getDateKey(
                appointment.start_at,
              ) ===
              selectedDate,
          )
          .filter(
            (appointment) => {
              const status =
                appointment.status.toLowerCase();

              if (
                activeFilter !==
                  "all" &&
                status !==
                  activeFilter &&
                !(
                  activeFilter ===
                    "cancelled" &&
                  status ===
                    "canceled"
                )
              ) {
                return false;
              }

              const customerName =
                [
                  getCustomerName(
                    appointment,
                  ),
                  appointment.customer_phone ||
                    "",
                  appointment.customer_email ||
                    "",
                ]
                  .join(" ")
                  .toLocaleLowerCase(
                    "tr-TR",
                  );

              const employeeName =
                getEmployeeName(
                  appointment,
                ).toLocaleLowerCase(
                  "tr-TR",
                );

              const serviceName =
                getServiceName(
                  appointment,
                ).toLocaleLowerCase(
                  "tr-TR",
                );

              return (
                (!normalizedCustomer ||
                  customerName.includes(
                    normalizedCustomer,
                  )) &&
                (!normalizedEmployee ||
                  employeeName.includes(
                    normalizedEmployee,
                  )) &&
                (!normalizedService ||
                  serviceName.includes(
                    normalizedService,
                  ))
              );
            },
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
      [
        appointments,
        selectedDate,
        activeFilter,
        customerFilter,
        employeeFilter,
        serviceFilter,
      ],
    );

  const filteredCalendarAppointments =
    useMemo(
      () => {
        const normalizedCustomer =
          customerFilter
            .trim()
            .toLocaleLowerCase(
              "tr-TR",
            );

        const normalizedEmployee =
          employeeFilter
            .trim()
            .toLocaleLowerCase(
              "tr-TR",
            );

        const normalizedService =
          serviceFilter
            .trim()
            .toLocaleLowerCase(
              "tr-TR",
            );

        return appointments.filter(
          (appointment) => {
            const status =
              appointment.status.toLowerCase();

            if (
              activeFilter !==
                "all" &&
              status !==
                activeFilter &&
              !(
                activeFilter ===
                  "cancelled" &&
                status ===
                  "canceled"
              )
            ) {
              return false;
            }

            const customerName =
              [
                getCustomerName(
                  appointment,
                ),
                appointment.customer_phone ||
                  "",
                appointment.customer_email ||
                  "",
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "tr-TR",
                );

            const employeeName =
              getEmployeeName(
                appointment,
              ).toLocaleLowerCase(
                "tr-TR",
              );

            const serviceName =
              getServiceName(
                appointment,
              ).toLocaleLowerCase(
                "tr-TR",
              );

            return (
              (!normalizedCustomer ||
                customerName.includes(
                  normalizedCustomer,
                )) &&
              (!normalizedEmployee ||
                employeeName.includes(
                  normalizedEmployee,
                )) &&
              (!normalizedService ||
                serviceName.includes(
                  normalizedService,
                ))
            );
          },
        );
      },
      [
        appointments,
        activeFilter,
        customerFilter,
        employeeFilter,
        serviceFilter,
      ],
    );

  const counts =
    useMemo(
      () => ({
        all:
          appointments.length,

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

        no_show:
          appointments.filter(
            (appointment) =>
              appointment.status.toLowerCase() ===
              "no_show",
          ).length,
      }),
      [appointments],
    );

  const calendarBounds =
    useMemo(() => {
      if (
        businessHours.length ===
        0
      ) {
        return {
          start:
            DEFAULT_START_MINUTES,
          end:
            DEFAULT_END_MINUTES,
        };
      }

      const starts =
        businessHours.map(
          (item) =>
            timeToMinutes(
              item.start_time,
            ),
        );

      const ends =
        businessHours.map(
          (item) =>
            timeToMinutes(
              item.end_time,
            ),
        );

      return {
        start:
          Math.floor(
            Math.min(
              ...starts,
            ) / 30,
          ) * 30,

        end:
          Math.ceil(
            Math.max(
              ...ends,
            ) / 30,
          ) * 30,
      };
    }, [
      businessHours,
    ]);

  const calendarRows =
    useMemo(
      () =>
        Array.from(
          {
            length: Math.ceil(
              (calendarBounds.end -
                calendarBounds.start) /
                HALF_HOUR_MINUTES,
            ),
          },
          (_, index) =>
            calendarBounds.start +
            index *
              HALF_HOUR_MINUTES,
        ),
      [calendarBounds],
    );

  function getBusinessHoursForDay(
    date: Date,
  ) {
    const weekday =
      getWeekdayIndex(date);

    return businessHours
      .filter(
        (item) =>
          item.day_of_week ===
          weekday,
      )
      .sort(
        (a, b) =>
          timeToMinutes(
            a.start_time,
          ) -
          timeToMinutes(
            b.start_time,
          ),
      );
  }

  function isSlotOpen(
    date: Date,
    startMinutes: number,
  ) {
    const endMinutes =
      startMinutes +
      HALF_HOUR_MINUTES;

    return getBusinessHoursForDay(
      date,
    ).some(
      (hour) =>
        startMinutes >=
          timeToMinutes(
            hour.start_time,
          ) &&
        endMinutes <=
          timeToMinutes(
            hour.end_time,
          ),
    );
  }

  function getCalendarAppointmentStyle(
    appointment: OwnerAppointment,
  ) {
    const start =
      getMinutesOfDay(
        appointment.start_at,
      );

    const duration =
      getDurationMinutes(
        appointment.start_at,
        appointment.end_at,
      );

    const top =
      ((start -
        calendarBounds.start) /
        HALF_HOUR_MINUTES) *
      HALF_HOUR_HEIGHT;

    const height =
      Math.max(
        42,
        (duration /
          HALF_HOUR_MINUTES) *
          HALF_HOUR_HEIGHT,
      );

    return {
      top:
        `${top}px`,
      height:
        `${height}px`,
    };
  }

  function getAvailableEmployeesForSelection(
    serviceId: string,
    date: string,
    time: string,
  ) {
    if (
      !serviceId ||
      !date ||
      !time
    ) {
      return [];
    }

    const service =
      activeServices.find(
        (item) =>
          item.id ===
          serviceId,
      );

    if (!service) {
      return [];
    }

    const startAt =
      new Date(
        `${date}T${time}:00`,
      );

    if (
      Number.isNaN(
        startAt.getTime(),
      )
    ) {
      return [];
    }

    const endAt =
      new Date(
        startAt.getTime() +
          service.duration_minutes *
            60 *
            1000,
      );

    const weekday =
      getWeekdayIndex(
        startAt,
      );

    const startMinutes =
      startAt.getHours() * 60 +
      startAt.getMinutes();

    const endMinutes =
      endAt.getHours() * 60 +
      endAt.getMinutes();

    const withinBusinessHours =
      businessHours.some(
        (hour) =>
          hour.day_of_week ===
            weekday &&
          startMinutes >=
            timeToMinutes(
              hour.start_time,
            ) &&
          endMinutes <=
            timeToMinutes(
              hour.end_time,
            ),
      );

    if (!withinBusinessHours) {
      return [];
    }

    return activeEmployees.filter(
      (employee) => {
        const canPerform =
          (
            employeeServices[
              employee.id
            ] ?? []
          ).includes(
            serviceId,
          );

        if (!canPerform) {
          return false;
        }

        const availabilityFits =
          (
            employeeAvailability[
              employee.id
            ] ?? []
          ).some(
            (availability) =>
              availability.day_of_week ===
                weekday &&
              startMinutes >=
                timeToMinutes(
                  availability.start_time,
                ) &&
              endMinutes <=
                timeToMinutes(
                  availability.end_time,
                ),
          );

        if (!availabilityFits) {
          return false;
        }

        const hasConflict =
          appointments.some(
            (appointment) => {
              const status =
                appointment.status.toLowerCase();

              if (
                appointment.id ===
                editingAppointment?.id
              ) {
                return false;
              }

              if (
                appointment.employee_id !==
                employee.id
              ) {
                return false;
              }

              if (
                ![
                  "pending",
                  "confirmed",
                ].includes(status)
              ) {
                return false;
              }

              const existingStart =
                new Date(
                  appointment.start_at,
                );

              const existingEnd =
                new Date(
                  appointment.end_at,
                );

              return (
                existingStart <
                  endAt &&
                existingEnd >
                  startAt
              );
            },
          );

        return !hasConflict;
      },
    );
  }

  function openCreateModal(
    date = selectedDate,
    time?: string,
  ) {
    setModalMode(
      "create",
    );

    setCustomerEntryMode(
      "new",
    );

    setEditingAppointment(
      null,
    );

    setForm({
      ...EMPTY_FORM,
      date,
      time:
        time ||
        getDefaultTimeForDate(
          date,
          businessHours,
        ),
    });

    setError(null);
    setModalOpen(true);
  }

  function openEditModal(
    appointment: OwnerAppointment,
  ) {
    const start =
      new Date(
        appointment.start_at,
      );

    const date =
      getLocalDateString(
        start,
      );

    const time =
      `${String(
        start.getHours(),
      ).padStart(
        2,
        "0",
      )}:${String(
        start.getMinutes(),
      ).padStart(
        2,
        "0",
      )}`;

    setModalMode(
      "edit",
    );

    setCustomerEntryMode(
      "existing",
    );

    setEditingAppointment(
      appointment,
    );

    setForm({
      customer_id:
        appointment.customer_id,

      customer_name:
        appointment.customer_name ||
        "",

      customer_phone:
        appointment.customer_phone ||
        "",

      customer_email:
        appointment.customer_email ||
        "",

      customer_profile_note:
        "",

      service_id:
        appointment.service_id,

      employee_id:
        appointment.employee_id,

      date,

      time,

      customer_note:
        appointment.customer_note ||
        "",

      internal_note:
        appointment.internal_note ||
        "",
    });

    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingAppointment(
      null,
    );

    setForm(
      EMPTY_FORM,
    );
  }

  function updateFormField<
    K extends keyof AppointmentFormState,
  >(
    field: K,
    value: AppointmentFormState[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function handleServiceChange(
    serviceId: string,
  ) {
    updateFormField(
      "service_id",
      serviceId,
    );

    const availableEmployees =
      getAvailableEmployeesForSelection(
        serviceId,
        form.date,
        form.time,
      );

    updateFormField(
      "employee_id",
      availableEmployees[0]
        ?.id ?? "",
    );
  }

  function handleDateFieldChange(
    date: string,
  ) {
    const nextTime =
      modalMode ===
        "create" &&
      date
        ? getDefaultTimeForDate(
            date,
            businessHours,
          )
        : form.time;

    updateFormField(
      "date",
      date,
    );

    if (
      nextTime !==
      form.time
    ) {
      updateFormField(
        "time",
        nextTime,
      );
    }

    const availableEmployees =
      getAvailableEmployeesForSelection(
        form.service_id,
        date,
        nextTime,
      );

    if (
      !availableEmployees.some(
        (employee) =>
          employee.id ===
          form.employee_id,
      )
    ) {
      updateFormField(
        "employee_id",
        availableEmployees[0]
          ?.id ?? "",
      );
    }
  }

  function handleTimeFieldChange(
    time: string,
  ) {
    updateFormField(
      "time",
      time,
    );

    const availableEmployees =
      getAvailableEmployeesForSelection(
        form.service_id,
        form.date,
        time,
      );

    if (
      !availableEmployees.some(
        (employee) =>
          employee.id ===
          form.employee_id,
      )
    ) {
      updateFormField(
        "employee_id",
        availableEmployees[0]
          ?.id ?? "",
      );
    }
  }

  async function handleAppointmentSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      !form.service_id
    ) {
      setError(
        "Lütfen bir hizmet seçin.",
      );

      return;
    }

    if (
      !form.employee_id
    ) {
      setError(
        "Lütfen bir çalışan seçin.",
      );

      return;
    }

    if (
      !form.date ||
      !form.time
    ) {
      setError(
        "Tarih ve saat zorunludur.",
      );

      return;
    }

    const selectedService =
      activeServices.find(
        (service) =>
          service.id ===
          form.service_id,
      );

    if (
      !selectedService
    ) {
      setError(
        "Seçilen hizmet bulunamadı.",
      );

      return;
    }

    const employeeCanPerform =
      (
        employeeServices[
          form.employee_id
        ] ?? []
      ).includes(
        form.service_id,
      );

    if (
      !employeeCanPerform
    ) {
      setError(
        "Seçilen çalışan bu hizmeti vermiyor.",
      );

      return;
    }

    setSaving(true);
    setError(null);

    try {
      const startAt =
        getDateAndTimeISO(
          form.date,
          form.time,
        );

      if (
        modalMode ===
        "create"
      ) {
        let customerId =
          form.customer_id;

        /*
         * Yeni müşteri
         * oluşturulacaksa önce
         * müşteriyi kaydediyoruz.
         */

        if (
          customerEntryMode ===
          "new"
        ) {
          const fullName =
            form.customer_name.trim();

          const phone =
            form.customer_phone.trim();

          if (!fullName) {
            setError(
              "Müşteri ad soyad bilgisi zorunludur.",
            );

            setSaving(false);

            return;
          }

          if (!phone) {
            setError(
              "Müşteri telefon numarası zorunludur.",
            );

            setSaving(false);

            return;
          }

          const normalizedPhone =
            normalizePhone(
              phone,
            );

          const existingCustomer =
            customers.find(
              (customer) =>
                normalizePhone(
                  customer.phone,
                ) ===
                normalizedPhone,
            );

          if (
            existingCustomer
          ) {
            setError(
              "Bu telefon numarasına ait bir müşteri zaten kayıtlı. Kayıtlı müşteri seçeneğini kullanabilirsiniz.",
            );

            setSaving(false);

            return;
          }

          const newCustomer =
            await createOwnerCustomer(
              token,
              {
                full_name:
                  fullName,

                phone,

                email:
                  form.customer_email.trim() ||
                  null,

                notes:
                  form.customer_profile_note.trim() ||
                  null,
              },
            );

          customerId =
            newCustomer.id;

          setCustomers(
            (current) => [
              newCustomer,
              ...current,
            ],
          );
        }

        if (
          !customerId
        ) {
          setError(
            "Lütfen bir müşteri seçin veya yeni müşteri bilgilerini girin.",
          );

          setSaving(false);

          return;
        }

        const created =
          await createOwnerAppointment(
            token,
            {
              customer_id:
                customerId,

              employee_id:
                form.employee_id,

              service_id:
                form.service_id,

              start_at:
                startAt,

              customer_note:
                form.customer_note.trim() ||
                null,

              internal_note:
                form.internal_note.trim() ||
                null,
            },
          );

        setAppointments(
          (current) => [
            ...current,
            created,
          ],
        );

        closeModal();

        await handleDateChange(
          form.date,
        );

        setSelectedAppointmentId(
          created.id,
        );

        router.replace(
          `/dashboard/appointments?date=${form.date}&appointment=${created.id}`,
          {
            scroll: false,
          },
        );
      }

      if (
        modalMode ===
          "edit" &&
        editingAppointment
      ) {
        const updated =
          await updateOwnerAppointment(
            token,
            editingAppointment.id,
            {
              employee_id:
                form.employee_id,

              service_id:
                form.service_id,

              start_at:
                startAt,

              customer_note:
                form.customer_note.trim() ||
                null,

              internal_note:
                form.internal_note.trim() ||
                null,
            },
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

        closeModal();

        await handleDateChange(
          form.date,
        );

        setSelectedAppointmentId(
          updated.id,
        );

        router.replace(
          `/dashboard/appointments?date=${form.date}&appointment=${updated.id}`,
          {
            scroll: false,
          },
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Randevu kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    appointmentId: string,
    status: OwnerAppointmentStatus,
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
            (
              appointment,
            ) =>
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
      setUpdatingId(
        null,
      );
    }
  }

  function openAppointmentDetail(
    appointmentId: string,
  ) {
    setSelectedAppointmentId(
      appointmentId,
    );

    router.replace(
      `/dashboard/appointments?date=${selectedDate}&appointment=${appointmentId}`,
      {
        scroll: false,
      },
    );
  }

  function closeAppointmentDetail() {
    setSelectedAppointmentId(
      null,
    );

    router.replace(
      `/dashboard/appointments?date=${selectedDate}`,
      {
        scroll: false,
      },
    );
  }

  async function handleDateChange(
    date: string,
  ) {
    setSelectedDate(
      date,
    );

    setSelectedAppointmentId(
      null,
    );

    setError(null);
    setRangeLoading(true);

    router.replace(
      `/dashboard/appointments?date=${date}`,
      {
        scroll: false,
      },
    );

    try {
      await loadWeek(
        date,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Randevular yüklenemedi.",
      );
    } finally {
      setRangeLoading(
        false,
      );
    }
  }

  function selectDay(
    date: Date,
  ) {
    const dateString =
      getLocalDateString(
        date,
      );

    setSelectedDate(
      dateString,
    );

    setSelectedAppointmentId(
      null,
    );

    router.replace(
      `/dashboard/appointments?date=${dateString}`,
      {
        scroll: false,
      },
    );
  }

  async function moveWeek(
    direction: number,
  ) {
    const nextDate =
      addDays(
        parseDateString(
          selectedDate,
        ),
        direction * 7,
      );

    await handleDateChange(
      getLocalDateString(
        nextDate,
      ),
    );
  }

  async function goToToday() {
    await handleDateChange(
      getLocalDateString(),
    );
  }

  function logout() {
    clearAccessToken();

    router.replace("/");

    router.refresh();
  }

  const availableFormEmployees =
    useMemo(
      () =>
        getAvailableEmployeesForSelection(
          form.service_id,
          form.date,
          form.time,
        ),
      [
        form.service_id,
        form.date,
        form.time,
        activeEmployees,
        activeServices,
        employeeServices,
        employeeAvailability,
        businessHours,
        appointments,
        editingAppointment?.id,
      ],
    );

  useEffect(() => {
    if (
      !modalOpen ||
      !form.service_id ||
      !form.date ||
      !form.time
    ) {
      return;
    }

    const availableEmployees =
      getAvailableEmployeesForSelection(
        form.service_id,
        form.date,
        form.time,
      );

    if (
      !availableEmployees.some(
        (employee) =>
          employee.id ===
          form.employee_id,
      )
    ) {
      updateFormField(
        "employee_id",
        availableEmployees[0]
          ?.id ?? "",
      );
    }
  }, [
    modalOpen,
    form.service_id,
    form.date,
    form.time,
    form.employee_id,
    activeEmployees,
    activeServices,
    employeeServices,
    employeeAvailability,
    businessHours,
    appointments,
    editingAppointment?.id,
  ]);

  const selectedService =
    useMemo(
      () =>
        activeServices.find(
          (service) =>
            service.id ===
            form.service_id,
        ) ?? null,
      [
        activeServices,
        form.service_id,
      ],
    );

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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
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
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardSidebar />

        <section className="min-w-0 flex-1">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Randevu yönetimi
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Randevular
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Haftalık görünümden
                randevuları takip edin,
                boş bir saate
                tıklayarak yeni
                randevu oluşturun ve
                mevcut randevuları
                yönetin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openCreateModal()
                }
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                <span className="mr-2 text-lg leading-none">
                  +
                </span>
                Randevu Ekle
              </button>

              <button
                type="button"
                onClick={
                  goToToday
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Bugün
              </button>

              <button
                type="button"
                onClick={() =>
                  moveWeek(-1)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() =>
                  moveWeek(1)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                →
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError(
                    null,
                  )
                }
                className="shrink-0 font-bold text-red-500 hover:text-red-700"
              >
                Kapat
              </button>
            </div>
          )}

          {/* SUMMARY CARDS */}

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label:
                  "Toplam",
                value:
                  counts.all,
                filter:
                  "all" as const,
                icon:
                  "Σ",
                gradient:
                  "from-indigo-600 via-violet-600 to-purple-600",
              },
              {
                label:
                  "Bekliyor",
                value:
                  counts.pending,
                filter:
                  "pending" as const,
                icon:
                  "◷",
                gradient:
                  "from-amber-400 via-orange-500 to-rose-500",
              },
              {
                label:
                  "Onaylandı",
                value:
                  counts.confirmed,
                filter:
                  "confirmed" as const,
                icon:
                  "✓",
                gradient:
                  "from-blue-500 via-indigo-500 to-violet-600",
              },
              {
                label:
                  "Tamamlandı",
                value:
                  counts.completed,
                filter:
                  "completed" as const,
                icon:
                  "✓",
                gradient:
                  "from-emerald-500 via-teal-500 to-cyan-600",
              },
              {
                label:
                  "İptal",
                value:
                  counts.cancelled,
                filter:
                  "cancelled" as const,
                icon:
                  "×",
                gradient:
                  "from-rose-500 via-red-500 to-pink-600",
              },
              {
                label:
                  "Gelmedi",
                value:
                  counts.no_show,
                filter:
                  "no_show" as const,
                icon:
                  "—",
                gradient:
                  "from-slate-500 via-slate-600 to-slate-800",
              },
            ].map(
              (item) => {
                const active =
                  activeFilter ===
                  item.filter;

                return (
                  <button
                    key={
                      item.filter
                    }
                    type="button"
                    onClick={() =>
                      setActiveFilter(
                        item.filter,
                      )
                    }
                    className={`group relative overflow-hidden rounded-[1.4rem] p-[1px] text-left transition ${
                      active
                        ? "ring-4 ring-indigo-100"
                        : ""
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
                    />

                    <div className="relative rounded-[1.35rem] bg-slate-950/5 p-5 text-white backdrop-blur-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                            {item.label}
                          </p>

                          <p className="mt-2 text-3xl font-black tracking-tight">
                            {item.value}
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-black backdrop-blur-sm">
                          {
                            item.icon
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/65">
                          Filtrele
                        </span>

                        <span className="text-sm font-bold text-white/80 transition group-hover:translate-x-0.5">
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              },
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
                Haftalık takvim
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {formatDateShort(
                  weekStart,
                )}{" "}
                –{" "}
                {formatDateShort(
                  addDays(
                    weekStart,
                    6,
                  ),
                )}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
              <input
                type="search"
                value={
                  customerFilter
                }
                onChange={(
                  event,
                ) =>
                  setCustomerFilter(
                    event.target
                      .value,
                  )
                }
                placeholder="Müşteri ara..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 sm:w-56"
              />

              <input
                type="search"
                value={
                  employeeFilter
                }
                onChange={(
                  event,
                ) =>
                  setEmployeeFilter(
                    event.target
                      .value,
                  )
                }
                placeholder="Çalışan ara..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 sm:w-56"
              />

              <input
                type="search"
                value={
                  serviceFilter
                }
                onChange={(
                  event,
                ) =>
                  setServiceFilter(
                    event.target
                      .value,
                  )
                }
                placeholder="Hizmet ara..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 sm:w-48"
              />

              {rangeLoading && (
                <span className="whitespace-nowrap text-xs font-semibold text-slate-400">
                  Güncelleniyor...
                </span>
              )}
            </div>
          </div>

          {/* CALENDAR */}

          <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[72px_repeat(7,minmax(126px,1fr))] border-b border-slate-200 bg-slate-50">
                  <div className="border-r border-slate-200 px-2 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Saat
                  </div>

                  {weekDays.map(
                    (day) => {
                      const dateKey =
                        getLocalDateString(
                          day,
                        );

                      const active =
                        dateKey ===
                        selectedDate;

                      const dayHours =
                        getBusinessHoursForDay(
                          day,
                        );

                      const isClosed =
                        dayHours.length ===
                        0;

                      return (
                        <button
                          key={
                            dateKey
                          }
                          type="button"
                          onClick={() =>
                            selectDay(
                              day,
                            )
                          }
                          className={`border-r border-slate-200 px-3 py-4 text-left transition last:border-r-0 ${
                            active
                              ? "bg-indigo-50"
                              : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p
                                className={`text-xs font-bold uppercase ${
                                  active
                                    ? "text-indigo-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {
                                  WEEKDAY_LABELS[
                                    getWeekdayIndex(
                                      day,
                                    )
                                  ]
                                }
                              </p>

                              <p
                                className={`mt-1 text-xl font-black ${
                                  active
                                    ? "text-indigo-700"
                                    : "text-slate-900"
                                }`}
                              >
                                {
                                  day.getDate()
                                }
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                isClosed
                                  ? "bg-slate-200 text-slate-500"
                                  : "bg-white text-slate-500"
                              }`}
                            >
                              {isClosed
                                ? "Kapalı"
                                : dayHours
                                    .map(
                                      (
                                        hour,
                                      ) =>
                                        `${formatTimeInput(
                                          hour.start_time,
                                        )}-${formatTimeInput(
                                          hour.end_time,
                                        )}`,
                                    )
                                    .join(
                                      " · ",
                                    )}
                            </span>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>

                <div className="grid grid-cols-[72px_repeat(7,minmax(126px,1fr))]">
                  <div className="border-r border-slate-200 bg-slate-50">
                    {calendarRows.map(
                      (
                        minutes,
                      ) => (
                        <div
                          key={
                            minutes
                          }
                          className="flex h-[42px] items-start justify-center border-b border-slate-100 pt-1 text-[10px] font-semibold text-slate-400"
                        >
                          {minutesToTime(
                            minutes,
                          )}
                        </div>
                      ),
                    )}
                  </div>

                  {weekDays.map(
                    (day) => {
                      const dateKey =
                        getLocalDateString(
                          day,
                        );

                      const dayHours =
                        getBusinessHoursForDay(
                          day,
                        );

                      const isClosed =
                        dayHours.length ===
                        0;

                      const dayAppointments =
                        filteredCalendarAppointments.filter(
                          (
                            appointment,
                          ) =>
                            getDateKey(
                              appointment.start_at,
                            ) ===
                            dateKey,
                        );

                      const isToday =
                        dateKey ===
                        getLocalDateString();

                      const now =
                        new Date();

                      const currentMinutes =
                        now.getHours() *
                          60 +
                        now.getMinutes();

                      const showCurrentLine =
                        isToday &&
                        currentMinutes >=
                          calendarBounds.start &&
                        currentMinutes <=
                          calendarBounds.end;

                      return (
                        <div
                          key={
                            dateKey
                          }
                          className={`relative border-r border-slate-200 last:border-r-0 ${
                            isClosed
                              ? "bg-slate-50/90"
                              : "bg-white"
                          }`}
                          style={{
                            minHeight:
                              `${
                                calendarRows.length *
                                HALF_HOUR_HEIGHT
                              }px`,
                          }}
                        >
                          {calendarRows.map(
                            (
                              minutes,
                            ) => {
                              const open =
                                isSlotOpen(
                                  day,
                                  minutes,
                                );

                              return (
                                <div
                                  key={
                                    minutes
                                  }
                                  role={
                                    open
                                      ? "button"
                                      : undefined
                                  }
                                  tabIndex={
                                    open
                                      ? 0
                                      : undefined
                                  }
                                  onClick={() => {
                                    if (
                                      open
                                    ) {
                                      openCreateModal(
                                        dateKey,
                                        minutesToTime(
                                          minutes,
                                        ),
                                      );
                                    }
                                  }}
                                  onKeyDown={(
                                    event,
                                  ) => {
                                    if (
                                      open &&
                                      (event.key ===
                                        "Enter" ||
                                        event.key ===
                                          " ")
                                    ) {
                                      event.preventDefault();

                                      openCreateModal(
                                        dateKey,
                                        minutesToTime(
                                          minutes,
                                        ),
                                      );
                                    }
                                  }}
                                  className={`h-[42px] border-b border-slate-100 ${
                                    open
                                      ? "cursor-pointer hover:bg-indigo-50/60"
                                      : "cursor-default"
                                  }`}
                                />
                              );
                            },
                          )}

                          {showCurrentLine && (
                            <div
                              className="pointer-events-none absolute left-0 right-0 z-20"
                              style={{
                                top: `${
                                  ((currentMinutes -
                                    calendarBounds.start) /
                                    HALF_HOUR_MINUTES) *
                                  HALF_HOUR_HEIGHT
                                }px`,
                              }}
                            >
                              <div className="h-px bg-indigo-500" />

                              <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-indigo-500" />
                            </div>
                          )}

                          {dayAppointments.map(
                            (
                              appointment,
                            ) => {
                              const style =
                                getCalendarAppointmentStyle(
                                  appointment,
                                );

                              return (
                                <button
                                  key={
                                    appointment.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    openAppointmentDetail(
                                      appointment.id,
                                    )
                                  }
                                  className={`absolute left-1 right-1 z-10 overflow-hidden rounded-xl border px-2.5 py-2 text-left shadow-sm transition ${calendarCardClasses(
                                    appointment.status,
                                  )}`}
                                  style={
                                    style
                                  }
                                >
                                  <div className="truncate text-xs font-black">
                                    {formatTime(
                                      appointment.start_at,
                                    )}{" "}
                                    ·{" "}
                                    {getCustomerName(
                                      appointment,
                                    )}
                                  </div>

                                  <div className="mt-1 truncate text-[11px] font-semibold opacity-80">
                                    {getServiceName(
                                      appointment,
                                    )}
                                  </div>

                                  <div className="mt-1 truncate text-[10px] opacity-70">
                                    {getEmployeeName(
                                      appointment,
                                    )}
                                  </div>
                                </button>
                              );
                            },
                          )}

                          {isClosed && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <span className="-rotate-90 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                                Kapalı
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-medium text-slate-500">
                Açık ve boş bir
                saate tıklayarak
                direkt randevu
                oluşturabilirsin.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  Onaylandı
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Bekliyor
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Tamamlandı
                </span>
              </div>
            </div>
          </section>

          {/* DAY LIST */}

          <section className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                  {new Intl.DateTimeFormat(
                    "tr-TR",
                    {
                      dateStyle:
                        "long",
                    },
                  ).format(
                    parseDateString(
                      selectedDate,
                    ),
                  )}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Günün randevuları
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  openCreateModal()
                }
                className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
              >
                + Randevu Ekle
              </button>
            </div>

            {selectedDayAppointments.length ===
            0 ? (
              <div className="mt-5 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  📅
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-950">
                  Bu filtrede
                  randevu yok.
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Bu gün için
                  gösterilecek
                  randevu
                  bulunmuyor.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openCreateModal()
                  }
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                >
                  Randevu Oluştur
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {selectedDayAppointments.map(
                  (
                    appointment,
                  ) => {
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
                        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                          <div className="shrink-0 xl:w-36">
                            <div className="text-2xl font-black text-indigo-600">
                              {formatTime(
                                appointment.start_at,
                              )}
                            </div>

                            <div className="mt-1 text-sm text-slate-400">
                              {formatDate(
                                appointment.start_at,
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-slate-950">
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

                            <div className="mt-2 text-xs font-semibold text-slate-400">
                              {formatTime(
                                appointment.start_at,
                              )}{" "}
                              –{" "}
                              {formatTime(
                                appointment.end_at,
                              )}
                            </div>

                            {appointment.customer_note && (
                              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                <span className="font-bold">
                                  Müşteri
                                  notu:
                                </span>{" "}
                                {
                                  appointment.customer_note
                                }
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                openAppointmentDetail(
                                  appointment.id,
                                )
                              }
                              className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
                            >
                              Detay
                            </button>

                            {status ===
                              "pending" && (
                              <>
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
                                    ? "..."
                                    : "Onayla"}
                                </button>

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
                              </>
                            )}

                            {status ===
                              "confirmed" && (
                              <>
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
                                    ? "..."
                                    : "Tamamla"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    isUpdating
                                  }
                                  onClick={() =>
                                    handleStatusChange(
                                      appointment.id,
                                      "no_show",
                                    )
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Gelmedi
                                </button>

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
                              </>
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
        </section>
      </div>

      {/* CREATE / EDIT MODAL */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(
            event,
          ) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/80 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
                    {modalMode ===
                    "create"
                      ? "Yeni randevu"
                      : "Randevu düzenle"}
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {modalMode ===
                    "create"
                      ? "Randevu oluştur"
                      : "Randevu bilgilerini düzenle"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
                >
                  Kapat
                </button>
              </div>
            </div>

            <form
              onSubmit={
                handleAppointmentSubmit
              }
              className="space-y-6 p-6"
            >
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* CUSTOMER */}

              {modalMode ===
                "create" && (
                <section>
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                      01 · Müşteri
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      Randevu sahibi
                    </h3>
                  </div>

                  <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCustomerEntryMode(
                          "new",
                        )
                      }
                      className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                        customerEntryMode ===
                        "new"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Yeni müşteri
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCustomerEntryMode(
                          "existing",
                        )
                      }
                      className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                        customerEntryMode ===
                        "existing"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Kayıtlı müşteri
                    </button>
                  </div>

                  {customerEntryMode ===
                  "new" ? (
                    <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          Ad Soyad
                        </label>

                        <input
                          required
                          value={
                            form.customer_name
                          }
                          onChange={(
                            event,
                          ) =>
                            updateFormField(
                              "customer_name",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Örn. Ayşe Yılmaz"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">
                            Telefon
                          </label>

                          <input
                            required
                            value={
                              form.customer_phone
                            }
                            onChange={(
                              event,
                            ) =>
                              updateFormField(
                                "customer_phone",
                                event.target
                                  .value,
                              )
                            }
                            placeholder="05xx xxx xx xx"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">
                            E-posta
                          </label>

                          <input
                            type="email"
                            value={
                              form.customer_email
                            }
                            onChange={(
                              event,
                            ) =>
                              updateFormField(
                                "customer_email",
                                event.target
                                  .value,
                              )
                            }
                            placeholder="ornek@mail.com"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                          Müşteri profiline not
                        </label>

                        <textarea
                          rows={2}
                          value={
                            form.customer_profile_note
                          }
                          onChange={(
                            event,
                          ) =>
                            updateFormField(
                              "customer_profile_note",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Bu not müşterinin profilinde saklanır..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>

                      <p className="text-xs leading-5 text-indigo-600">
                        Bu bilgilerle yeni
                        müşteri oluşturulacak
                        ve Müşteriler
                        bölümüne otomatik
                        olarak kaydedilecektir.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Kayıtlı müşteri
                      </label>

                      <select
                        value={
                          form.customer_id
                        }
                        onChange={(
                          event,
                        ) =>
                          updateFormField(
                            "customer_id",
                            event.target
                              .value,
                          )}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                      >
                        <option value="">
                          Müşteri seçin
                        </option>

                        {customers.map(
                          (
                            customer,
                          ) => (
                            <option
                              key={
                                customer.id
                              }
                              value={
                                customer.id
                              }
                            >
                              {
                                customer.full_name
                              }{" "}
                              ·{" "}
                              {
                                customer.phone
                              }
                            </option>
                          ),
                        )}
                      </select>

                      {customers.length ===
                        0 && (
                        <p className="mt-2 text-xs font-medium text-amber-600">
                          Henüz kayıtlı müşteri
                          bulunmuyor.
                        </p>
                      )}
                    </div>
                  )}
                </section>
              )}

              {modalMode ===
                "edit" &&
                editingAppointment && (
                  <section>
                    <div className="mb-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                        01 · Müşteri
                      </p>

                      <h3 className="mt-1 text-lg font-black text-slate-900">
                        Müşteri bilgisi
                      </h3>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-indigo-900">
                            {
                              editingAppointment.customer_name
                            }
                          </p>

                          {editingAppointment.customer_phone && (
                            <p className="mt-1 text-xs text-indigo-600">
                              {
                                editingAppointment.customer_phone
                              }
                            </p>
                          )}
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-600">
                          Sabit
                        </span>
                      </div>
                    </div>
                  </section>
                )}

              {/* SERVICE */}

              <section>
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                    02 · Hizmet
                  </p>

                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Hizmet ve çalışan
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Hizmet
                    </label>

                    <select
                      value={
                        form.service_id
                      }
                      onChange={(
                        event,
                      ) =>
                        handleServiceChange(
                          event.target
                            .value,
                        )
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                    >
                      <option value="">
                        Hizmet seçin
                      </option>

                      {activeServices.map(
                        (
                          service,
                        ) => (
                          <option
                            key={
                              service.id
                            }
                            value={
                              service.id
                            }
                          >
                            {
                              service.name
                            }{" "}
                            ·{" "}
                            {
                              service.duration_minutes
                            }{" "}
                            dk ·{" "}
                            {
                              service.price
                            }{" "}
                            {
                              service.currency
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Çalışan
                    </label>

                    <select
                      value={
                        form.employee_id
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFormField(
                          "employee_id",
                          event.target
                            .value,
                        )}
                      required
                      disabled={
                        !form.service_id
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="">
                        {form.service_id
                          ? "Çalışan seçin"
                          : "Önce hizmet seçin"}
                      </option>

                      {availableFormEmployees.map(
                        (
                          employee,
                        ) => (
                          <option
                            key={
                              employee.id
                            }
                            value={
                              employee.id
                            }
                          >
                            {
                              employee.display_name ||
                                `${employee.first_name} ${employee.last_name}`
                            }
                          </option>
                        ),
                      )}
                    </select>

                    {form.service_id &&
                      form.date &&
                      form.time &&
                      availableFormEmployees.length ===
                        0 && (
                        <p className="mt-2 text-xs font-medium text-amber-600">
                          Bu tarih ve saatte bu
                          hizmet için müsait çalışan
                          bulunmuyor.
                        </p>
                      )}

                  </div>
                </div>

                {selectedService && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-indigo-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-500">
                        Süre
                      </p>

                      <p className="mt-1 text-sm font-black text-indigo-900">
                        {
                          selectedService.duration_minutes
                        }{" "}
                        dakika
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Fiyat
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        {
                          selectedService.price
                        }{" "}
                        {
                          selectedService.currency
                        }
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* DATE */}

              <section>
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                    03 · Tarih ve saat
                  </p>

                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Randevu zamanı
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Tarih
                    </label>

                    <input
                      type="date"
                      value={
                        form.date
                      }
                      onChange={(
                        event,
                      ) =>
                        handleDateFieldChange(
                          event.target
                            .value,
                        )
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Başlangıç saati
                    </label>

                    <input
                      type="time"
                      value={
                        form.time
                      }
                      onChange={(
                        event,
                      ) =>
                        handleTimeFieldChange(
                          event.target.value,
                        )
                      }
                      required
                      step={1800}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Randevu kaydedilirken
                  işletme çalışma saatleri,
                  çalışan müsaitliği ve
                  mevcut randevularla
                  çakışma tekrar kontrol
                  edilir.
                </p>
              </section>

              {/* NOTES */}

              <section>
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                    04 · Notlar
                  </p>

                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Randevu notları
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Müşteri notu
                    </label>

                    <textarea
                      rows={3}
                      value={
                        form.customer_note
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFormField(
                          "customer_note",
                          event.target
                            .value,
                        )
                      }
                      placeholder="Müşterinin görebileceği randevu notu..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      İç not
                    </label>

                    <textarea
                      rows={3}
                      value={
                        form.internal_note
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFormField(
                          "internal_note",
                          event.target
                            .value,
                        )
                      }
                      placeholder="Sadece işletme ekibinin göreceği not..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-amber-50/40 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    resourceLoading
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Kaydediliyor..."
                    : modalMode ===
                        "create"
                      ? "Randevuyu Oluştur"
                      : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAIL */}

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(
            event,
          ) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              closeAppointmentDetail();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/80 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
                    Randevu detayları
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {getServiceName(
                      selectedAppointment,
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {formatDate(
                      selectedAppointment.start_at,
                    )}{" "}
                    ·{" "}
                    {formatTime(
                      selectedAppointment.start_at,
                    )}{" "}
                    –{" "}
                    {formatTime(
                      selectedAppointment.end_at,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeAppointmentDetail
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(
                    selectedAppointment.status,
                  )}`}
                >
                  {formatStatus(
                    selectedAppointment.status,
                  )}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                  {getDurationMinutes(
                    selectedAppointment.start_at,
                    selectedAppointment.end_at,
                  )}{" "}
                  dk
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Müşteri
                  </p>

                  <p className="mt-2 text-sm font-black text-slate-900">
                    {getCustomerName(
                      selectedAppointment,
                    )}
                  </p>

                  {selectedAppointment.customer_phone && (
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        selectedAppointment.customer_phone
                      }
                    </p>
                  )}

                  {selectedAppointment.customer_email && (
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {
                        selectedAppointment.customer_email
                      }
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Çalışan
                  </p>

                  <p className="mt-2 text-sm font-black text-slate-900">
                    {getEmployeeName(
                      selectedAppointment,
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-500">
                      Zaman
                    </p>

                    <p className="mt-1 text-lg font-black text-indigo-900">
                      {formatTime(
                        selectedAppointment.start_at,
                      )}{" "}
                      –{" "}
                      {formatTime(
                        selectedAppointment.end_at,
                      )}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">
                    {formatDate(
                      selectedAppointment.start_at,
                    )}
                  </span>
                </div>
              </div>

              {selectedAppointment.customer_note && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Müşteri notu
                  </p>

                  <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                    {
                      selectedAppointment.customer_note
                    }
                  </div>
                </div>
              )}

              {selectedAppointment.internal_note && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    İç not
                  </p>

                  <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    {
                      selectedAppointment.internal_note
                    }
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    closeAppointmentDetail();
                    openEditModal(
                      selectedAppointment,
                    );
                  }}
                  disabled={
                    ![
                      "pending",
                      "confirmed",
                    ].includes(
                      selectedAppointment.status.toLowerCase(),
                    )
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Düzenle
                </button>

                {selectedAppointment.status.toLowerCase() ===
                  "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedAppointment.id
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedAppointment.id,
                          "confirmed",
                        )
                      }
                      className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      Onayla
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedAppointment.id
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedAppointment.id,
                          "cancelled",
                        )
                      }
                      className="rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      İptal Et
                    </button>
                  </>
                )}

                {selectedAppointment.status.toLowerCase() ===
                  "confirmed" && (
                  <>
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedAppointment.id
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedAppointment.id,
                          "completed",
                        )
                      }
                      className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Tamamlandı
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedAppointment.id
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedAppointment.id,
                          "no_show",
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Gelmedi
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedAppointment.id
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedAppointment.id,
                          "cancelled",
                        )
                      }
                      className="rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      İptal Et
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}