"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getBusinessHours,
  getEmployeeAvailability,
  getMe,
  getOwnerEmployees,
  replaceBusinessHours,
  replaceEmployeeAvailability,
  type AuthUser,
  type OwnerEmployee,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

type WeeklySchedule = DaySchedule[];

function createDefaultSchedule(): WeeklySchedule {
  return DAYS.map(() => ({
    enabled: false,
    start_time: "09:00",
    end_time: "18:00",
  }));
}

function normalizeTime(
  value: string,
): string {
  return value.slice(
    0,
    5,
  );
}

function createScheduleFromHours(
  hours: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[],
): WeeklySchedule {
  const schedule =
    createDefaultSchedule();

  for (const hour of hours) {
    if (
      hour.day_of_week < 0 ||
      hour.day_of_week > 6
    ) {
      continue;
    }

    schedule[
      hour.day_of_week
    ] = {
      enabled: true,
      start_time:
        normalizeTime(
          hour.start_time,
        ),
      end_time:
        normalizeTime(
          hour.end_time,
        ),
    };
  }

  return schedule;
}

function scheduleToPayload(
  schedule: WeeklySchedule,
) {
  return schedule
    .map(
      (
        day,
        index,
      ) => ({
        ...day,
        day_of_week:
          index,
      }),
    )
    .filter(
      (day) =>
        day.enabled,
    )
    .map((day) => ({
      day_of_week:
        day.day_of_week,
      start_time:
        `${day.start_time}:00`,
      end_time:
        `${day.end_time}:00`,
    }));
}

