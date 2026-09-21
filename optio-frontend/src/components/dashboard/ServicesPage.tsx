"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  createOwnerService,
  deleteOwnerService,
  getMe,
  getOwnerServices,
  updateOwnerService,
  type AuthUser,
  type OwnerService,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

type ServiceFilter =
  | "all"
  | "active"
  | "inactive";

type ServiceForm = {
  name: string;
  description: string;
  duration_minutes: string;
  price: string;
  currency: string;
};

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  duration_minutes: "30",
  price: "",
  currency: "TRY",
};

function formatPrice(
  price: number | string,
  currency: string,
) {
  const numericPrice =
    Number(price);

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
  ).format(numericPrice);
}

function formatDuration(
  minutes: number,
) {
  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  const remaining =
    minutes % 60;

  if (
    remaining === 0
  ) {
    return `${hours} sa`;
  }

  return `${hours} sa ${remaining} dk`;
}

export default function ServicesPage() {
  const router =
    useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

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
    actionId,
    setActionId,
  ] = useState<
    string | null
  >(null);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<ServiceFilter>(
    "all",
  );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingService,
    setEditingService,
  ] = useState<
    OwnerService | null
  >(null);

  const [
    form,
    setForm,
  ] = useState<ServiceForm>(
    EMPTY_FORM,
  );

  async function loadServices() {
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

      const result =
        await getOwnerServices(
          token,
        );

      setServices(
        result,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Hizmetler yüklenemedi.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const filteredServices =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR",
          );

      return services.filter(
        (service) => {
          const matchesFilter =
            filter === "all" ||
            (filter ===
              "active" &&
              service.is_active) ||
            (filter ===
              "inactive" &&
              !service.is_active);

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

          const name =
            service.name.toLocaleLowerCase(
              "tr-TR",
            );

          const description =
            (
              service.description ??
              ""
            ).toLocaleLowerCase(
              "tr-TR",
            );

          return (
            name.includes(
              normalizedSearch,
            ) ||
            description.includes(
              normalizedSearch,
            )
          );
        },
      );
    }, [
      services,
      search,
      filter,
    ]);

  const counts =
    useMemo(
      () => ({
        all:
          services.length,

        active:
          services.filter(
            (service) =>
              service.is_active,
          ).length,

        inactive:
          services.filter(
            (service) =>
              !service.is_active,
          ).length,
      }),
      [services],
    );

  function openCreateModal() {
    setEditingService(
      null,
    );

    setForm(
      EMPTY_FORM,
    );

    setError(null);
    setModalOpen(true);
  }

  function openEditModal(
    service: OwnerService,
  ) {
    setEditingService(
      service,
    );

    setForm({
      name: service.name,
      description:
        service.description ??
        "",
      duration_minutes:
        String(
          service.duration_minutes,
        ),
      price:
        String(
          service.price,
        ),
      currency:
        service.currency ||
        "TRY",
    });

    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingService(
      null,
    );

    setForm(
      EMPTY_FORM,
    );
  }

  function updateForm(
    field: keyof ServiceForm,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
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

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    const duration =
      Number(
        form.duration_minutes,
      );

    const price =
      Number(
        form.price.replace(
          ",",
          ".",
        ),
      );

    const currency =
      form.currency
        .trim()
        .toUpperCase();

    if (name.length < 2) {
      setError(
        "Hizmet adı en az 2 karakter olmalı.",
      );
      return;
    }

    if (
      !Number.isFinite(
        duration,
      ) ||
      duration <= 0
    ) {
      setError(
        "Geçerli bir hizmet süresi gir.",
      );
      return;
    }

    if (
      !Number.isFinite(
        price,
      ) ||
      price < 0
    ) {
      setError(
        "Geçerli bir fiyat gir.",
      );
      return;
    }

    if (
      currency.length !== 3
    ) {
      setError(
        "Para birimi 3 karakter olmalı.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingService) {
        const updated =
          await updateOwnerService(
            token,
            editingService.id,
            {
              name,
              description:
                description ||
                null,
              duration_minutes:
                duration,
              price,
              currency,
            },
          );

        setServices(
          (current) =>
            current.map(
              (service) =>
                service.id ===
                updated.id
                  ? updated
                  : service,
            ),
        );
      } else {
        const created =
          await createOwnerService(
            token,
            {
              name,
              description:
                description ||
                null,
              duration_minutes:
                duration,
              price,
              currency,
            },
          );

        setServices(
          (current) => [
            created,
            ...current,
          ],
        );
      }

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Hizmet kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(
    service: OwnerService,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );
      return;
    }

    setActionId(
      service.id,
    );

    setError(null);

    try {
      if (service.is_active) {
        const updated =
          await deleteOwnerService(
            token,
            service.id,
          );

        setServices(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item,
            ),
        );
      } else {
        const updated =
          await updateOwnerService(
            token,
            service.id,
            {
              is_active: true,
            },
          );

        setServices(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item,
            ),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Hizmet durumu güncellenemedi.",
      );
    } finally {
      setActionId(
        null,
      );
    }
  }

  async function handleDelete(
    service: OwnerService,
  ) {
    const confirmed =
      window.confirm(
        `"${service.name}" hizmetini pasifleştirmek istediğine emin misin?`,
      );

    if (!confirmed) {
      return;
    }

    await handleToggleActive(
      service,
    );
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
            Hizmetler
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
                Hizmetler
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Hizmetlerini yönet
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                İşletmenin sunduğu hizmetleri,
                sürelerini ve fiyatlarını
                buradan yönet.
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

              Yeni Hizmet
            </button>
          </div>

          {error &&
            !modalOpen && (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

          {/* FILTER / SEARCH */}
          <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Hizmet ara..."
                className="h-12 w-full rounded-2xl border border-indigo-100 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="flex rounded-2xl border border-indigo-100 bg-white p-1">
              {(
                [
                  {
                    key: "all",
                    label: `Tümü ${counts.all}`,
                  },
                  {
                    key: "active",
                    label: `Aktif ${counts.active}`,
                  },
                  {
                    key: "inactive",
                    label: `Pasif ${counts.inactive}`,
                  },
                ] as const
              ).map(
                (item) => {
                  const active =
                    filter ===
                    item.key;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() =>
                        setFilter(
                          item.key,
                        )
                      }
                      className={[
                        "rounded-xl px-4 py-2.5 text-xs font-bold transition",
                        active
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600",
                      ].join(
                        " ",
                      )}
                    >
                      {
                        item.label
                      }
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* SERVICE LIST */}
          <section className="mt-8">
            {filteredServices.length ===
            0 ? (
              <div className="rounded-[2rem] border border-indigo-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  ✦
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-950">
                  {services.length ===
                  0
                    ? "Henüz hizmet eklenmedi."
                    : "Bu filtrede hizmet bulunamadı."}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {services.length ===
                  0
                    ? "İşletmenin sunduğu ilk hizmeti ekleyerek başlayabilirsin."
                    : "Arama veya filtre seçimini değiştirerek tekrar deneyebilirsin."}
                </p>

                {services.length ===
                  0 && (
                  <button
                    type="button"
                    onClick={
                      openCreateModal
                    }
                    className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    İlk Hizmeti Ekle
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredServices.map(
                  (
                    service,
                  ) => {
                    const isActionLoading =
                      actionId ===
                      service.id;

                    return (
                      <article
                        key={
                          service.id
                        }
                        className={[
                          "rounded-[1.5rem] border bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6",
                          service.is_active
                            ? "border-indigo-100"
                            : "border-slate-200 opacity-90",
                        ].join(
                          " ",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-lg font-bold text-slate-950">
                                {
                                  service.name
                                }
                              </h2>

                              <span
                                className={[
                                  "rounded-full border px-2.5 py-1 text-[10px] font-bold",
                                  service.is_active
                                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-100 text-slate-500",
                                ].join(
                                  " ",
                                )}
                              >
                                {service.is_active
                                  ? "Aktif"
                                  : "Pasif"}
                              </span>
                            </div>

                            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                              {service.description ||
                                "Bu hizmet için açıklama eklenmemiş."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-xs font-semibold text-slate-400">
                              Süre
                            </div>

                            <div className="mt-1 text-base font-bold text-slate-900">
                              {formatDuration(
                                service.duration_minutes,
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-indigo-50 p-4">
                            <div className="text-xs font-semibold text-indigo-400">
                              Fiyat
                            </div>

                            <div className="mt-1 text-base font-bold text-indigo-700">
                              {formatPrice(
                                service.price,
                                service.currency,
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                service,
                              )
                            }
                            className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
                          >
                            Düzenle
                          </button>

                          <button
                            type="button"
                            disabled={
                              isActionLoading
                            }
                            onClick={() =>
                              service.is_active
                                ? handleDelete(
                                    service,
                                  )
                                : handleToggleActive(
                                    service,
                                  )
                            }
                            className={[
                              "rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50",
                              service.is_active
                                ? "border border-red-100 bg-white text-red-600 hover:bg-red-50"
                                : "border border-emerald-100 bg-white text-emerald-600 hover:bg-emerald-50",
                            ].join(
                              " ",
                            )}
                          >
                            {isActionLoading
                              ? "Güncelleniyor..."
                              : service.is_active
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
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-indigo-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-indigo-100 px-6 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                  {editingService
                    ? "Hizmet düzenle"
                    : "Yeni hizmet"}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {editingService
                    ? "Hizmeti güncelle"
                    : "Yeni hizmet ekle"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Hizmetin bilgilerini aşağıdan
                  düzenleyebilirsin.
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
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="space-y-5 px-6 py-6 sm:px-7">
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="service-name"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Hizmet adı
                  </label>

                  <input
                    id="service-name"
                    type="text"
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "name",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Örn. Saç Kesimi"
                    maxLength={
                      150
                    }
                    required
                    className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="service-description"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Açıklama
                  </label>

                  <textarea
                    id="service-description"
                    value={
                      form.description
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "description",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Hizmet hakkında kısa bir açıklama..."
                    maxLength={
                      2000
                    }
                    rows={
                      4
                    }
                    className="w-full resize-none rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="service-duration"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Süre (dakika)
                    </label>

                    <input
                      id="service-duration"
                      type="number"
                      min={
                        1
                      }
                      max={
                        1440
                      }
                      value={
                        form.duration_minutes
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          "duration_minutes",
                          event.target
                            .value,
                        )
                      }
                      required
                      className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="service-price"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Fiyat
                    </label>

                    <input
                      id="service-price"
                      type="text"
                      inputMode="decimal"
                      value={
                        form.price
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          "price",
                          event.target
                            .value,
                        )
                      }
                      placeholder="500"
                      required
                      className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="service-currency"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Para birimi
                  </label>

                  <input
                    id="service-currency"
                    type="text"
                    value={
                      form.currency
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "currency",
                        event.target.value.toUpperCase(),
                      )
                    }
                    maxLength={
                      3
                    }
                    placeholder="TRY"
                    required
                    className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm uppercase outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Örn. TRY,
                    EUR, USD
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-indigo-100 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving
                    ? "Kaydediliyor..."
                    : editingService
                      ? "Değişiklikleri Kaydet"
                      : "Hizmeti Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}