import Link from "next/link";
import { notFound } from "next/navigation";

import BookingFlow from "@/components/booking/BookingFlow";
import {
  getPublicBusiness,
  getPublicServices,
} from "@/lib/api";

interface BusinessPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function BusinessVisual({
  src,
  alt,
  initials,
}: {
  src: string | null;
  alt: string;
  initials: string;
}) {
  if (src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${src}")`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#ddd9ff] via-[#eeedff] to-[#dce9ff]"
    >
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/80 blur-3xl" />

      <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-white/20 blur-sm" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/80 bg-white/85 text-4xl font-bold text-indigo-600 shadow-[0_20px_45px_rgba(79,70,229,0.16)] backdrop-blur">
          {initials}
        </div>
      </div>
    </div>
  );
}

export default async function BusinessPage({
  params,
}: BusinessPageProps) {
  const { slug } = await params;

  try {
    const [business, services] =
      await Promise.all([
        getPublicBusiness(slug),
        getPublicServices(slug),
      ]);

    const initials = business.name
      .split(" ")
      .map((word) =>
        word.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
        {/* TOP NAV */}
        <section className="border-b border-indigo-100/80 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-600 transition-colors hover:text-indigo-600"
            >
              <span className="text-lg">
                ←
              </span>

              Ana sayfa
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                O
              </span>

              Optio
            </Link>
          </div>
        </section>

        {/* HERO */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-7 sm:px-8 lg:pb-14 lg:pt-10">
            <div className="grid overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-[0_25px_80px_rgba(79,70,229,0.09)] lg:grid-cols-[1.15fr_.85fr]">
              {/* VISUAL */}
              <div className="relative min-h-[360px] overflow-hidden lg:min-h-[520px]">
                <BusinessVisual
                  src={business.logo_url}
                  alt={business.name}
                  initials={initials}
                />

                <div className="absolute left-6 top-6 flex flex-wrap gap-2 sm:left-8 sm:top-8">
                  <span className="rounded-full bg-white/90 px-3.5 py-2 text-xs font-bold text-indigo-600 shadow-sm backdrop-blur">
                    Güzellik & bakım
                  </span>

                  <span className="rounded-full border border-white/70 bg-white/85 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                    Online booking
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="Favorilere ekle"
                  className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-lg text-slate-500 shadow-sm backdrop-blur transition hover:scale-105 hover:text-indigo-600 sm:right-8 sm:top-8"
                >
                  ♡
                </button>

                <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-slate-950">
                          {business.name}
                        </div>

                        <div className="mt-1 truncate text-sm text-slate-500">
                          {business.city
                            ? `${business.city}${
                                business.country
                                  ? `, ${business.country}`
                                  : ""
                              }`
                            : "Online randevu"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BUSINESS INFO */}
              <div className="flex flex-col justify-between p-7 sm:p-9 lg:p-11">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-600">
                      Güzellik Salonu
                    </span>

                    <span className="text-sm font-medium text-slate-400">
                      Online randevu
                    </span>
                  </div>

                  <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-[3.4rem]">
                    {business.name}
                  </h1>

                  {business.description && (
                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
                      {business.description}
                    </p>
                  )}

                  <div className="mt-8 space-y-3">
                    {business.city && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-sm">
                          📍
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Konum
                          </div>

                          <div className="mt-1 text-[15px] font-semibold text-slate-800">
                            {business.city}
                            {business.country
                              ? `, ${business.country}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    )}

                    {business.phone && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-sm">
                          ☎
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Telefon
                          </div>

                          <div className="mt-1 text-[15px] font-semibold text-slate-800">
                            {business.phone}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm">
                        ✦
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Hizmetler
                        </div>

                        <div className="mt-1 text-[15px] font-semibold text-slate-800">
                          {services.length} aktif hizmet
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <a
                    href="#booking"
                    className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(79,70,229,0.22)] transition hover:-translate-y-0.5 hover:bg-indigo-700"
                  >
                    Randevu Al

                    <span className="ml-2 text-lg">
                      →
                    </span>
                  </a>

                  <p className="mt-3 text-center text-sm text-slate-400">
                    Hesap oluşturmadan da randevu alabilirsin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NAVIGATION */}
        <section className="sticky top-16 z-40 border-y border-indigo-100 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl overflow-x-auto px-5 sm:px-8">
            <nav className="flex min-w-max items-center gap-9">
              <a
                href="#booking"
                className="border-b-2 border-indigo-600 py-4 text-[15px] font-bold text-indigo-600"
              >
                Randevu
              </a>

              <a
                href="#info"
                className="py-4 text-[15px] font-semibold text-slate-600 transition-colors hover:text-indigo-600"
              >
                Hakkında
              </a>

              <a
                href="#reviews"
                className="py-4 text-[15px] font-semibold text-slate-600 transition-colors hover:text-indigo-600"
              >
                Yorumlar
              </a>

              <a
                href="#location"
                className="py-4 text-[15px] font-semibold text-slate-600 transition-colors hover:text-indigo-600"
              >
                Konum
              </a>
            </nav>
          </div>
        </section>

        {/* BOOKING */}
        <section
          id="booking"
          className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20"
        >
          <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />

                  Online randevu
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Sana uygun zamanı seç.
                </h2>

                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500 sm:text-base">
                  Hizmetini ve uzmanını seç, uygun zamanı görüntüle
                  ve randevunu birkaç adımda tamamla.
                </p>
              </div>

              <div className="rounded-[2rem] border border-indigo-100 bg-white shadow-[0_20px_65px_rgba(79,70,229,0.08)]">
                <div className="p-5 sm:p-8 lg:p-9">
                  <BookingFlow
                    slug={business.slug}
                    businessTimezone={business.timezone}
                    services={services}
                  />
                </div>
              </div>
            </div>

            {/* DESKTOP SUMMARY */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <div className="rounded-[1.75rem] border border-indigo-100 bg-white p-5 shadow-[0_15px_45px_rgba(79,70,229,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg">
                      ✨
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                        {business.name}
                      </div>

                      <div className="mt-1 text-[15px] font-bold text-slate-900">
                        Randevu nasıl çalışır?
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    {[
                      [
                        "01",
                        "Hizmetini seç",
                        "İhtiyacına uygun hizmeti belirle.",
                      ],
                      [
                        "02",
                        "Tarih & saat",
                        "Uygun uzman ve zamanı bul.",
                      ],
                      [
                        "03",
                        "Bilgilerini gir",
                        "İletişim bilgilerini tamamla.",
                      ],
                      [
                        "04",
                        "Onay",
                        "Randevu numaranı al.",
                      ],
                    ].map(
                      ([
                        number,
                        title,
                        description,
                      ]) => (
                        <div
                          key={number}
                          className="flex gap-3 rounded-2xl bg-slate-50 p-3.5"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-indigo-600 shadow-sm">
                            {number}
                          </div>

                          <div>
                            <div className="text-[15px] font-bold text-slate-900">
                              {title}
                            </div>

                            <div className="mt-0.5 text-sm leading-5 text-slate-500">
                              {description}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <div className="flex items-center gap-2 text-[15px] font-bold text-emerald-700">
                      <span>✓</span>
                      Hesap zorunlu değil
                    </div>

                    <p className="mt-1 text-sm leading-5 text-emerald-700/70">
                      Guest olarak doğrudan randevu oluşturabilirsin.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* INFO */}
        <section
          id="info"
          className="border-y border-indigo-100 bg-white"
        >
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Hakkında
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-[2.6rem]">
                {business.name}
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                {business.description ||
                  "İşletme hakkında daha fazla bilgi yakında burada yer alacak."}
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-indigo-50 p-6">
                <div className="text-2xl">✨</div>

                <div className="mt-4 text-base font-bold text-slate-950">
                  Online randevu
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Uygun zamanı doğrudan online seç.
                </p>
              </div>

              <div className="rounded-3xl bg-violet-50 p-6">
                <div className="text-2xl">♡</div>

                <div className="mt-4 text-base font-bold text-slate-950">
                  Kolay booking
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Kısa bir akışla randevunu tamamla.
                </p>
              </div>

              <div className="rounded-3xl bg-blue-50 p-6">
                <div className="text-2xl">◷</div>

                <div className="mt-4 text-base font-bold text-slate-950">
                  Yerel saat
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Saatler işletmenin yerel zamanına göre gösterilir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section
          id="reviews"
          className="mx-auto max-w-7xl px-5 py-14 sm:px-8"
        >
          <div className="rounded-[2rem] border border-indigo-100 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Yorumlar
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Müşteri deneyimleri
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Yorum sistemi henüz backend'de bulunmadığı için gerçek
              değerlendirmeler sonraki aşamada burada gösterilecek.
            </p>
          </div>
        </section>

        {/* LOCATION */}
        <section
          id="location"
          className="mx-auto max-w-7xl px-5 pb-14 sm:px-8"
        >
          <div className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-7 sm:p-9">
            <div className="grid gap-8 md:grid-cols-[1fr_280px] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  Konum
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {business.city ||
                    "İşletme konumu"}
                </h2>

                <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
                  Harita ve detaylı adres bilgileri sonraki aşamada
                  burada gösterilecek.
                </p>
              </div>

              <div className="flex h-36 items-center justify-center rounded-3xl border border-white bg-white/80 text-[15px] font-bold text-indigo-600 shadow-sm">
                📍 Harita alanı
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-indigo-100 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-[15px] text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-slate-950"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                O
              </span>

              Optio
            </Link>

            <span>
              Daha fazla müşteri, daha mutlu günler.
            </span>

            <span>© 2026 Optio</span>
          </div>
        </footer>
      </main>
    );
  } catch {
    notFound();
  }
}