"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  Globe2,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
} from "lucide-react";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  timezone: string;
  logo_url: string | null;
  is_active: boolean;
}

interface BusinessForm {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  logo_url: string;
}

async function fetchBusiness(
  token: string,
): Promise<Business> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/businesses/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
    },
  );

  if (!response.ok) {
    let message =
      "İşletme bilgileri alınamadı.";

    try {
      const errorData =
        await response.json();

      if (
        typeof errorData?.detail ===
        "string"
      ) {
        message =
          errorData.detail;
      }
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message);
  }

  return response.json() as Promise<Business>;
}

async function updateBusiness(
  token: string,
  payload: BusinessForm,
): Promise<Business> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/businesses/me`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        name:
          payload.name.trim(),
        description:
          payload.description.trim() ||
          null,
        phone:
          payload.phone.trim() ||
          null,
        email:
          payload.email.trim() ||
          null,
        address:
          payload.address.trim() ||
          null,
        city:
          payload.city.trim() ||
          null,
        country:
          payload.country.trim(),
        timezone:
          payload.timezone.trim(),
        logo_url:
          payload.logo_url.trim() ||
          null,
      }),
    },
  );

  if (!response.ok) {
    let message =
      "İşletme bilgileri güncellenemedi.";

    try {
      const errorData =
        await response.json();

      if (
        typeof errorData?.detail ===
        "string"
      ) {
        message =
          errorData.detail;
      }
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message);
  }

  return response.json() as Promise<Business>;
}

function createInitialForm(
  business: Business,
): BusinessForm {
  return {
    name: business.name ?? "",
    description:
      business.description ?? "",
    phone: business.phone ?? "",
    email: business.email ?? "",
    address:
      business.address ?? "",
    city: business.city ?? "",
    country:
      business.country ?? "Turkey",
    timezone:
      business.timezone ??
      "Europe/Istanbul",
    logo_url:
      business.logo_url ?? "",
  };
}

function getInitials(
  name: string,
) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "OP";
}

export default function BusinessSettingsPage() {
  const router =
    useRouter();

  const [business, setBusiness] =
    useState<Business | null>(
      null,
    );

  const [form, setForm] =
    useState<BusinessForm>({
      name: "",
      description: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      country: "Turkey",
      timezone:
        "Europe/Istanbul",
      logo_url: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [showSuccessModal, setShowSuccessModal] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBusiness() {
      const token =
        getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data =
          await fetchBusiness(
            token,
          );

        if (
          cancelled
        ) {
          return;
        }

        setBusiness(data);
        setForm(
          createInitialForm(data),
        );
      } catch (
        caughtError
      ) {
        if (
          cancelled
        ) {
          return;
        }

        const message =
          caughtError instanceof
          Error
            ? caughtError.message
            : "İşletme bilgileri yüklenemedi.";

        if (
          message
            .toLowerCase()
            .includes("unauthorized") ||
          message
            .toLowerCase()
            .includes("not authenticated") ||
          message
            .toLowerCase()
            .includes("credentials")
        ) {
          clearAccessToken();
          router.replace("/login");
          return;
        }

        setError(message);
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false);
        }
      }
    }

    loadBusiness();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateField<
    K extends keyof BusinessForm,
  >(
    field: K,
    value: BusinessForm[K],
  ) {
    setForm(
      (
        current,
      ) => ({
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
      clearAccessToken();
      router.replace("/login");
      return;
    }

    if (
      !form.name.trim()
    ) {
      setError(
        "İşletme adı boş bırakılamaz.",
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updated =
        await updateBusiness(
          token,
          form,
        );

      setBusiness(updated);
      setForm(
        createInitialForm(
          updated,
        ),
      );

      setShowSuccessModal(true);
    } catch (
      caughtError
    ) {
      const message =
        caughtError instanceof
        Error
          ? caughtError.message
          : "İşletme bilgileri güncellenemedi.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-2xl border border-indigo-100 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-sm">
            İşletme bilgileri
            yükleniyor...
          </div>
        </div>
      </main>
    );
  }

  if (
    !business
  ) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Building2 className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-900">
              İşletme bilgileri
              alınamadı
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ??
                "İşletmenize ait bilgiler bulunamadı."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard",
                )
              }
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Dashboard'a dön
            </button>
          </div>
        </div>
      </main>
    );
  }

  const initials =
    getInitials(
      form.name ||
        business.name,
    );

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard",
                )
              }
              className="text-xl font-black tracking-tight text-slate-900"
            >
              Optio
            </button>

            <p className="mt-0.5 text-xs font-medium text-slate-400">
              İşletme yönetim
              paneli
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard",
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <DashboardSidebar />

        <section className="min-w-0 flex-1">
          <div className="mb-8">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
              İşletme ayarları
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              İşletmem
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              İşletmenizin müşterilere
              gösterilecek temel
              bilgilerini yönetin.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6"
            >
              <section className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Temel bilgiler
                      </h2>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Müşterilerinizin
                        göreceği
                        işletme bilgileri.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="business-name"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      İşletme adı
                    </label>

                    <input
                      id="business-name"
                      type="text"
                      value={
                        form.name
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "name",
                          event.target
                            .value,
                        )
                      }
                      maxLength={150}
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      placeholder="Örn. Luna Beauty"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="business-description"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Hakkımızda
                    </label>

                    <textarea
                      id="business-description"
                      value={
                        form.description
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "description",
                          event.target
                            .value,
                        )
                      }
                      maxLength={2000}
                      rows={5}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      placeholder="İşletmenizi müşterilerinize kısaca anlatın."
                    />

                    <div className="mt-2 text-right text-xs font-medium text-slate-400">
                      {
                        form.description
                          .length
                      }
                      / 2000
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="business-phone"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Telefon
                    </label>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        id="business-phone"
                        type="tel"
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
                        maxLength={30}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        placeholder="0555 555 55 55"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="business-email"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      E-posta
                    </label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        id="business-email"
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
                        maxLength={255}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        placeholder="info@isletmeniz.com"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Konum ve bölge
                      </h2>

                      <p className="mt-0.5 text-sm text-slate-500">
                        İşletmenizin konum
                        bilgilerini
                        güncelleyin.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="business-address"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Adres
                    </label>

                    <input
                      id="business-address"
                      type="text"
                      value={
                        form.address
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "address",
                          event.target
                            .value,
                        )
                      }
                      maxLength={255}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      placeholder="Mahalle, cadde, sokak ve bina bilgisi"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="business-city"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Şehir
                    </label>

                    <input
                      id="business-city"
                      type="text"
                      value={
                        form.city
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "city",
                          event.target
                            .value,
                        )
                      }
                      maxLength={100}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      placeholder="Muğla"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="business-country"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Ülke
                    </label>

                    <input
                      id="business-country"
                      type="text"
                      value={
                        form.country
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "country",
                          event.target
                            .value,
                        )
                      }
                      maxLength={100}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      placeholder="Turkey"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="business-timezone"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Saat dilimi
                    </label>

                    <div className="relative">
                      <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        id="business-timezone"
                        type="text"
                        value={
                          form.timezone
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "timezone",
                            event.target
                              .value,
                          )
                        }
                        maxLength={100}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        placeholder="Europe/Istanbul"
                      />
                    </div>

                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Örn. Europe/Istanbul
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <ImageIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Logo
                      </h2>

                      <p className="mt-0.5 text-sm text-slate-500">
                        İşletmenizin profilinde
                        kullanılacak görsel.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="business-logo"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Logo URL
                  </label>

                  <input
                    id="business-logo"
                    type="url"
                    value={
                      form.logo_url
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "logo_url",
                        event.target
                          .value,
                      )
                    }
                    maxLength={500}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    placeholder="https://..."
                  />

                  <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
                    Şimdilik doğrudan bir
                    görsel URL'si
                    kullanıyoruz. Dosya
                    yükleme sistemi daha
                    sonra eklenebilir.
                  </p>
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForm(
                      createInitialForm(
                        business,
                      ),
                    );
                    setError(null);
                  }}
                  disabled={
                    saving
                  }
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Değişiklikleri
                  sıfırla
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />

                  {saving
                    ? "Kaydediliyor..."
                    : "Değişiklikleri kaydet"}
                </button>
              </div>
            </form>

            <aside className="xl:sticky xl:top-8 xl:self-start">
              <div className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
                    Önizleme
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-900">
                    İşletme kartı
                  </h2>
                </div>

                <div className="p-6">
                  <div className="overflow-hidden rounded-[1.5rem] border border-indigo-100 bg-[#f7f8ff]">
                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-[#ddd9ff] via-[#eeedff] to-[#dce9ff]">
                      {form.logo_url ? (
                        <img
                          src={
                            form.logo_url
                          }
                          alt={
                            form.name ||
                            "İşletme logosu"
                          }
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-white/80 blur-3xl" />

                          <div className="absolute -bottom-16 -right-8 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl" />

                          <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/85 text-3xl font-black text-indigo-600 shadow-[0_20px_45px_rgba(79,70,229,0.16)]">
                            {initials}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-600">
                        Online randevu
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                        {form.name ||
                          "İşletme adı"}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {form.description ||
                          "İşletmenizin açıklaması burada görünecek."}
                      </p>

                      <div className="mt-5 space-y-2">
                        {form.city && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <MapPin className="h-4 w-4 text-indigo-500" />

                            <span>
                              {
                                form.city
                              }

                              {form.country
                                ? `, ${form.country}`
                                : ""}
                            </span>
                          </div>
                        )}

                        {form.phone && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <Phone className="h-4 w-4 text-indigo-500" />

                            <span>
                              {
                                form.phone
                              }
                            </span>
                          </div>
                        )}

                        {form.email && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <Mail className="h-4 w-4 text-indigo-500" />

                            <span className="truncate">
                              {
                                form.email
                              }
                            </span>
                          </div>
                        )}

                        {form.address && (
                          <div className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />

                            <span>
                              {
                                form.address
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <Check className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-emerald-800">
                          İşletme aktif
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-emerald-700/70">
                          İşletmeniz şu anda
                          aktif durumda.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Public adres
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                      /business/
                      {
                        business.slug
                      }
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowSuccessModal(
                false,
              );
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-update-success-title"
            className="w-full max-w-md rounded-[2rem] border border-indigo-100 bg-white p-7 shadow-2xl shadow-slate-900/15"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Check className="h-7 w-7" />
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSuccessModal(
                    false,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2
              id="business-update-success-title"
              className="mt-6 text-2xl font-black tracking-tight text-slate-950"
            >
              Değişiklikler
              kaydedildi
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              İşletmenizin bilgileri
              başarıyla güncellendi.
              Yeni bilgileriniz artık
              sistemde kullanılacak.
            </p>

            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <Building2 className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-500">
                    İşletme
                  </p>

                  <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
                    {
                      business.name
                    }
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowSuccessModal(
                  false,
                )
              }
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </main>
  );
}