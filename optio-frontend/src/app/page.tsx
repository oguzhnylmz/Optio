import {
  getPublicBusiness,
} from "@/lib/api";

import CategoryPill from "@/components/home/CategoryPill";
import FeaturedBusinessCard from "@/components/home/FeaturedBusinessCard";


const categories = [
  { icon: "✂️", label: "Kuaför" },
  { icon: "✨", label: "Güzellik" },
  { icon: "💈", label: "Berber" },
  { icon: "🧘", label: "Spa & Wellness" },
  { icon: "🦷", label: "Diş Kliniği" },
  { icon: "➕", label: "Tüm Kategoriler" },
];


export default async function Home() {
  const business = await getPublicBusiness(
    "luna-beauty",
  );

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pb-24 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-semibold text-violet-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Zamanını kendine ayır
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Kendine
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                zaman ayır.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Favori işletmeni seç, sana uygun zamanı bul ve
              randevunu birkaç adımda oluştur.
            </p>

            {/* SEARCH */}
            <div className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-indigo-100 bg-white p-2 shadow-[0_18px_50px_rgba(79,70,229,0.10)] sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-xl px-4">
                <span className="text-lg text-slate-400">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="İşletme, hizmet veya konum ara..."
                  className="w-full bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="button"
                className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Ara
              </button>
            </div>

            {/* TRUST */}
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span>✓ Kolay kullanım</span>
              <span>✓ Güvenli booking</span>
              <span>✓ Hızlı randevu</span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-10 h-40 w-40 rounded-full bg-violet-200/50 blur-3xl" />
            <div className="absolute -right-4 bottom-10 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/90 bg-white p-3 shadow-[0_30px_80px_rgba(79,70,229,0.16)]">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-violet-100 via-indigo-50 to-white p-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Bugünkü keşif
                  </span>

                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm">
                    Optio
                  </span>
                </div>

                <div className="mt-8 rounded-3xl bg-white p-5 shadow-xl shadow-indigo-100">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl">
                      ✨
                    </div>

                    <div>
                      <div className="font-bold text-slate-950">
                        Luna Beauty
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        Güzellik Salonu · Marmaris
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-indigo-50 p-3 text-center">
                      <div className="text-xs text-slate-500">
                        Hizmet
                      </div>
                      <div className="mt-1 text-sm font-bold text-indigo-700">
                        Hair Cut
                      </div>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-3 text-center">
                      <div className="text-xs text-slate-500">
                        Süre
                      </div>
                      <div className="mt-1 text-sm font-bold text-violet-700">
                        30 dk
                      </div>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-3 text-center">
                      <div className="text-xs text-slate-500">
                        Fiyat
                      </div>
                      <div className="mt-1 text-sm font-bold text-blue-700">
                        400 ₺
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-2">
                    {["14:00", "14:30", "15:00", "15:30"].map(
                      (time, index) => (
                        <div
                          key={time}
                          className={[
                            "rounded-xl border px-2 py-2.5 text-center text-xs font-semibold",
                            index === 2
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-indigo-100 bg-white text-slate-600",
                          ].join(" ")}
                        >
                          {time}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <p className="mt-5 text-center text-sm font-medium text-slate-500">
                  Daha iyi hissetmek için kendine zaman ayır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="services"
        className="border-y border-indigo-100/70 bg-white/60"
      >
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none]">
            {categories.map((category) => (
              <CategoryPill
                key={category.label}
                icon={category.icon}
                label={category.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BUSINESS */}
      <section
        id="businesses"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
              Keşfet
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Öne çıkan işletmeler
            </h2>

            <p className="mt-3 max-w-xl text-slate-500">
              Sana uygun işletmeyi bul, hizmetini seç ve
              randevunu kolayca oluştur.
            </p>
          </div>

          <button
            type="button"
            className="text-left text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 sm:text-right"
          >
            Tümünü Gör →
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeaturedBusinessCard business={business} />

          {/* Visual placeholders until business discovery API exists */}
          <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/60 p-7">
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                ✦
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Daha fazla işletme
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                İşletme keşif altyapısı hazırlandıkça burada
                daha fazla seçenek göreceksin.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/60 p-7">
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                ♡
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Favorilerini keşfet
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Favori işletme ve hizmetlerini kaydetme
                özelliğini sonraki aşamada ekleyeceğiz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="border-t border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-3xl border border-white bg-white/80 p-7 shadow-sm">
              <div className="text-2xl">⚡</div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                Hızlı
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Uygun hizmeti ve zamanı birkaç adımda
                bul.
              </p>
            </div>

            <div className="rounded-3xl border border-white bg-white/80 p-7 shadow-sm">
              <div className="text-2xl">♡</div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                Kolay
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Gereksiz karmaşa olmadan randevunu
                oluştur.
              </p>
            </div>

            <div className="rounded-3xl border border-white bg-white/80 p-7 shadow-sm">
              <div className="text-2xl">⌁</div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                Modern
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                İşletmeler ve müşteriler için sade bir
                deneyim.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-indigo-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
              O
            </span>

            Optio
          </div>

          <p>
            Daha fazla müşteri, daha mutlu günler.
          </p>

          <p>© 2026 Optio</p>
        </div>
      </footer>
    </main>
  );
}