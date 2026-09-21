"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  createOwnerEmployee,
  deleteOwnerEmployee,
  getEmployeeServices,
  getMe,
  getOwnerEmployees,
  getOwnerServices,
  updateEmployeeServices,
  updateOwnerEmployee,
  type AuthUser,
  type EmployeeService,
  type OwnerEmployee,
  type OwnerService,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

type EmployeeFilter =
  | "all"
  | "active"
  | "inactive";

interface EmployeeForm {
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  email: string;
  service_ids: string[];
}

const emptyForm: EmployeeForm = {
  first_name: "",
  last_name: "",
  display_name: "",
  phone: "",
  email: "",
  service_ids: [],
};

function getFullName(
  employee: OwnerEmployee,
) {
  return (
    employee.display_name ||
    `${employee.first_name} ${employee.last_name}`
  ).trim();
}

function getInitials(
  employee: OwnerEmployee,
) {
  const first =
    employee.first_name
      ?.charAt(0)
      .toUpperCase() || "";

  const last =
    employee.last_name
      ?.charAt(0)
      .toUpperCase() || "";

  return `${first}${last}`;
}

function formatPrice(
  price: number | string,
  currency: string,
) {
  const numericPrice =
    typeof price === "number"
      ? price
      : Number(price);

  if (
    Number.isNaN(
      numericPrice,
    )
  ) {
    return `${price} ${currency}`;
  }

  return new Intl.NumberFormat(
    "tr-TR",
    {
      style: "currency",
      currency:
        currency || "TRY",
      maximumFractionDigits: 2,
    },
  ).format(
    numericPrice,
  );
}

