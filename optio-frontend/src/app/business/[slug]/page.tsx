import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

import BookingFlow from "@/components/booking/BookingFlow";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#ddd9ff] via-[#eeedff] to-[#dce9ff]"
    >
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/80 blur-3xl" />

      <div className="absolute -bottom-28 -right-12 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-white/20 blur-sm" />

      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/80 bg-white/85 text-4xl font-bold text-indigo-600 shadow-[0_25px_55px_rgba(79,70,229,0.16)] backdrop-blur transition-transform duration-500 hover:scale-105">
          {initials}
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  children,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="group rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-[0_14px_35px_rgba(79,70,229,0.08)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-indigo-600">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 transition-colors group-hover:text-indigo-400">
            {label}
          </div>

          <div className="mt-1 truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href}>
      {content}
    </a>
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
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <TooltipProvider>
        <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
          {/* ================================================= */}
          {/* HERO */}
          {/* ================================================= */}

          <section className="border-b border-indigo-100 bg-white">
            <div className="mx-auto max-w-7xl px-5 pb-10 pt-10 sm:px-8 lg:pb-16 lg:pt-14">
              <div className="grid overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-[0_28px_90px_rgba(79,70,229,0.10)] lg:grid-cols-[1.08fr_.92fr]">
                {/* VISUAL */}

                <div className="relative min-h-[360px] overflow-hidden lg:min-h-[560px]">
                  <BusinessVisual
                    src={business.logo_url}
                    alt={business.name}
                    initials={initials}
                  />

                  <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                    <Badge className="border border-white/60 bg-white/90 px-3.5 py-2 text-xs font-bold text-indigo-600 shadow-sm backdrop-blur hover:bg-white">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      Online randevu
                    </Badge>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
                    <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-bold text-slate-950">
                            {business.name}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />

                            <span className="truncate">
                              {business.city
                                ? `${business.city}${
                                    business.country
                                      ? `, ${business.country}`
                                      : ""
                                  }`
                                : "Online randevu"}
                            </span>
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
                      <Badge className="border-0 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        İşletme
                      </Badge>

                      <span className="text-sm font-medium text-slate-400">
                        Online randevu
                      </span>
                    </div>

                    <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.7rem]">
                      {business.name}
                    </h1>

                    {business.description && (
                      <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
                        {business.description}
                      </p>
                    )}

                    {/* QUICK INFO */}

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {business.city && (
                        <ContactCard
                          icon={
                            <MapPin className="h-4 w-4" />
                          }
                          label="Konum"
                        >
                          {business.city}
                          {business.country
                            ? `, ${business.country}`
                            : ""}
                        </ContactCard>
                      )}

                      <ContactCard
                        icon={
                          <Sparkles className="h-4 w-4" />
                        }
                        label="Hizmetler"
                      >
                        {services.length} aktif hizmet
                      </ContactCard>

                      {business.phone && (
                        <ContactCard
                          href={`tel:${business.phone}`}
                          icon={
                            <Phone className="h-4 w-4" />
                          }
                          label="Telefon"
                        >
                          {business.phone}
                        </ContactCard>
                      )}

                      {business.email && (
                        <ContactCard
                          href={`mailto:${business.email}`}
                          icon={
                            <Mail className="h-4 w-4" />
                          }
                          label="E-posta"
                        >
                          {business.email}
                        </ContactCard>
                      )}
                    </div>
                  </div>

                  <div className="mt-10">
                    <Button
                      asChild
                      size="lg"
                      className="h-13 w-full rounded-2xl bg-indigo-600 text-[15px] font-bold text-white shadow-[0_16px_32px_rgba(79,70,229,0.22)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_20px_38px_rgba(79,70,229,0.25)]"
                    >
                      <a href="#booking">
                        Randevu al
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>

                    <p className="mt-3 text-center text-sm text-slate-400">
                      Hesap oluşturmadan da randevu
                      oluşturabilirsin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* NAVIGATION */}
          {/* ================================================= */}

          <section className="sticky top-16 z-40 border-y border-indigo-100 bg-white/95 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl overflow-x-auto px-5 sm:px-8">
              <nav className="flex min-w-max items-center gap-8">
                <a
                  href="#booking"
                  className="border-b-2 border-indigo-600 py-4 text-sm font-bold text-indigo-600"
                >
                  Randevu
                </a>

                <a
                  href="#services"
                  className="py-4 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  Hizmetler
                </a>

                <a
                  href="#about"
                  className="py-4 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  Hakkında
                </a>

                <a
                  href="#location"
                  className="py-4 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  İletişim
                </a>
              </nav>
            </div>
          </section>

          {/* ================================================= */}
          {/* SERVICES */}
          {/* ================================================= */}

          <section
            id="services"
            className="scroll-mt-16 border-b border-indigo-100 bg-white"
          >
            <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Hizmetler
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    Sunulan hizmetleri keşfet.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                    İhtiyacın olan hizmeti incele,
                    detaylarını gör ve uygun zamanı
                    seçerek randevunu oluştur.
                  </p>
                </div>

                <Badge className="hidden rounded-2xl border-0 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:inline-flex">
                  {services.length} aktif hizmet
                </Badge>
              </div>

              {services.length > 0 ? (
                <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <Card
                      key={service.id}
                      className="group overflow-hidden rounded-[1.5rem] border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_rgba(79,70,229,0.10)]"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                            <Sparkles className="h-5 w-5" />
                          </div>

                          <Badge
                            variant="secondary"
                            className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600"
                          >
                            <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                            {service.duration_minutes} dk
                          </Badge>
                        </div>

                        <h3 className="mt-5 text-lg font-bold text-slate-950 transition-colors group-hover:text-indigo-700">
                          {service.name}
                        </h3>

                        <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                          {service.description ||
                            "Bu hizmet hakkında detaylı bilgi randevu adımında görüntülenebilir."}
                        </p>

                        <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Ücret
                            </div>

                            <div className="mt-1 text-lg font-bold text-slate-950">
                              {service.price}{" "}
                              {service.currency}
                            </div>
                          </div>

                          <Button
                            asChild
                            variant="outline"
                            className="rounded-xl border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-600 transition-all hover:border-indigo-600 hover:bg-indigo-600 hover:text-white"
                          >
                            <a href="#booking">
                              Randevu al
                              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="mt-9 rounded-[1.5rem] border-dashed bg-slate-50 shadow-none">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <div className="mt-4 text-sm font-semibold text-slate-700">
                      Henüz aktif hizmet bulunmuyor.
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Randevu sistemi hizmetler
                      eklendiğinde burada
                      görüntülenecek.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* ================================================= */}
          {/* BOOKING */}
          {/* ================================================= */}

          <section
            id="booking"
            className="scroll-mt-16 mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20"
          >
            <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="mb-8">
                  <Badge className="border-0 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    Online randevu
                  </Badge>

                  <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    Sana uygun zamanı seç.
                  </h2>

                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500 sm:text-base">
                    Hizmetini ve uzmanını seç,
                    uygun zamanı görüntüle ve
                    randevunu birkaç adımda tamamla.
                  </p>
                </div>

                <Card className="overflow-hidden rounded-[2rem] border-indigo-100 shadow-[0_22px_70px_rgba(79,70,229,0.08)]">
                  <CardContent className="p-5 sm:p-8 lg:p-9">
                    <BookingFlow
                      slug={business.slug}
                      businessTimezone={business.timezone}
                      services={services}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* DESKTOP SUMMARY */}

              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <Card className="rounded-[1.75rem] border-indigo-100 shadow-[0_15px_45px_rgba(79,70,229,0.06)]">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                          <CalendarDays className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
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
                              className="group flex cursor-default gap-3 rounded-2xl bg-slate-50 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-50/70 hover:shadow-sm"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-indigo-600 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                                {number}
                              </div>

                              <div>
                                <div className="text-[15px] font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
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

                      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-sm">
                        <div className="flex items-center gap-2 text-[15px] font-bold text-emerald-700">
                          <Check className="h-4 w-4" />
                          Hesap zorunlu değil
                        </div>

                        <p className="mt-1 text-sm leading-5 text-emerald-700/70">
                          Misafir olarak doğrudan
                          randevu oluşturabilirsin.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </section>

          {/* ================================================= */}
          {/* ABOUT */}
          {/* ================================================= */}

          <section
            id="about"
            className="scroll-mt-16 border-y border-indigo-100 bg-white"
          >
            <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
              <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Hakkında
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    {business.name}
                  </h2>

                  <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500">
                    {business.description ||
                      "Bu işletme hakkında henüz detaylı bir açıklama eklenmemiş."}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <Card className="group rounded-[1.5rem] border-indigo-100 bg-indigo-50/70 shadow-none transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_40px_rgba(79,70,229,0.08)]">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition-transform group-hover:scale-105">
                          <CalendarDays className="h-4 w-4" />
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Online randevu
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Uygun zamanını doğrudan seç.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group rounded-[1.5rem] border-violet-100 bg-violet-50/70 shadow-none transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_40px_rgba(124,58,237,0.08)]">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm transition-transform group-hover:scale-105">
                          <Clock3 className="h-4 w-4" />
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Yerel saat
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Randevu saatleri işletmenin
                            yerel zamanına göre gösterilir.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* LOCATION */}
          {/* ================================================= */}

          <section
            id="location"
            className="scroll-mt-16 mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20"
          >
            <div className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-7 sm:p-9 lg:p-10">
              <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    İletişim & konum
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    İşletmeye nasıl
                    ulaşabilirsin?
                  </h2>

                  <div className="mt-7 space-y-4">
                    {business.address && (
                      <ContactCard
                        icon={
                          <MapPin className="h-4 w-4" />
                        }
                        label="Adres"
                      >
                        <span className="line-clamp-2">
                          {business.address}
                        </span>
                      </ContactCard>
                    )}

                    {business.phone && (
                      <ContactCard
                        href={`tel:${business.phone}`}
                        icon={
                          <Phone className="h-4 w-4" />
                        }
                        label="Telefon"
                      >
                        {business.phone}
                      </ContactCard>
                    )}

                    {business.email && (
                      <ContactCard
                        href={`mailto:${business.email}`}
                        icon={
                          <Mail className="h-4 w-4" />
                        }
                        label="E-posta"
                      >
                        {business.email}
                      </ContactCard>
                    )}

                    {!business.address &&
                      !business.phone &&
                      !business.email && (
                        <p className="text-sm leading-7 text-slate-500">
                          İşletme henüz iletişim ve
                          adres bilgilerini paylaşmamış.
                        </p>
                      )}

                    {business.city && (
                      <div className="pt-2">
                        <Badge className="border border-white bg-white/80 px-3.5 py-2 text-xs font-bold text-indigo-600 shadow-sm hover:bg-white">
                          <MapPin className="mr-1.5 h-3.5 w-3.5" />
                          {business.city}
                          {business.country
                            ? `, ${business.country}`
                            : ""}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Card className="rounded-[1.75rem] border-white/80 bg-white/80 shadow-sm backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 via-white to-violet-100">
                      <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                          <MapPin className="h-6 w-6" />
                        </div>

                        <div className="mt-4 text-sm font-bold text-slate-900">
                          {business.city ||
                            "İşletme konumu"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Harita entegrasyonu sonraki
                          aşamada burada gösterilecek.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* CTA */}
          {/* ================================================= */}

          <section className="px-5 pb-16 sm:px-8 lg:pb-20">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-indigo-600 px-7 py-10 shadow-[0_24px_70px_rgba(79,70,229,0.18)] sm:px-10 sm:py-12 lg:px-14">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                    Hazır olduğunda
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
                    Randevunu şimdi oluştur.
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
                    Hizmetini seç, uygun zamanı bul ve
                    birkaç adımda randevunu tamamla.
                  </p>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="shrink-0 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-600 transition-all hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-lg"
                >
                  <a href="#booking">
                    Randevu al
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <footer className="border-t border-indigo-100 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
              <Link
                href="/"
                className="flex items-center gap-3 font-bold text-slate-950"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-sm">
                  O
                </span>

                <div>
                  <div className="text-sm">
                    Optio
                  </div>

                  <div className="text-xs font-normal text-slate-400">
                    Randevu yönetimini sadeleştir.
                  </div>
                </div>
              </Link>

              <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-400">
                <Link
                  href="/businesses"
                  className="transition hover:text-indigo-600"
                >
                  İşletmeleri keşfet
                </Link>

                <Link
                  href="/"
                  className="transition hover:text-indigo-600"
                >
                  Ana sayfa
                </Link>
              </div>

              <span className="text-xs text-slate-400">
                © 2026 Optio
              </span>
            </div>
          </footer>
        </main>
      </TooltipProvider>
    );
  } catch {
    notFound();
  }
}