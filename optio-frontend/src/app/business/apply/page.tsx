"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { createBusinessApplication } from "@/lib/api";

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;

  business_name: string;
  business_type: string;
  business_phone: string;
  business_email: string;

  city: string;
  district: string;
  address: string;
  website: string;
  description: string;
}

const initialForm: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirmation: "",
  phone: "",

  business_name: "",
  business_type: "",
  business_phone: "",
  business_email: "",

  city: "",
  district: "",
  address: "",
  website: "",
  description: "",
};

function inputClassName(hasError = false) {
  return [
    "w-full rounded-2xl border bg-white px-4 py-3.5",
    "text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400",
    "focus:ring-4",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-50"
      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50",
  ].join(" ");
}

function Label({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {children}
      {required && (
        <span className="ml-1 text-indigo-600">*</span>
      )}
    </label>
  );
}

export default function BusinessApplyPage() {
  const [form, setForm] = useState<FormState>(initialForm);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (
      form.password !==
      form.password_confirmation
    ) {
      setError(
        "Şifre ve şifre tekrarı eşleşmiyor.",
      );
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Şifreniz en az 8 karakter olmalıdır.",
      );
      return;
    }

    setLoading(true);

    try {
      await createBusinessApplication({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),

        business_name:
          form.business_name.trim(),

        business_type:
          form.business_type.trim() ||
          undefined,

        business_phone:
          form.business_phone.trim() ||
          undefined,

        business_email:
          form.business_email.trim()
            .toLowerCase() || undefined,

        city: form.city.trim(),

        district:
          form.district.trim() ||
          undefined,

        address:
          form.address.trim() ||
          undefined,

        website:
          form.website.trim() ||
          undefined,

        description:
          form.description.trim() ||
          undefined,
      });

      setSuccess(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Başvurunuz gönderilemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center px-5 py-16 sm:px-8">
          <div className="w-full rounded-[2rem] border border-indigo-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(79,70,229,0.10)] sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-3xl text-emerald-600">
              ✓
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Başvurunuz alındı
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              İşletmenizi Optio&apos;ya
              eklemek için ilk adım tamamlandı.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500">
              Başvurunuz incelenmek üzere
              sisteme kaydedildi. Onay sürecinin
              ardından işletme hesabınız
              oluşturulacaktır.
            </p>

            <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 text-sm leading-6 text-indigo-900">
              Başvurunuz sırasında verdiğiniz
              e-posta adresi üzerinden sürecinizle
              ilgili iletişim kurulabilir.
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Ana sayfaya dön
              </Link>

              <Link
                href="/businesses"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                İşletmeleri keşfet
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-200/25 blur-3xl" />

          <div className="absolute right-[-180px] top-40 h-[320px] w-[320px] rounded-full bg-violet-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:pb-12 lg:pt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              İşletme başvurusu
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              İşletmenizi
              <span className="text-indigo-600">
                {" "}
                Optio&apos;ya
              </span>{" "}
              taşıyın.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
              Randevularınızı, müşterilerinizi,
              çalışanlarınızı ve hizmetlerinizi
              tek bir yerden yönetmek için
              başvurun.
            </p>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          {/* SIDE INFO */}
          <aside className="lg:sticky lg:top-28">
            <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                OPTIO İŞLETME
              </p>

              <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                İşletmenizi daha
                düzenli yönetin.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-500">
                Başvurunuzu gönderin. Ekip
                bilgilerinizi ve işletme detaylarınızı
                inceleyelim; onay sonrasında
                işletme yönetim panelinize geçin.
              </p>

              <div className="mt-7 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-indigo-600 shadow-sm">
                    01
                  </span>

                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Bilgilerinizi gönderin
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      İşletme ve iletişim
                      bilgilerinizi doldurun.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-violet-600 shadow-sm">
                    02
                  </span>

                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Başvurunuz incelensin
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      Başvurunuz admin panelinden
                      değerlendirilir.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-emerald-600 shadow-sm">
                    03
                  </span>

                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Optio&apos;ya başlayın
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      Onay sonrasında işletme
                      hesabınız oluşturulur.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
              Zaten hesabınız var mı?
              <Link
                href="/login"
                className="ml-1 font-bold text-indigo-600 hover:text-indigo-700"
              >
                Giriş yapın
              </Link>
            </div>
          </aside>

          {/* FORM CARD */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Başvuru formu
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                İşletme bilgilerinizi paylaşın
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Yıldızlı alanlar zorunludur.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-medium leading-6 text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-10"
            >
              {/* PERSONAL */}
              <div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    Yetkili bilgileri
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    İşletme hesabını yönetecek kişi.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label required>
                      Ad
                    </Label>

                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(event) =>
                        updateField(
                          "first_name",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Adınız"
                      required
                    />
                  </div>

                  <div>
                    <Label required>
                      Soyad
                    </Label>

                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(event) =>
                        updateField(
                          "last_name",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Soyadınız"
                      required
                    />
                  </div>

                  <div>
                    <Label required>
                      E-posta
                    </Label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label required>
                      Telefon
                    </Label>

                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="05XX XXX XX XX"
                      required
                    />
                  </div>

                  <div>
                    <Label required>
                      Şifre
                    </Label>

                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="En az 8 karakter"
                      minLength={8}
                      required
                    />
                  </div>

                  <div>
                    <Label required>
                      Şifre tekrar
                    </Label>

                    <input
                      type="password"
                      value={
                        form.password_confirmation
                      }
                      onChange={(event) =>
                        updateField(
                          "password_confirmation",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Şifrenizi tekrar girin"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* BUSINESS */}
              <div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    İşletme bilgileri
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    İşletmenizi tanımlamak için
                    kullanacağımız bilgiler.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label required>
                      İşletme adı
                    </Label>

                    <input
                      type="text"
                      value={
                        form.business_name
                      }
                      onChange={(event) =>
                        updateField(
                          "business_name",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Örn. Nova Güzellik Merkezi"
                      required
                    />
                  </div>

                  <div>
                    <Label>
                      İşletme türü
                    </Label>

                    <input
                      type="text"
                      value={
                        form.business_type
                      }
                      onChange={(event) =>
                        updateField(
                          "business_type",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Güzellik, berber, klinik..."
                    />
                  </div>

                  <div>
                    <Label>
                      İşletme telefonu
                    </Label>

                    <input
                      type="tel"
                      value={
                        form.business_phone
                      }
                      onChange={(event) =>
                        updateField(
                          "business_phone",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="05XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <Label>
                      İşletme e-postası
                    </Label>

                    <input
                      type="email"
                      value={
                        form.business_email
                      }
                      onChange={(event) =>
                        updateField(
                          "business_email",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="iletisim@isletme.com"
                    />
                  </div>

                  <div>
                    <Label>
                      Web sitesi
                    </Label>

                    <input
                      type="url"
                      value={form.website}
                      onChange={(event) =>
                        updateField(
                          "website",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* LOCATION */}
              <div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    Konum bilgileri
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    İşletmenizin bulunduğu bölge.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label required>
                      Şehir
                    </Label>

                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) =>
                        updateField(
                          "city",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Muğla"
                      required
                    />
                  </div>

                  <div>
                    <Label>
                      İlçe
                    </Label>

                    <input
                      type="text"
                      value={form.district}
                      onChange={(event) =>
                        updateField(
                          "district",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Bodrum"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>
                      Adres
                    </Label>

                    <input
                      type="text"
                      value={form.address}
                      onChange={(event) =>
                        updateField(
                          "address",
                          event.target.value,
                        )
                      }
                      className={inputClassName()}
                      placeholder="Mahalle, cadde, sokak, no..."
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* DESCRIPTION */}
              <div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    İşletme hakkında
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    İşletmenizi kısaca anlatabilirsiniz.
                  </p>
                </div>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  rows={6}
                  maxLength={2000}
                  className={`${inputClassName()} resize-none`}
                  placeholder="Sunduğunuz hizmetler, işletmenizin kısa tanımı ve diğer bilgiler..."
                />

                <div className="mt-2 text-right text-xs text-slate-400">
                  {form.description.length}/2000
                </div>
              </div>

              {/* SUBMIT */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                    i
                  </div>

                  <p className="text-sm leading-6 text-slate-600">
                    Başvurunuz gönderildikten sonra
                    bilgileriniz admin tarafından
                    incelenecektir. Onaylandığında
                    işletme sahibi hesabınız
                    oluşturulacaktır.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Başvurunuz gönderiliyor..."
                  : "İşletme başvurusu gönder"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                Başvuru oluşturmak ücretsizdir.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              O
            </div>

            <div>
              <div className="text-sm font-bold text-slate-950">
                Optio
              </div>

              <div className="text-xs text-slate-400">
                Randevu yönetimini sadeleştir.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-400">
            <Link
              href="/businesses"
              className="transition hover:text-indigo-600"
            >
              İşletmeleri keşfet
            </Link>

            <Link
              href="/login"
              className="transition hover:text-indigo-600"
            >
              Giriş yap
            </Link>

            <Link
              href="/"
              className="transition hover:text-indigo-600"
            >
              Ana sayfa
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 Optio
          </p>
        </div>
      </footer>
    </main>
  );
}