export default function EmployeesPage() {
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
    services,
    setServices,
  ] = useState<
    OwnerService[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    filter,
    setFilter,
  ] = useState<EmployeeFilter>(
    "all",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingEmployee,
    setEditingEmployee,
  ] = useState<
    OwnerEmployee | null
  >(null);

  const [form, setForm] =
    useState<EmployeeForm>(
      emptyForm,
    );

  const [
    loadingAssignedServices,
    setLoadingAssignedServices,
  ] = useState(false);

  const [
    assignedServices,
    setAssignedServices,
  ] = useState<
    EmployeeService[]
  >([]);

  async function loadData() {
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
        employeeResult,
        serviceResult,
      ] = await Promise.all([
        getOwnerEmployees(
          token,
        ),
        getOwnerServices(
          token,
        ),
      ]);

      setEmployees(
        employeeResult,
      );

      setServices(
        serviceResult,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Çalışanlar yüklenemedi.",
      );

      clearAccessToken();

      router.replace(
        "/login",
      );
    }
  }

  useEffect(() => {
    loadData().finally(() => {
      setLoading(false);
    });
  }, []);

  function openCreateModal() {
    setEditingEmployee(
      null,
    );

    setForm({
      ...emptyForm,
      service_ids: [],
    });

    setAssignedServices(
      [],
    );

    setError(null);
    setModalOpen(true);
  }

  async function openEditModal(
    employee: OwnerEmployee,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );
      return;
    }

    setEditingEmployee(
      employee,
    );

    setForm({
      first_name:
        employee.first_name,
      last_name:
        employee.last_name,
      display_name:
        employee.display_name ||
        "",
      phone:
        employee.phone || "",
      email:
        employee.email || "",
      service_ids: [],
    });

    setAssignedServices(
      [],
    );

    setError(null);
    setModalOpen(true);
    setLoadingAssignedServices(
      true,
    );

    try {
      const result =
        await getEmployeeServices(
          token,
          employee.id,
        );

      setAssignedServices(
        result,
      );

      setForm(
        (current) => ({
          ...current,
          service_ids:
            result.map(
              (service) =>
                service.id,
            ),
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Çalışan hizmetleri yüklenemedi.",
      );
    } finally {
      setLoadingAssignedServices(
        false,
      );
    }
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingEmployee(
      null,
    );

    setAssignedServices(
      [],
    );

    setForm({
      ...emptyForm,
      service_ids: [],
    });
  }

  function updateField<
    K extends keyof EmployeeForm,
  >(
    field: K,
    value: EmployeeForm[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function toggleService(
    serviceId: string,
  ) {
    setForm(
      (current) => {
        const exists =
          current.service_ids.includes(
            serviceId,
          );

        return {
          ...current,
          service_ids: exists
            ? current.service_ids.filter(
                (id) =>
                  id !==
                  serviceId,
              )
            : [
                ...current.service_ids,
                serviceId,
              ],
        };
      },
    );
  }

  async function handleSubmit(
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
      !form.first_name.trim() ||
      !form.last_name.trim()
    ) {
      setError(
        "Ad ve soyad zorunludur.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let employee:
        | OwnerEmployee
        | null = null;

      if (editingEmployee) {
        employee =
          await updateOwnerEmployee(
            token,
            editingEmployee.id,
            {
              first_name:
                form.first_name.trim(),
              last_name:
                form.last_name.trim(),
              display_name:
                form.display_name.trim() ||
                null,
              phone:
                form.phone.trim() ||
                null,
              email:
                form.email.trim() ||
                null,
            },
          );
      } else {
        employee =
          await createOwnerEmployee(
            token,
            {
              first_name:
                form.first_name.trim(),
              last_name:
                form.last_name.trim(),
              display_name:
                form.display_name.trim() ||
                null,
              phone:
                form.phone.trim() ||
                null,
              email:
                form.email.trim() ||
                null,
            },
          );
      }

      await updateEmployeeServices(
        token,
        employee.id,
        form.service_ids,
      );

      setEmployees(
        (current) => {
          const existing =
            current.some(
              (item) =>
                item.id ===
                employee!.id,
            );

          if (existing) {
            return current.map(
              (item) =>
                item.id ===
                employee!.id
                  ? employee!
                  : item,
            );
          }

          return [
            employee!,
            ...current,
          ];
        },
      );

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Çalışan kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(
    employee: OwnerEmployee,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );
      return;
    }

    if (
      employee.is_active &&
      !window.confirm(
        `${getFullName(
          employee,
        )} isimli çalışanı pasifleştirmek istediğine emin misin?`,
      )
    ) {
      return;
    }

    setDeletingId(
      employee.id,
    );

    setError(null);

    try {
      const updated =
        employee.is_active
          ? await deleteOwnerEmployee(
              token,
              employee.id,
            )
          : await updateOwnerEmployee(
              token,
              employee.id,
              {
                is_active:
                  true,
              },
            );

      setEmployees(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item,
          ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Çalışan durumu güncellenemedi.",
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  const filteredEmployees =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR",
          );

      return employees.filter(
        (employee) => {
          const matchesFilter =
            filter ===
              "all" ||
            (filter ===
              "active" &&
              employee.is_active) ||
            (filter ===
              "inactive" &&
              !employee.is_active);

          if (
            !matchesFilter
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const searchable = [
            employee.first_name,
            employee.last_name,
            employee.display_name ||
              "",
            employee.phone ||
              "",
            employee.email ||
              "",
          ]
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR",
            );

          return searchable.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      employees,
      filter,
      search,
    ]);

  const counts =
    useMemo(
      () => ({
        all:
          employees.length,

        active:
          employees.filter(
            (employee) =>
              employee.is_active,
          ).length,

        inactive:
          employees.filter(
            (employee) =>
              !employee.is_active,
          ).length,
      }),
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

  function getEmployeeServiceCount(
    employee: OwnerEmployee,
  ) {
    if (
      editingEmployee?.id !==
      employee.id
    ) {
      return null;
    }

    return assignedServices.length;
  }

  function logout() {
    clearAccessToken();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-indigo-100 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-sm">
            Çalışanlar
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
          {/* TOP */}
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Ekip yönetimi
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Çalışanlar
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                İşletmenizde çalışan ekibinizi,
                iletişim bilgilerini ve
                verebilecekleri hizmetleri yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <span className="mr-2 text-lg leading-none">
                +
              </span>

              Çalışan Ekle
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* SUMMARY */}
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  label: "Tümü",
                  value: "all",
                  count:
                    counts.all,
                },
                {
                  label: "Aktif",
                  value: "active",
                  count:
                    counts.active,
                },
                {
                  label: "Pasif",
                  value: "inactive",
                  count:
                    counts.inactive,
                },
              ] satisfies Array<{
                label: string;
                value: EmployeeFilter;
                count: number;
              }>
            ).map(
              ({
                label,
                value,
                count,
              }) => {
                const active =
                  filter ===
                  value;

                return (
                  <button
                    key={
                      value
                    }
                    type="button"
                    onClick={() =>
                      setFilter(
                        value,
                      )
                    }
                    className={[
                      "rounded-[1.5rem] border p-5 text-left transition",
                      active
                        ? "border-indigo-300 bg-indigo-50 shadow-sm"
                        : "border-indigo-100 bg-white hover:border-indigo-200 hover:shadow-sm",
                    ].join(
                      " ",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={[
                          "text-xs font-bold uppercase tracking-[0.14em]",
                          active
                            ? "text-indigo-600"
                            : "text-slate-400",
                        ].join(
                          " ",
                        )}
                      >
                        {label}
                      </p>

                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          value ===
                          "active"
                            ? "bg-emerald-400"
                            : value ===
                                "inactive"
                              ? "bg-slate-300"
                              : "bg-indigo-400",
                        ].join(
                          " ",
                        )}
                      />
                    </div>

                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      {count}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {value ===
                      "active"
                        ? "aktif ekip üyesi"
                        : value ===
                            "inactive"
                          ? "pasif ekip üyesi"
                          : "kayıtlı çalışan"}
                    </p>
                  </button>
                );
              },
            )}
          </div>

          {/* SEARCH */}
          <div className="mb-7">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                🔎
              </span>

              <input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="İsim, telefon veya e-posta ara..."
                className="h-12 w-full rounded-2xl border border-indigo-100 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch(
                      "",
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 transition hover:text-slate-700"
                  aria-label="Aramayı temizle"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* EMPLOYEE LIST */}
          <section>
            {filteredEmployees.length ===
            0 ? (
              <div className="rounded-[2rem] border border-dashed border-indigo-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  👤
                </div>

                <h2 className="mt-5 text-xl font-black text-slate-950">
                  {search ||
                  filter !==
                    "all"
                    ? "Sonuç bulunamadı"
                    : "Henüz çalışan yok"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search ||
                  filter !==
                    "all"
                    ? "Arama veya filtre kriterlerinizi değiştirerek tekrar deneyin."
                    : "İşletmenize ilk çalışanınızı ekleyerek ekip yönetimine başlayabilirsiniz."}
                </p>

                {!search &&
                  filter ===
                    "all" && (
                    <button
                      type="button"
                      onClick={
                        openCreateModal
                      }
                      className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                    >
                      İlk Çalışanı Ekle
                    </button>
                  )}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredEmployees.map(
                  (
                    employee,
                  ) => {
                    const isLoading =
                      deletingId ===
                      employee.id;

                    const assignedCount =
                      getEmployeeServiceCount(
                        employee,
                      );

                    return (
                      <article
                        key={
                          employee.id
                        }
                        className={[
                          "group rounded-[1.75rem] border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-7",
                          employee.is_active
                            ? "border-indigo-100"
                            : "border-slate-200 opacity-80",
                        ].join(
                          " ",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white shadow-md shadow-indigo-100">
                              {getInitials(
                                employee,
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-lg font-black text-slate-950">
                                  {getFullName(
                                    employee,
                                  )}
                                </h2>

                                <span
                                  className={[
                                    "rounded-full border px-2.5 py-1 text-[10px] font-bold",
                                    employee.is_active
                                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-slate-100 text-slate-500",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {employee.is_active
                                    ? "Aktif"
                                    : "Pasif"}
                                </span>
                              </div>

                              <p className="mt-1 truncate text-sm font-medium text-slate-400">
                                {employee.display_name &&
                                employee.display_name !==
                                  `${employee.first_name} ${employee.last_name}`
                                  ? `${employee.first_name} ${employee.last_name}`
                                  : "Ekip üyesi"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-2">
                          {employee.phone && (
                            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                ☎
                              </span>

                              <span className="truncate">
                                {
                                  employee.phone
                                }
                              </span>
                            </div>
                          )}

                          {employee.email && (
                            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                ✉
                              </span>

                              <span className="truncate">
                                {
                                  employee.email
                                }
                              </span>
                            </div>
                          )}

                          {!employee.phone &&
                            !employee.email && (
                              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs font-semibold text-slate-400">
                                İletişim bilgisi eklenmemiş.
                              </div>
                            )}
                        </div>

                        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-400">
                                Hizmet kapsamı
                              </p>

                              <p className="mt-1 text-sm font-bold text-indigo-900">
                                {assignedCount !==
                                null
                                  ? `${assignedCount} hizmet atanmış`
                                  : "Hizmetleri düzenleme ekranından yönet"}
                              </p>
                            </div>

                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                              ✦
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                employee,
                              )
                            }
                            className="flex-1 rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
                          >
                            Düzenle
                          </button>

                          <button
                            type="button"
                            disabled={
                              isLoading
                            }
                            onClick={() =>
                              handleToggleActive(
                                employee,
                              )
                            }
                            className={[
                              "rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                              employee.is_active
                                ? "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                                : "border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                            ].join(
                              " ",
                            )}
                          >
                            {isLoading
                              ? "..."
                              : employee.is_active
                                ? "Pasifleştir"
                                : "Aktifleştir"}
                          </button>
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
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
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-indigo-100 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-indigo-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    {editingEmployee
                      ? "Çalışan düzenle"
                      : "Yeni çalışan"}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {editingEmployee
                      ? getFullName(
                          editingEmployee,
                        )
                      : "Çalışan Ekle"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Çalışanın iletişim bilgilerini ve
                    vereceği hizmetleri belirle.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-lg font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Kapat"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6 p-6 sm:p-7"
            >
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                    Temel bilgiler
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Çalışanın müşterilere görünecek bilgilerini
                    düzenle.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Ad
                    </label>

                    <input
                      required
                      value={
                        form.first_name
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "first_name",
                          event.target
                            .value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Soyad
                    </label>

                    <input
                      required
                      value={
                        form.last_name
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "last_name",
                          event.target
                            .value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Görünen ad
                  </label>

                  <input
                    value={
                      form.display_name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "display_name",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Örn. Ahmet Usta"
                    className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Doldurulursa müşteriler bu
                    ismi görecek.
                  </p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Telefon
                    </label>

                    <input
                      value={
                        form.phone
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "phone",
                          event.target
                            .value,
                        )
                      }
                      placeholder="05xx xxx xx xx"
                      className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      E-posta
                    </label>

                    <input
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "email",
                          event.target
                            .value,
                        )
                      }
                      placeholder="ornek@mail.com"
                      className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-500">
                      Hizmetler
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-950">
                      Verebileceği hizmetler
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Bu çalışan hangi hizmetlerde
                      randevu alabilir?
                    </p>
                  </div>

                  <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600">
                    {form.service_ids.length}{" "}
                    seçili
                  </span>
                </div>

                {loadingAssignedServices ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-400">
                    Hizmetler yükleniyor...
                  </div>
                ) : activeServices.length ===
                  0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Aktif hizmet bulunmuyor.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Önce Hizmetler sayfasından bir hizmet
                      ekleyin.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        router.push(
                          "/dashboard/services",
                        );
                      }}
                      className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Hizmetler sayfasına git →
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {activeServices.map(
                      (
                        service,
                      ) => {
                        const selected =
                          form.service_ids.includes(
                            service.id,
                          );

                        return (
                          <button
                            key={
                              service.id
                            }
                            type="button"
                            onClick={() =>
                              toggleService(
                                service.id,
                              )
                            }
                            className={[
                              "rounded-2xl border p-4 text-left transition",
                              selected
                                ? "border-indigo-200 bg-indigo-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-indigo-100 hover:bg-slate-50",
                            ].join(
                              " ",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p
                                  className={[
                                    "text-sm font-bold",
                                    selected
                                      ? "text-indigo-700"
                                      : "text-slate-800",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {
                                    service.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {
                                    service.duration_minutes
                                  }{" "}
                                  dk ·{" "}
                                  {formatPrice(
                                    service.price,
                                    service.currency,
                                  )}
                                </p>
                              </div>

                              <span
                                className={[
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition",
                                  selected
                                    ? "border-indigo-500 bg-indigo-500 text-white"
                                    : "border-slate-300 bg-white text-transparent",
                                ].join(
                                  " ",
                                )}
                              >
                                ✓
                              </span>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-indigo-100 pt-5 sm:flex-row sm:justify-end">
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
                    saving
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Kaydediliyor..."
                    : editingEmployee
                      ? "Değişiklikleri Kaydet"
                      : "Çalışanı Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}