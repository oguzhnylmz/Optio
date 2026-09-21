import Link from "next/link";

import {
  getPublicBusiness,
} from "@/lib/api";

import FeaturedBusinessCard from "@/components/home/FeaturedBusinessCard";

const demoAppointments = [
  {
    time: "09:30",
    name: "Elif Yılmaz",
    service: "Saç Kesimi",
    status: "Onaylandı",
  },
  {
    time: "11:00",
    name: "Mert Kaya",
    service: "Sakal Tıraşı",
    status: "Beklemede",
  },
  {
    time: "13:30",
    name: "Selin Aras",
    service: "Manikür",
    status: "Onaylandı",
  },
];

export default async function Home() {
  const business = await getPublicBusiness(
    "luna-beauty",
  );

  return (
    <main className="overflow-hidden bg-white text-slate-950">
      {/* ===================================================== */}
      {/* HERO */}
      {/* ===================================================== */}

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[700px] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.12),_transparent_38%),linear-gradient(to_bottom,_#f8faff,_#ffffff)]" />

        <div className="absolute left-[-120px] top-[120px] -z-10 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="absolute right-[-120px] top-[260px] -z-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:pb-28 lg:pt-20">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_0_5px_rgba(99,102,241,0.10)]" />
              Randevu yönetiminin daha kolay yolu
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              Randevularınızı
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                daha kolay yönetin.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Optio; randevularınızı, müşterilerinizi,
              çalışanlarınızı ve çalışma saatlerinizi tek bir
              yerde yönetmenizi sağlayan modern bir işletme
              platformudur.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/businesses"
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(79,70,229,0.24)] transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                İşletmeleri Keşfet

                <span className="ml-2 text-base">
                  →
                </span>
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
              >
                Nasıl çalışır?
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="text-indigo-500">
                  ✓
                </span>
                Hızlı randevu
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="text-indigo-500">
                  ✓
                </span>
                Kolay kullanım
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="text-indigo-500">
                  ✓
                </span>
                Modern deneyim
              </span>
            </div>
          </div>

          {/* RIGHT / DASHBOARD SHOWCASE */}
          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-indigo-200/20 blur-3xl" />

            <div className="relative rounded-[2.2rem] border border-indigo-100 bg-white p-3 shadow-[0_35px_100px_rgba(79,70,229,0.14)]">
              <div className="overflow-hidden rounded-[1.7rem] bg-[#f6f7fb]">
                {/* WINDOW HEADER */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    </div>

                    <div className="hidden text-xs font-semibold text-slate-400 sm:block">
                      optio.business
                    </div>
                  </div>

                  <div className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-600">
                    İşletme Paneli
                  </div>
                </div>

                <div className="grid min-h-[500px] grid-cols-[74px_1fr] sm:grid-cols-[150px_1fr]">
                  {/* SIDEBAR */}
                  <div className="border-r border-slate-200 bg-white p-3 sm:p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white sm:w-full">
                      O
                    </div>

                    <div className="mt-8 space-y-2">
                      {[
                        "Genel Bakış",
                        "Randevular",
                        "Takvim",
                        "Müşteriler",
                        "Hizmetler",
                      ].map(
                        (
                          item,
                          index,
                        ) => (
                          <div
                            key={item}
                            className={[
                              "rounded-xl px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs",
                              index === 0
                                ? "bg-indigo-50 text-indigo-600"
                                : "text-slate-400",
                            ].join(
                              " ",
                            )}
                          >
                            <span className="hidden sm:inline">
                              {item}
                            </span>

                            <span className="sm:hidden">
                              {index === 0
                                ? "⌂"
                                : index === 1
                                  ? "◷"
                                  : index === 2
                                    ? "▦"
                                    : index === 3
                                      ? "◎"
                                      : "✦"}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                          Bugün
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-950 sm:text-2xl">
                          Günaydın 👋
                        </h3>
                      </div>

                      <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:block">
                        21 Eylül 2026
                      </div>
                    </div>

                    {/* KPI CARDS */}
                    <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                      <div className="rounded-2xl border border-indigo-100 bg-white p-3 sm:p-4">
                        <div className="text-[10px] text-slate-400 sm:text-xs">
                          Randevu
                        </div>

                        <div className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                          12
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-white p-3 sm:p-4">
                        <div className="text-[10px] text-slate-400 sm:text-xs">
                          Müşteri
                        </div>

                        <div className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                          84
                        </div>
                      </div>

                      <div className="rounded-2xl border border-indigo-100 bg-white p-3 sm:p-4">
                        <div className="text-[10px] text-slate-400 sm:text-xs">
                          Bekleyen
                        </div>

                        <div className="mt-1 text-xl font-bold text-indigo-600 sm:text-2xl">
                          3
                        </div>
                      </div>
                    </div>

                    {/* APPOINTMENTS */}
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-950">
                            Bugünün programı
                          </div>

                          <div className="mt-1 text-[11px] text-slate-400">
                            Yaklaşan randevular
                          </div>
                        </div>

                        <div className="text-[11px] font-semibold text-indigo-600">
                          Tümünü gör
                        </div>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {demoAppointments.map(
                          (appointment) => (
                            <div
                              key={
                                appointment.time
                              }
                              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"
                            >
                              <div className="min-w-[42px] text-xs font-bold text-indigo-600">
                                {
                                  appointment.time
                                }
                              </div>

                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-600">
                                {
                                  appointment.name
                                    .charAt(
                                      0,
                                    )
                                }
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-bold text-slate-900">
                                  {
                                    appointment.name
                                  }
                                </div>

                                <div className="truncate text-[10px] text-slate-400">
                                  {
                                    appointment.service
                                  }
                                </div>
                              </div>

                              <div
                                className={[
                                  "rounded-full px-2 py-1 text-[9px] font-bold",
                                  appointment.status ===
                                  "Onaylandı"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-amber-50 text-amber-600",
                                ].join(
                                  " ",
                                )}
                              >
                                {
                                  appointment.status
                                }
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING CARD */}
            <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-indigo-100 bg-white p-4 shadow-[0_20px_45px_rgba(79,70,229,0.15)] sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  ✓
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Randevu onaylandı
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    Elif Yılmaz · 09:30
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* SOCIAL PROOF / STATS */}
      {/* ===================================================== */}

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-100 px-5 sm:grid-cols-4 sm:px-8 sm:divide-y-0">
          <div className="px-4 py-8 text-center sm:py-10">
            <div className="text-2xl font-bold text-slate-950">
              7/24
            </div>

            <div className="mt-1 text-xs font-medium text-slate-400">
              Randevu erişimi
            </div>
          </div>

          <div className="px-4 py-8 text-center sm:py-10">
            <div className="text-2xl font-bold text-slate-950">
              Tek Panel
            </div>

            <div className="mt-1 text-xs font-medium text-slate-400">
              İşletme yönetimi
            </div>
          </div>

          <div className="px-4 py-8 text-center sm:py-10">
            <div className="text-2xl font-bold text-slate-950">
              Hızlı
            </div>

            <div className="mt-1 text-xs font-medium text-slate-400">
              Randevu oluşturma
            </div>
          </div>

          <div className="px-4 py-8 text-center sm:py-10">
            <div className="text-2xl font-bold text-slate-950">
              Modern
            </div>

            <div className="mt-1 text-xs font-medium text-slate-400">
              Kullanıcı deneyimi
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FEATURED BUSINESS */}
      {/* ===================================================== */}

      <section
        id="businesses"
        className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              <span className="h-px w-7 bg-indigo-500" />
              Keşfet
            </div>

            <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-5xl">
              İhtiyacınız olan hizmeti
              <span className="text-indigo-600">
                {" "}
                doğru yerde
              </span>{" "}
              bulun.
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
              Yakınınızdaki işletmeleri keşfedin,
              hizmetleri inceleyin ve size uygun
              zamanı seçerek randevunuzu kolayca
              oluşturun.
            </p>

            <div className="mt-7 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-sm text-indigo-600">
                  01
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  İşletmenizi bulun
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-sm text-violet-600">
                  02
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  Hizmetinizi seçin
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-sm text-indigo-600">
                  03
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  Uygun zamanı ayırın
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FeaturedBusinessCard
              business={business}
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-7 text-white shadow-[0_25px_60px_rgba(79,70,229,0.20)]">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="text-4xl">
                  ✦
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                  Daha fazlası
                </p>

                <h3 className="mt-3 text-2xl font-bold leading-tight">
                  Size uygun
                  <br />
                  işletmeyi keşfedin.
                </h3>

                <p className="mt-4 text-sm leading-6 text-white/75">
                  Kategorilere göre keşfedin,
                  hizmetleri karşılaştırın ve
                  randevu sürecini birkaç adımda
                  tamamlayın.
                </p>

                <Link
                  href="/businesses"
                  className="mt-8 inline-flex items-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
                >
                  Keşfet

                  <span className="ml-2">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* HOW IT WORKS */}
      {/* ===================================================== */}

      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/80"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Nasıl çalışır?
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              Randevu almak hiç bu kadar
              <span className="text-indigo-600">
                {" "}
                kolay olmamıştı.
              </span>
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500">
              Karmaşık formlar, uzun telefon trafiği
              veya gereksiz adımlar olmadan.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "İşletmenizi seçin",
                text: "İhtiyacınıza uygun işletmeyi ve hizmeti keşfedin.",
              },
              {
                number: "02",
                title: "Uygun zamanı bulun",
                text: "Çalışan ve hizmete göre size uygun saatleri görün.",
              },
              {
                number: "03",
                title: "Randevunuzu oluşturun",
                text: "Bilgilerinizi girin ve randevunuzu saniyeler içinde tamamlayın.",
              },
            ].map(
              (step) => (
                <div
                  key={step.number}
                  className="group rounded-[2rem] border border-white bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-600">
                      {
                        step.number
                      }
                    </div>

                    <div className="ml-4 h-px flex-1 bg-slate-100" />
                  </div>

                  <h3 className="mt-7 text-xl font-bold text-slate-950">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {step.text}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FEATURES */}
      {/* ===================================================== */}

      <section
        id="about"
        className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              <span className="h-px w-7 bg-indigo-500" />
              Neden Optio?
            </div>

            <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-5xl">
              Hem işletmeler hem
              <span className="text-indigo-600">
                {" "}
                müşteriler için.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
              Optio, randevu sürecinin iki tarafını da
              düşünerek tasarlanıyor. İşletmeler için
              düzen, müşteriler için kolaylık.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: "◷",
                title: "Randevu Yönetimi",
                text: "Randevularınızı tarih ve duruma göre kolayca yönetin.",
              },
              {
                icon: "◎",
                title: "Müşteri Yönetimi",
                text: "Müşterilerinizi tek bir merkezden görüntüleyin ve yönetin.",
              },
              {
                icon: "✦",
                title: "Çalışan Yönetimi",
                text: "Çalışanlarınızı, hizmetlerini ve uygunluklarını kontrol edin.",
              },
              {
                icon: "▦",
                title: "Takvim & Saatler",
                text: "Çalışma saatlerinizi belirleyin ve uygun zamanı net şekilde yönetin.",
              },
            ].map(
              (feature) => (
                <div
                  key={feature.title}
                  className="rounded-[1.8rem] border border-indigo-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-lg text-indigo-600">
                    {feature.icon}
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.text}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FINAL CTA */}
      {/* ===================================================== */}

      <section className="px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-6 py-14 text-center text-white shadow-[0_30px_80px_rgba(79,70,229,0.22)] sm:px-10 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">
              Optio
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
              Zamanınızı daha iyi
              <br className="hidden sm:block" />
              değerlendirin.
            </h2>

            <p className="mt-5 text-base leading-7 text-white/75 sm:text-lg">
              Daha düzenli işletmeler, daha kolay
              randevular ve daha iyi bir deneyim.
            </p>

            <Link
              href="/businesses"
              className="mt-8 inline-flex items-center rounded-2xl bg-white px-7 py-4 text-sm font-bold text-indigo-600 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Randevuya Başla

              <span className="ml-2">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FOOTER */}
      {/* ===================================================== */}

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
              İşletmeleri Keşfet
            </Link>

            <a
              href="#how-it-works"
              className="transition hover:text-indigo-600"
            >
              Nasıl Çalışır?
            </a>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 Optio
          </p>
        </div>
      </footer>
    </main>
  );
}