export default function WorkingHoursPage() {
  const router =
    useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    employees,
    setEmployees,
  ] = useState<
    OwnerEmployee[]
  >([]);

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState<string>(
    "",
  );

  const [
    businessSchedule,
    setBusinessSchedule,
  ] = useState<WeeklySchedule>(
    createDefaultSchedule(),
  );

  const [
    employeeSchedule,
    setEmployeeSchedule,
  ] = useState<WeeklySchedule>(
    createDefaultSchedule(),
  );

  const [loading, setLoading] =
    useState(true);

  const [
    savingBusiness,
    setSavingBusiness,
  ] = useState(false);

  const [
    savingEmployee,
    setSavingEmployee,
  ] = useState(false);

  const [
    loadingEmployeeSchedule,
    setLoadingEmployeeSchedule,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null);

  async function loadInitialData() {
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

      const [
        businessHours,
        employeeResult,
      ] = await Promise.all([
        getBusinessHours(
          token,
        ),
        getOwnerEmployees(
          token,
        ),
      ]);

      setBusinessSchedule(
        createScheduleFromHours(
          businessHours,
        ),
      );

      const activeEmployees =
        employeeResult.filter(
          (employee) =>
            employee.is_active,
        );

      setEmployees(
        activeEmployees,
      );

      if (
        activeEmployees.length >
        0
      ) {
        setSelectedEmployeeId(
          activeEmployees[0]
            .id,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Çalışma saatleri yüklenemedi.",
      );
    }
  }

  useEffect(() => {
    loadInitialData().finally(
      () => {
        setLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    async function loadEmployeeSchedule() {
      if (
        !selectedEmployeeId
      ) {
        setEmployeeSchedule(
          createDefaultSchedule(),
        );
        return;
      }

      const token =
        getAccessToken();

      if (!token) {
        return;
      }

      setLoadingEmployeeSchedule(
        true,
      );

      setError(null);

      try {
        const availability =
          await getEmployeeAvailability(
            token,
            selectedEmployeeId,
          );

        setEmployeeSchedule(
          createScheduleFromHours(
            availability,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Çalışan müsaitliği yüklenemedi.",
        );
      } finally {
        setLoadingEmployeeSchedule(
          false,
        );
      }
    }

    loadEmployeeSchedule();
  }, [
    selectedEmployeeId,
  ]);

  function updateBusinessDay(
    dayIndex: number,
    field: keyof DaySchedule,
    value: boolean | string,
  ) {
    setBusinessSchedule(
      (current) =>
        current.map(
          (
            day,
            index,
          ) =>
            index === dayIndex
              ? {
                  ...day,
                  [field]:
                    value,
                }
              : day,
        ),
    );

    setSuccessMessage(
      null,
    );
  }

  function updateEmployeeDay(
    dayIndex: number,
    field: keyof DaySchedule,
    value: boolean | string,
  ) {
    setEmployeeSchedule(
      (current) =>
        current.map(
          (
            day,
            index,
          ) =>
            index === dayIndex
              ? {
                  ...day,
                  [field]:
                    value,
                }
              : day,
        ),
    );

    setSuccessMessage(
      null,
    );
  }

  async function saveBusinessSchedule() {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );
      return;
    }

    setSavingBusiness(
      true,
    );

    setError(null);
    setSuccessMessage(
      null,
    );

    try {
      for (
        let index = 0;
        index <
        businessSchedule.length;
        index++
      ) {
        const day =
          businessSchedule[
            index
          ];

        if (
          day.enabled &&
          day.start_time >=
            day.end_time
        ) {
          setError(
            `${DAYS[index]} için başlangıç saati bitiş saatinden önce olmalı.`,
          );

          setSavingBusiness(
            false,
          );

          return;
        }
      }

      const result =
        await replaceBusinessHours(
          token,
          scheduleToPayload(
            businessSchedule,
          ),
        );

      setBusinessSchedule(
        createScheduleFromHours(
          result,
        ),
      );

      setSuccessMessage(
        "İşletme çalışma saatleri kaydedildi.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "İşletme çalışma saatleri kaydedilemedi.",
      );
    } finally {
      setSavingBusiness(
        false,
      );
    }
  }

  async function saveEmployeeSchedule() {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );
      return;
    }

    if (!selectedEmployeeId) {
      setError(
        "Önce bir çalışan seçin.",
      );
      return;
    }

    setSavingEmployee(
      true,
    );

    setError(null);
    setSuccessMessage(
      null,
    );

    try {
      for (
        let index = 0;
        index <
        employeeSchedule.length;
        index++
      ) {
        const day =
          employeeSchedule[
            index
          ];

        if (
          day.enabled &&
          day.start_time >=
            day.end_time
        ) {
          setError(
            `${DAYS[index]} için başlangıç saati bitiş saatinden önce olmalı.`,
          );

          setSavingEmployee(
            false,
          );

          return;
        }
      }

      const result =
        await replaceEmployeeAvailability(
          token,
          selectedEmployeeId,
          scheduleToPayload(
            employeeSchedule,
          ),
        );

      setEmployeeSchedule(
        createScheduleFromHours(
          result,
        ),
      );

      setSuccessMessage(
        "Çalışan müsaitliği kaydedildi.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Çalışan müsaitliği kaydedilemedi.",
      );
    } finally {
      setSavingEmployee(
        false,
      );
    }
  }

  const selectedEmployee =
    useMemo(
      () =>
        employees.find(
          (employee) =>
            employee.id ===
            selectedEmployeeId,
        ) || null,
      [
        employees,
        selectedEmployeeId,
      ],
    );

  function logout() {
    clearAccessToken();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-indigo-100 bg-white px-6 py-4 text-sm font-semibold text-slate-500">
            Çalışma saatleri
            yükleniyor...
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
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200">
              O
            </span>

            <div className="text-left">
              <div className="text-lg font-bold tracking-tight">
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

      {/* CONTENT */}
      <div className="mx-auto flex max-w-[1500px] gap-8 px-5 py-8 sm:px-8 lg:py-10">
        <DashboardSidebar />

        <section className="min-w-0 flex-1">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Müsaitlik yönetimi
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Çalışma Saatleri
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                İşletmenizin genel çalışma
                saatlerini ve çalışanların
                müsaitlik programlarını
                yönetin.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            {/* BUSINESS HOURS */}
            <section className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
                    İşletme
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Genel Çalışma Saatleri
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    İşletmenizin müşterilere açık olduğu
                    saatleri belirleyin.
                  </p>
                </div>

                <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600">
                  Haftalık
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {businessSchedule.map(
                  (
                    day,
                    index,
                  ) => (
                    <div
                      key={
                        index
                      }
                      className={[
                        "rounded-2xl border p-4 transition",
                        day.enabled
                          ? "border-slate-200 bg-white"
                          : "border-slate-100 bg-slate-50/80",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-[120px] items-center justify-between sm:w-32">
                          <span className="text-sm font-bold text-slate-800">
                            {
                              DAYS[
                                index
                              ]
                            }
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateBusinessDay(
                                index,
                                "enabled",
                                !day.enabled,
                              )
                            }
                            className={[
                              "relative h-6 w-11 rounded-full transition",
                              day.enabled
                                ? "bg-indigo-600"
                                : "bg-slate-300",
                            ].join(
                              " ",
                            )}
                            aria-label={`${DAYS[index]} çalışma durumu`}
                          >
                            <span
                              className={[
                                "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                                day.enabled
                                  ? "left-6"
                                  : "left-1",
                              ].join(
                                " ",
                              )}
                            />
                          </button>
                        </div>

                        {day.enabled ? (
                          <div className="grid flex-1 grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                Açılış
                              </label>

                              <input
                                type="time"
                                value={
                                  day.start_time
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateBusinessDay(
                                    index,
                                    "start_time",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                Kapanış
                              </label>

                              <input
                                type="time"
                                value={
                                  day.end_time
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateBusinessDay(
                                    index,
                                    "end_time",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <span className="text-sm font-medium text-slate-400">
                              Kapalı
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>

              <button
                type="button"
                onClick={
                  saveBusinessSchedule
                }
                disabled={
                  savingBusiness
                }
                className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingBusiness
                  ? "Kaydediliyor..."
                  : "İşletme Saatlerini Kaydet"}
              </button>
            </section>

            {/* EMPLOYEE AVAILABILITY */}
            <section className="rounded-[2rem] border border-violet-100 bg-white p-6 shadow-sm sm:p-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
                  Çalışan
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Çalışan Müsaitliği
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Randevu kabul edilebilecek
                  saatleri çalışan bazında
                  belirleyin.
                </p>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Çalışan seçin
                </label>

                {employees.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Aktif çalışan
                      bulunmuyor.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/dashboard/employees",
                        )
                      }
                      className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Çalışanlar
                      sayfasına git
                      →
                    </button>
                  </div>
                ) : (
                  <select
                    value={
                      selectedEmployeeId
                    }
                    onChange={(
                      event,
                    ) =>
                      setSelectedEmployeeId(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
                  >
                    {employees.map(
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
                          {employee.display_name ||
                            `${employee.first_name} ${employee.last_name}`}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </div>

              {selectedEmployee &&
                !loadingEmployeeSchedule && (
                  <div className="mt-5 rounded-2xl bg-violet-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-500">
                      Düzenlenen çalışan
                    </p>

                    <p className="mt-1 text-sm font-black text-violet-900">
                      {selectedEmployee.display_name ||
                        `${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                    </p>
                  </div>
                )}

              {loadingEmployeeSchedule ? (
                <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-400">
                  Müsaitlik
                  bilgileri
                  yükleniyor...
                </div>
              ) : (
                selectedEmployee && (
                  <>
                    <div className="mt-6 space-y-3">
                      {employeeSchedule.map(
                        (
                          day,
                          index,
                        ) => (
                          <div
                            key={
                              index
                            }
                            className={[
                              "rounded-2xl border p-4 transition",
                              day.enabled
                                ? "border-slate-200 bg-white"
                                : "border-slate-100 bg-slate-50/80",
                            ].join(
                              " ",
                            )}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <div className="flex min-w-[120px] items-center justify-between sm:w-32">
                                <span className="text-sm font-bold text-slate-800">
                                  {
                                    DAYS[
                                      index
                                    ]
                                  }
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEmployeeDay(
                                      index,
                                      "enabled",
                                      !day.enabled,
                                    )
                                  }
                                  className={[
                                    "relative h-6 w-11 rounded-full transition",
                                    day.enabled
                                      ? "bg-violet-600"
                                      : "bg-slate-300",
                                  ].join(
                                    " ",
                                  )}
                                  aria-label={`${DAYS[index]} çalışan müsaitlik durumu`}
                                >
                                  <span
                                    className={[
                                      "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                                      day.enabled
                                        ? "left-6"
                                        : "left-1",
                                    ].join(
                                      " ",
                                    )}
                                  />
                                </button>
                              </div>

                              {day.enabled ? (
                                <div className="grid flex-1 grid-cols-2 gap-3">
                                  <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                      Başlangıç
                                    </label>

                                    <input
                                      type="time"
                                      value={
                                        day.start_time
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateEmployeeDay(
                                          index,
                                          "start_time",
                                          event.target.value,
                                        )
                                      }
                                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                      Bitiş
                                    </label>

                                    <input
                                      type="time"
                                      value={
                                        day.end_time
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateEmployeeDay(
                                          index,
                                          "end_time",
                                          event.target.value,
                                        )
                                      }
                                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-slate-400">
                                    Müsait değil
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={
                        saveEmployeeSchedule
                      }
                      disabled={
                        savingEmployee
                      }
                      className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingEmployee
                        ? "Kaydediliyor..."
                        : "Çalışan Müsaitliğini Kaydet"}
                    </button>
                  </>
                )
              )}
            </section>
          </div>

          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4">
            <p className="text-sm font-bold text-indigo-900">
              Randevu uygunluğu nasıl
              hesaplanıyor?
            </p>

            <p className="mt-1 text-sm leading-6 text-indigo-700/80">
              Sistem randevu oluştururken
              işletmenin çalışma saatlerini,
              seçilen çalışanın müsaitliğini,
              hizmet süresini ve mevcut
              randevuları birlikte değerlendirir.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}