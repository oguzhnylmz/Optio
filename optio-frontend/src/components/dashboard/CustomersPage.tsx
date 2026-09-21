"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  createOwnerCustomer,
  getMe,
  getOwnerCustomerAppointments,
  getOwnerCustomers,
  updateOwnerCustomer,
  type AuthUser,
  type OwnerCustomer,
  type OwnerCustomerAppointment,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

interface CustomerForm {
  full_name: string;
  phone: string;
  email: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  full_name: "",
  phone: "",
  email: "",
  notes: "",
};

function formatDateTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status: string) {
  switch (status) {
    case "pending":
      return "Bekliyor";

    case "confirmed":
      return "Onaylandı";

    case "completed":
      return "Tamamlandı";

    case "cancelled":
      return "İptal";

    case "no_show":
      return "Gelmedi";

    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "confirmed":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "completed":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "cancelled":
    case "no_show":
      return "border-red-100 bg-red-50 text-red-600";

    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CustomersPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [customers, setCustomers] =
    useState<OwnerCustomer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<OwnerCustomer | null>(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<OwnerCustomer | null>(null);

  const [form, setForm] =
    useState<CustomerForm>(
      emptyForm,
    );

  const [appointments, setAppointments] =
    useState<OwnerCustomerAppointment[]>([]);

  const [
    appointmentsLoading,
    setAppointmentsLoading,
  ] = useState(false);

  const [
    appointmentsError,
    setAppointmentsError,
  ] = useState<string | null>(null);

  async function loadData() {
    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const currentUser =
        await getMe(token);

      if (
        currentUser.role !==
        "owner"
      ) {
        router.replace("/account");
        return;
      }

      setUser(currentUser);

      const result =
        await getOwnerCustomers(
          token,
        );

      setCustomers(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Müşteriler yüklenemedi.",
      );
    }
  }

  useEffect(() => {
    loadData().finally(() => {
      setLoading(false);
    });
  }, []);

  function openCreateModal() {
    setEditingCustomer(null);

    setForm({
      ...emptyForm,
    });

    setError(null);
    setModalOpen(true);
  }

  function openEditModal(
    customer: OwnerCustomer,
  ) {
    setEditingCustomer(customer);

    setForm({
      full_name:
        customer.full_name,
      phone:
        customer.phone,
      email:
        customer.email || "",
      notes:
        customer.notes || "",
    });

    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCustomer(null);

    setForm({
      ...emptyForm,
    });
  }

  function openDetails(
    customer: OwnerCustomer,
  ) {
    setSelectedCustomer(customer);

    setAppointments([]);
    setAppointmentsError(null);

    loadAppointments(customer);
  }

  async function loadAppointments(
    customer: OwnerCustomer,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setAppointmentsLoading(true);
    setAppointmentsError(null);

    try {
      const result =
        await getOwnerCustomerAppointments(
          token,
          customer.id,
        );

      setAppointments(result);
    } catch (err) {
      setAppointmentsError(
        err instanceof Error
          ? err.message
          : "Randevu geçmişi yüklenemedi.",
      );
    } finally {
      setAppointmentsLoading(false);
    }
  }

  function closeDetails() {
    setSelectedCustomer(null);
    setAppointments([]);
    setAppointmentsError(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (
      !form.full_name.trim() ||
      !form.phone.trim()
    ) {
      setError(
        "Ad soyad ve telefon zorunludur.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let customer:
        | OwnerCustomer
        | null = null;

      if (editingCustomer) {
        customer =
          await updateOwnerCustomer(
            token,
            editingCustomer.id,
            {
              full_name:
                form.full_name.trim(),
              phone:
                form.phone.trim(),
              email:
                form.email.trim() ||
                null,
              notes:
                form.notes.trim() ||
                null,
            },
          );
      } else {
        customer =
          await createOwnerCustomer(
            token,
            {
              full_name:
                form.full_name.trim(),
              phone:
                form.phone.trim(),
              email:
                form.email.trim() ||
                null,
              notes:
                form.notes.trim() ||
                null,
            },
          );
      }

      setCustomers(
        (current) => {
          const exists =
            current.some(
              (item) =>
                item.id ===
                customer!.id,
            );

          if (exists) {
            return current.map(
              (item) =>
                item.id ===
                customer!.id
                  ? customer!
                  : item,
            );
          }

          return [
            customer!,
            ...current,
          ];
        },
      );

      if (
        selectedCustomer?.id ===
        customer.id
      ) {
        setSelectedCustomer(
          customer,
        );
      }

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Müşteri kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateField<
    K extends keyof CustomerForm,
  >(
    field: K,
    value: CustomerForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const filteredCustomers =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR",
          );

      if (!normalizedSearch) {
        return customers;
      }

      return customers.filter(
        (customer) => {
          const searchable = [
            customer.full_name,
            customer.phone,
            customer.email || "",
            customer.notes || "",
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
      customers,
      search,
    ]);

  const registeredCustomerCount =
    useMemo(
      () =>
        customers.filter(
          (customer) =>
            Boolean(
              customer.user_id,
            ),
        ).length,
      [customers],
    );

  const guestCustomerCount =
    customers.length -
    registeredCustomerCount;

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
            Müşteriler yükleniyor...
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
              onClick={logout}
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
          {/* PAGE INTRO */}
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Müşteri yönetimi
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Müşteriler
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Müşterilerinizi, iletişim bilgilerini
                ve randevu geçmişlerini tek yerden yönetin.
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

              Müşteri Ekle
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* STATS */}
          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-indigo-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Toplam müşteri
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  👥
                </span>
              </div>

              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {customers.length}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Tüm kayıtlı müşteriler
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Kayıtlı müşteriler
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  ✓
                </span>
              </div>

              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {registeredCustomerCount}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Hesabı bulunan müşteriler
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-violet-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Misafir müşteriler
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  ✦
                </span>
              </div>

              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {guestCustomerCount}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Hesapsız müşteriler
              </p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="mb-7">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="İsim, telefon, e-posta veya not ile müşteri ara..."
                className="h-12 w-full rounded-2xl border border-indigo-100 bg-white pl-11 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 transition hover:text-slate-700"
                  aria-label="Aramayı temizle"
                >
                  ×
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between px-1">
              <p className="text-xs font-medium text-slate-400">
                {search
                  ? `"${search}" için `
                  : ""}
                {filteredCustomers.length} müşteri
                gösteriliyor
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Filtreyi temizle
                </button>
              )}
            </div>
          </div>

          {/* CUSTOMER LIST */}
          {filteredCustomers.length ===
          0 ? (
            <div className="rounded-[2rem] border border-dashed border-indigo-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                👤
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-950">
                {search
                  ? "Müşteri bulunamadı"
                  : "Henüz müşteri yok"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? "Arama kriterlerinizi değiştirerek tekrar deneyin."
                  : "İlk müşterinizi ekleyerek müşteri yönetimine başlayabilirsiniz."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  İlk Müşteriyi Ekle
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredCustomers.map(
                (customer) => (
                  <article
                    key={
                      customer.id
                    }
                    className="group rounded-[1.75rem] border border-indigo-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white shadow-md shadow-indigo-100">
                          {getInitials(
                            customer.full_name,
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-lg font-black text-slate-950">
                              {customer.full_name}
                            </h2>

                            <span
                              className={[
                                "rounded-full border px-2.5 py-1 text-[10px] font-bold",
                                customer.user_id
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-100 text-slate-500",
                              ].join(
                                " ",
                              )}
                            >
                              {customer.user_id
                                ? "Kayıtlı"
                                : "Misafir"}
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-medium text-slate-400">
                            Müşteri
                          </p>
                        </div>
                      </div>

                      <span className="hidden shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 sm:inline-flex">
                        Müşteri
                      </span>
                    </div>

                    <div className="mt-6 grid gap-2">
                      <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                          ☎
                        </span>

                        <span className="truncate">
                          {
                            customer.phone
                          }
                        </span>
                      </div>

                      {customer.email && (
                        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                            ✉
                          </span>

                          <span className="truncate">
                            {
                              customer.email
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {customer.notes && (
                      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-400">
                          Müşteri notu
                        </p>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-indigo-900">
                          {customer.notes}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openDetails(
                            customer,
                          )
                        }
                        className="flex-1 rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
                      >
                        Detaylar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            customer,
                          )
                        }
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700"
                      >
                        Düzenle
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
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
                    {editingCustomer
                      ? "Müşteri düzenle"
                      : "Yeni müşteri"}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {editingCustomer
                      ? editingCustomer.full_name
                      : "Müşteri Ekle"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Müşterinin iletişim ve not bilgilerini
                    düzenle.
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
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
                    Müşteri bilgileri
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Müşterinin temel iletişim bilgilerini girin.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Ad Soyad
                  </label>

                  <input
                    required
                    value={
                      form.full_name
                    }
                    onChange={(event) =>
                      updateField(
                        "full_name",
                        event.target.value,
                      )
                    }
                    placeholder="Örn. Ahmet Yılmaz"
                    className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Telefon
                    </label>

                    <input
                      required
                      value={
                        form.phone
                      }
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value,
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
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value,
                        )
                      }
                      placeholder="ornek@mail.com"
                      className="h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Notlar
                  </label>

                  <textarea
                    rows={4}
                    value={
                      form.notes
                    }
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value,
                      )
                    }
                    placeholder="Müşteri hakkında not..."
                    className="w-full resize-none rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
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
                    : editingCustomer
                      ? "Değişiklikleri Kaydet"
                      : "Müşteriyi Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS MODAL */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              closeDetails();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-indigo-100 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-indigo-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white shadow-md shadow-indigo-100">
                    {getInitials(
                      selectedCustomer.full_name,
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                      Müşteri detayları
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black text-slate-950">
                      {
                        selectedCustomer.full_name
                      }
                    </h2>

                    <span
                      className={[
                        "mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold",
                        selectedCustomer.user_id
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-500",
                      ].join(
                        " ",
                      )}
                    >
                      {selectedCustomer.user_id
                        ? "Kayıtlı müşteri"
                        : "Misafir müşteri"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
                  aria-label="Kapat"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-7 p-6 sm:p-7">
              {/* CONTACT INFO */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Telefon
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                      ☎
                    </span>

                    <p className="text-sm font-bold text-slate-800">
                      {
                        selectedCustomer.phone
                      }
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    E-posta
                  </p>

                  <div className="mt-3 flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                      ✉
                    </span>

                    <p className="break-all text-sm font-bold text-slate-800">
                      {selectedCustomer.email ||
                        "Belirtilmemiş"}
                    </p>
                  </div>
                </div>
              </div>

              {/* APPOINTMENT HISTORY */}
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                      Geçmiş
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-950">
                      Randevu Geçmişi
                    </h3>
                  </div>

                  <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
                    {appointments.length}{" "}
                    randevu
                  </span>
                </div>

                {appointmentsError && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {
                      appointmentsError
                    }
                  </div>
                )}

                {appointmentsLoading ? (
                  <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />

                    <p className="mt-4 text-sm font-medium text-slate-500">
                      Randevu geçmişi yükleniyor...
                    </p>
                  </div>
                ) : appointments.length ===
                  0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                      📅
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Bu müşterinin henüz randevusu bulunmuyor.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {appointments.map(
                      (appointment) => (
                        <div
                          key={
                            appointment.id
                          }
                          className="rounded-2xl border border-indigo-100 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
                        >
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-black text-slate-950">
                                  {appointment.service_name ||
                                    "Hizmet"}
                                </p>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                                    appointment.status,
                                  )}`}
                                >
                                  {formatStatus(
                                    appointment.status,
                                  )}
                                </span>
                              </div>

                              <p className="mt-2 text-xs font-medium text-slate-500">
                                {formatDateTime(
                                  appointment.start_at,
                                )}
                              </p>

                              {appointment.employee_name && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Çalışan:{" "}
                                  {
                                    appointment.employee_name
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              {/* NOTES */}
              {selectedCustomer.notes && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-500">
                    Müşteri notu
                  </p>

                  <p className="mt-2 text-sm leading-6 text-indigo-950">
                    {
                      selectedCustomer.notes
                    }
                  </p>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-indigo-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Kapat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const customer =
                      selectedCustomer;

                    closeDetails();
                    openEditModal(
                      customer,
                    );
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  Müşteriyi Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}