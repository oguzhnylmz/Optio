import Link from "next/link";

import {
  getPublicBusinesses,
} from "@/lib/api";

interface BusinessesPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
  }>;
}

function getInitials(
  name: string,
) {
  return name
    .split(" ")
    .map(
      (word) =>
        word.charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function BusinessVisual({
  business,
}: {
  business: Awaited<
    ReturnType<typeof getPublicBusinesses>
  >[number];
}) {
  const initials =
    getInitials(
      business.name,
    );

  if (business.logo_url) {
    return (
      <div
        className="h-52 bg-cover bg-center"
        style={{
          backgroundImage: `url("${business.logo_url}")`,
        }}
      >
        <div className="h-full bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-indigo-100 via-violet-50 to-blue-100">
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/80 blur-3xl" />

      <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.7rem] border border-white/80 bg-white/85 text-3xl font-bold text-indigo-600 shadow-[0_20px_45px_rgba(79,70,229,0.16)] backdrop-blur">
          {initials}
        </div>
      </div>
    </div>
  );
}

export default async function BusinessesPage({
  searchParams,
}: BusinessesPageProps) {
  const params =
    await searchParams;

  const q =
    params.q?.trim() ?? "";

  const city =
    params.city?.trim() ?? "";

  const businesses =
    await getPublicBusinesses(
      q || undefined,
      city || undefined,
    );

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <section className="border-b border-indigo-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
              O
            </span>

            Optio
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-semibold text-slate-500 transition hover:text-indigo-600 sm:block"
            >
              Ana Sayfa
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <section className="relative overflow-hidden border-b border-indigo-100 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.10),_transparent_38%)]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 sm:px-8 lg:pb-18 lg:pt-18">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-bold text-indigo-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              İşletmeleri keşfet
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Sana uygun
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                işletmeyi bul.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              İşletmeleri keşfet, hizmetlerini incele
              ve sana uygun zamanı seçerek
              randevunu kolayca oluştur.
            </p>
          </div>

          {/* SEARCH */}
          <form
            method="GET"
            className="mt-9 grid max-w-5xl gap-3 rounded-[1.7rem] border border-indigo-100 bg-white p-3 shadow-[0_18px_55px_rgba(79,70,229,0.10)] lg:grid-cols-[1fr_230px_auto]"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4">
              <span className="text-lg text-slate-400">
                ⌕
              </span>

              <input
                name="q"
                defaultValue={q}
                type="text"
                placeholder="İşletme, şehir veya açıklama ara..."
                className="w-full bg-transparent py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4">
              <span className="text-sm text-slate-400">
                📍
              </span>

              <input
                name="city"
                defaultValue={city}
                type="text"
                placeholder="Şehir"
                className="w-full bg-transparent py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Ara
            </button>
          </form>
        </div>
      </section>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Keşfet
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {q || city
                ? "Arama sonuçları"
                : "Tüm işletmeler"}
            </h2>
          </div>

          <div className="text-sm font-medium text-slate-400">
            {businesses.length} işletme
          </div>
        </div>

        {/* ACTIVE FILTERS */}
        {(q || city) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {q && (
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-600">
                Arama: {q}
              </span>
            )}

            {city && (
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-600">
                Şehir: {city}
              </span>
            )}

            <Link
              href="/businesses"
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              Temizle
            </Link>
          </div>
        )}

        {/* EMPTY STATE */}
        {businesses.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-indigo-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
              ⌕
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-950">
              İşletme bulunamadı.
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Arama kriterlerini değiştirerek tekrar
              deneyebilirsin.
            </p>

            <Link
              href="/businesses"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Tüm işletmeleri göster
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {businesses.map(
              (business) => (
                <article
                  key={business.id}
                  className="group overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_22px_55px_rgba(79,70,229,0.10)]"
                >
                  {/* VISUAL */}
                  <div className="relative overflow-hidden">
                    <BusinessVisual
                      business={business}
                    />

                    <div className="absolute left-4 top-4">
                      <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-indigo-600 shadow-sm backdrop-blur">
                        Aktif
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-bold text-slate-950">
                          {business.name}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <span>
                            📍
                          </span>

                          <span className="truncate">
                            {business.city ||
                              "Konum belirtilmemiş"}
                            {business.country
                              ? `, ${business.country}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                        {getInitials(
                          business.name,
                        )}
                      </div>
                    </div>

                    <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-500">
                      {business.description ||
                        "Online randevu ile kolayca hizmet seç ve uygun zamanı ayır."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                      <div className="text-xs font-semibold text-slate-400">
                        Online randevu
                      </div>

                      <Link
                        href={`/business/${business.slug}`}
                        className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                      >
                        İşletmeyi Gör

                        <span className="ml-2 text-sm">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="border-t border-indigo-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-slate-950"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
              O
            </span>

            Optio
          </Link>

          <span>
            Daha fazla müşteri, daha mutlu günler.
          </span>

          <span>
            © 2026 Optio
          </span>
        </div>
      </footer>
    </main>
  );
}