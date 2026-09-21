"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MessageSquareText,
  Scissors,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  createPublicAppointment,
  getPublicAvailability,
  getPublicEmployees,
  type PublicAvailability,
  type PublicEmployee,
  type PublicService,
} from "@/lib/api";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface BookingFlowProps {
  slug: string;
  businessTimezone: string;
  services: PublicService[];
}

type BookingStep = 1 | 2 | 3 | 4;

interface BookingResult {
  appointment_id: string;
  business_name: string;
  customer_name: string;
  service_name: string;
  employee_name: string;
  start_at: string;
  end_at: string;
  status: string;
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDayName(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
  }).format(date);
}

function formatMonthName(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function formatReadableDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function localDateTimeToISO(
  date: string,
  time: string,
  timezone: string,
): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const wallClockAsUTC = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
  );

  const guess = new Date(wallClockAsUTC);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);

  const getPart = (type: string) =>
    Number(
      parts.find(
        (part) => part.type === type,
      )?.value ?? 0,
    );

  const timezoneRepresentation = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
  );

  const offset =
    timezoneRepresentation - wallClockAsUTC;

  return new Date(
    wallClockAsUTC - offset,
  ).toISOString();
}

function formatStatus(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "Onaylandı";

    case "completed":
      return "Tamamlandı";

    case "cancelled":
    case "canceled":
      return "İptal edildi";

    case "no_show":
      return "Gelmedi";

    default:
      return "Bekliyor";
  }
}

function statusClassName(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";

    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "cancelled":
    case "canceled":
    case "no_show":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function BookingFlow({
  slug,
  businessTimezone,
  services,
}: BookingFlowProps) {
  const [step, setStep] =
    useState<BookingStep>(1);

  const [selectedService, setSelectedService] =
    useState<PublicService | null>(null);

  const [employees, setEmployees] =
    useState<PublicEmployee[]>([]);

  const [selectedEmployee, setSelectedEmployee] =
    useState<PublicEmployee | null>(null);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [availability, setAvailability] =
    useState<PublicAvailability | null>(null);

  const [selectedSlot, setSelectedSlot] =
    useState<string | null>(null);

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [customerNote, setCustomerNote] =
    useState("");

  const [loadingEmployees, setLoadingEmployees] =
    useState(false);

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [booking, setBooking] =
    useState(false);

  const [bookingResult, setBookingResult] =
    useState<BookingResult | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const today = useMemo(
    () => new Date(),
    [],
  );

  const selectableDates = useMemo(
    () =>
      Array.from(
        { length: 14 },
        (_, index) => {
          const date = new Date(today);

          date.setDate(
            today.getDate() + index,
          );

          return date;
        },
      ),
    [today],
  );

  const steps = [
    {
      number: 1 as BookingStep,
      title: "Hizmet",
      description: "Ne yaptırmak istiyorsun?",
      icon: Scissors,
    },
    {
      number: 2 as BookingStep,
      title: "Tarih & Saat",
      description: "Sana uygun zamanı seç.",
      icon: CalendarDays,
    },
    {
      number: 3 as BookingStep,
      title: "Bilgilerin",
      description: "Randevunu tamamla.",
      icon: UserRound,
    },
    {
      number: 4 as BookingStep,
      title: "Onay",
      description: "Randevun hazır.",
      icon: CheckCircle2,
    },
  ];

  async function selectService(
    service: PublicService,
  ) {
    setSelectedService(service);
    setSelectedEmployee(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setAvailability(null);
    setError(null);
    setLoadingEmployees(true);

    try {
      const result =
        await getPublicEmployees(
          slug,
          service.id,
        );

      setEmployees(result);

      if (!result.length) {
        setError(
          "Bu hizmet için uygun çalışan bulunamadı.",
        );
        return;
      }

      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Çalışanlar yüklenemedi.",
      );
    } finally {
      setLoadingEmployees(false);
    }
  }

  function selectEmployee(
    employee: PublicEmployee,
  ) {
    setSelectedEmployee(employee);
    setSelectedDate("");
    setSelectedSlot(null);
    setAvailability(null);
    setError(null);
  }

  async function selectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setAvailability(null);
    setError(null);

    if (
      !selectedService ||
      !selectedEmployee
    ) {
      return;
    }

    setLoadingAvailability(true);

    try {
      const result =
        await getPublicAvailability(
          slug,
          selectedService.id,
          selectedEmployee.id,
          date,
        );

      setAvailability(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Müsait saatler yüklenemedi.",
      );
    } finally {
      setLoadingAvailability(false);
    }
  }

  function continueFromDateTime() {
    if (
      !selectedDate ||
      !selectedSlot
    ) {
      setError(
        "Lütfen bir tarih ve saat seçin.",
      );

      return;
    }

    setError(null);
    setStep(3);
  }

  async function handleBooking(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedService ||
      !selectedEmployee ||
      !selectedDate ||
      !selectedSlot
    ) {
      setError(
        "Lütfen randevu bilgilerinizi tamamlayın.",
      );

      return;
    }

    if (!fullName.trim()) {
      setError(
        "Ad soyad bilgisi gerekli.",
      );

      return;
    }

    if (!phone.trim()) {
      setError(
        "Telefon numarası gerekli.",
      );

      return;
    }

    setBooking(true);
    setError(null);

    try {
      const startAt =
        localDateTimeToISO(
          selectedDate,
          selectedSlot,
          businessTimezone,
        );

      const result =
        await createPublicAppointment(
          slug,
          {
            employee_id:
              selectedEmployee.id,

            service_id:
              selectedService.id,

            start_at: startAt,

            full_name:
              fullName.trim(),

            phone:
              phone.trim(),

            email:
              email.trim() ||
              undefined,

            customer_note:
              customerNote.trim() ||
              undefined,
          },
        );

      setBookingResult(result);
      setStep(4);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Randevu oluşturulamadı.",
      );
    } finally {
      setBooking(false);
    }
  }

  function resetBooking() {
    setStep(1);
    setSelectedService(null);
    setEmployees([]);
    setSelectedEmployee(null);
    setSelectedDate("");
    setAvailability(null);
    setSelectedSlot(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setCustomerNote("");
    setBookingResult(null);
    setError(null);
  }

  function goBack() {
    setError(null);

    if (step === 2) {
      setStep(1);
      return;
    }

    if (step === 3) {
      setStep(2);
      return;
    }
  }

  return (
    <div className="w-full">
      {/* ================================================= */}
      {/* STEP HEADER */}
      {/* ================================================= */}

      <div className="mb-7">
        <div className="hidden md:block">
          <Card className="border-slate-200/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-4 divide-x divide-slate-100">
                {steps.map((item) => {
                  const Icon = item.icon;

                  const active =
                    step === item.number;

                  const completed =
                    step > item.number;

                  const clickable =
                    item.number < step;

                  return (
                    <div
                      key={item.number}
                      className="relative px-4 first:pl-1 last:pr-1"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={!clickable}
                        onClick={() => {
                          if (clickable) {
                            setStep(item.number);
                            setError(null);
                          }
                        }}
                        className={[
                          "group h-auto w-full justify-start gap-3 rounded-xl px-2 py-2.5 text-left",
                          clickable
                            ? "hover:bg-slate-50"
                            : "cursor-default opacity-100",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                            active || completed
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-[0_8px_24px_rgba(79,70,229,0.20)]"
                              : "border-slate-200 bg-white text-slate-400",
                            clickable
                              ? "group-hover:scale-105"
                              : "",
                          ].join(" ")}
                        >
                          {completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div
                            className={[
                              "text-[13px] font-bold tracking-tight",
                              active || completed
                                ? "text-slate-950"
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            {item.title}
                          </div>

                          <div
                            className={[
                              "mt-0.5 text-[11px] leading-4",
                              active || completed
                                ? "text-slate-500"
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            {item.number === 1
                              ? "Hizmetini seç"
                              : item.number === 2
                                ? "Uygun zamanı bul"
                                : item.number === 3
                                  ? "Bilgilerini tamamla"
                                  : "Randevun hazır"}
                          </div>
                        </div>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MOBILE */}

        <div className="md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                Optio · Randevu
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {steps[step - 1].title}
              </p>
            </div>

            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-600"
            >
              {String(step).padStart(2, "0")} / 04
            </Badge>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
              style={{
                width: `${step * 25}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <Card className="mb-6 border-red-100 bg-red-50/80 shadow-none">
          <CardContent className="flex items-start gap-3 p-4 text-sm font-semibold text-red-700">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs">
              !
            </span>

            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* ================================================= */}
      {/* STEP 1 — SERVICE */}
      {/* ================================================= */}

      {step === 1 && (
        <section>
          <Card className="overflow-hidden border-indigo-100/80 shadow-sm">
            <CardHeader className="bg-gradient-to-br from-white to-indigo-50/30 p-6 pb-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    variant="outline"
                    className="border-indigo-100 bg-indigo-50 text-indigo-600"
                  >
                    01 · Hizmet
                  </Badge>

                  <CardTitle className="mt-4 text-2xl tracking-tight">
                    Hizmetini seç
                  </CardTitle>

                  <CardDescription className="mt-2 max-w-xl leading-6">
                    İhtiyacına uygun hizmeti
                    seçerek başlayalım.
                  </CardDescription>
                </div>

                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm sm:flex">
                  <Scissors className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-5 sm:p-7">
              {loadingEmployees ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-indigo-100 p-5"
                    >
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <Skeleton className="mt-4 h-5 w-2/3" />
                      <Skeleton className="mt-2 h-4 w-full" />
                      <Skeleton className="mt-6 h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center text-sm text-slate-500">
                  Şu anda aktif hizmet bulunmuyor.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => {
                    const selected =
                      selectedService?.id ===
                      service.id;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() =>
                          selectService(service)
                        }
                        className={[
                          "group rounded-2xl border p-5 text-left transition-all duration-300",
                          selected
                            ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100"
                            : "border-indigo-100 bg-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_14px_35px_rgba(79,70,229,0.08)]",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div
                              className={[
                                "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                                selected
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                  : "bg-indigo-50 text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white",
                              ].join(" ")}
                            >
                              <Scissors className="h-5 w-5" />
                            </div>

                            <h3 className="mt-4 text-base font-bold text-slate-950 transition-colors group-hover:text-indigo-700">
                              {service.name}
                            </h3>

                            {service.description && (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                {service.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="font-bold text-indigo-600">
                              {service.price}{" "}
                              {service.currency}
                            </div>

                            <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                              <Clock3 className="h-3.5 w-3.5" />
                              {service.duration_minutes}{" "}
                              dk
                            </div>
                          </div>
                        </div>

                        <Separator className="my-5 bg-indigo-50" />

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-500">
                            {selected
                              ? "Seçildi"
                              : "Hizmeti seç"}
                          </span>

                          <span
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                              selected
                                ? "bg-indigo-600 text-white"
                                : "bg-indigo-50 text-indigo-600 group-hover:translate-x-1 group-hover:bg-indigo-600 group-hover:text-white",
                            ].join(" ")}
                          >
                            {selected ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ================================================= */}
      {/* STEP 2 — DATE & TIME */}
      {/* ================================================= */}

      {step === 2 && (
        <section>
          <Card className="overflow-hidden border-indigo-100/80 shadow-sm">
            <CardHeader className="bg-gradient-to-br from-white to-indigo-50/30 p-6 pb-5 sm:p-7">
              <Badge
                variant="outline"
                className="w-fit border-indigo-100 bg-indigo-50 text-indigo-600"
              >
                02 · Tarih & Saat
              </Badge>

              <CardTitle className="mt-4 text-2xl tracking-tight">
                Sana uygun zamanı seç
              </CardTitle>

              <CardDescription className="leading-6">
                Uzmanını seç, ardından uygun günü
                ve saati belirle.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 p-6 pt-6 sm:p-7">
              {selectedService && (
                <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 shadow-none">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                        Seçilen hizmet
                      </div>

                      <div className="mt-1 text-lg font-bold text-slate-950">
                        {selectedService.name}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-lg font-bold text-indigo-600">
                        {selectedService.price}{" "}
                        {selectedService.currency}
                      </div>

                      <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {selectedService.duration_minutes}{" "}
                        dakika
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* EMPLOYEE */}

              <div>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Uzmanını seç
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Bu hizmeti sunan çalışanlardan
                      birini seç.
                    </p>
                  </div>

                  <UsersRound className="h-5 w-5 text-indigo-400" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {employees.map((employee) => {
                    const selected =
                      selectedEmployee?.id ===
                      employee.id;

                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() =>
                          selectEmployee(employee)
                        }
                        className={[
                          "group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300",
                          selected
                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                            : "border-indigo-100 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                            selected
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                              : "bg-indigo-50 text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white",
                          ].join(" ")}
                        >
                          {employee.first_name
                            .charAt(0)
                            .toUpperCase()}

                          {employee.last_name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
                            {employee.display_name}
                          </div>

                          <div className="mt-1 text-xs font-medium text-slate-500">
                            {selected
                              ? "Uzman seçildi"
                              : "Seçmek için dokun"}
                          </div>
                        </div>

                        {selected && (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DATE */}

              {selectedEmployee && (
                <div>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Tarih seç
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Önümüzdeki 14 gün içinden
                        seçim yap.
                      </p>
                    </div>

                    {selectedDate && (
                      <Badge
                        variant="outline"
                        className="border-indigo-100 bg-indigo-50 text-indigo-600"
                      >
                        {formatReadableDate(
                          selectedDate,
                        )}
                      </Badge>
                    )}
                  </div>

                  <div className="-mx-1 overflow-x-auto px-1 pb-2">
                    <div className="flex min-w-max gap-2">
                      {selectableDates.map((date) => {
                        const dateKey =
                          getDateKey(date);

                        const selected =
                          selectedDate ===
                          dateKey;

                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() =>
                              selectDate(
                                dateKey,
                              )
                            }
                            className={[
                              "group flex w-[74px] flex-col items-center rounded-2xl border px-3 py-3 transition-all duration-300",
                              selected
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                : "border-indigo-100 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "text-[11px] font-bold uppercase",
                                selected
                                  ? "text-indigo-100"
                                  : "text-slate-400 group-hover:text-indigo-500",
                              ].join(" ")}
                            >
                              {formatDayName(
                                date,
                              )}
                            </span>

                            <span className="mt-1 text-2xl font-bold">
                              {date.getDate()}
                            </span>

                            <span
                              className={[
                                "mt-0.5 text-[11px] font-semibold",
                                selected
                                  ? "text-indigo-100"
                                  : "text-slate-400 group-hover:text-indigo-500",
                              ].join(" ")}
                            >
                              {formatMonthName(
                                date,
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SLOTS */}

              {selectedDate && (
                <div>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Müsait saatler
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Randevu süresini karşılayan
                        uygun başlangıç saatleri.
                      </p>
                    </div>

                    {availability && (
                      <Badge
                        variant="outline"
                        className="border-indigo-100 bg-indigo-50 text-indigo-600"
                      >
                        {availability.slots.length}{" "}
                        uygun
                      </Badge>
                    )}
                  </div>

                  {loadingAvailability ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({
                        length: 8,
                      }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="h-11 rounded-xl"
                        />
                      ))}
                    </div>
                  ) : !availability ||
                    availability.slots
                      .length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center text-sm text-slate-500">
                      Bu tarih için müsait saat
                      bulunmuyor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {availability.slots.map(
                        (slot) => {
                          const selected =
                            selectedSlot ===
                            slot;

                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() =>
                                setSelectedSlot(
                                  slot,
                                )
                              }
                              className={[
                                "rounded-xl border px-3 py-3 text-sm font-bold transition-all duration-300",
                                selected
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                  : "border-indigo-100 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50",
                              ].join(" ")}
                            >
                              {slot.slice(
                                0,
                                5,
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-indigo-50 pt-5 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="h-11 rounded-xl border-indigo-100 px-5 font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button
                  type="button"
                  onClick={
                    continueFromDateTime
                  }
                  disabled={
                    !selectedDate ||
                    !selectedSlot
                  }
                  className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Devam et
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ================================================= */}
      {/* STEP 3 — CUSTOMER INFO */}
      {/* ================================================= */}

      {step === 3 && (
        <section>
          <Card className="overflow-hidden border-indigo-100/80 shadow-sm">
            <CardHeader className="bg-gradient-to-br from-white to-indigo-50/30 p-6 pb-5 sm:p-7">
              <Badge
                variant="outline"
                className="w-fit border-indigo-100 bg-indigo-50 text-indigo-600"
              >
                03 · Bilgilerin
              </Badge>

              <CardTitle className="mt-4 text-2xl tracking-tight">
                Randevunu tamamla
              </CardTitle>

              <CardDescription className="leading-6">
                İletişim bilgilerini girerek
                randevunu oluştur.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-6 sm:p-7">
              {/* SUMMARY */}

              <Card className="mb-7 border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-none">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                      Hizmet
                    </div>

                    <div className="mt-1 font-bold text-slate-950">
                      {selectedService?.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-violet-500">
                      Uzman
                    </div>

                    <div className="mt-1 font-bold text-slate-950">
                      {selectedEmployee?.display_name}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">
                      Tarih & Saat
                    </div>

                    <div className="mt-1 font-bold text-slate-950">
                      {formatReadableDate(
                        selectedDate,
                      )}{" "}
                      ·{" "}
                      {selectedSlot?.slice(
                        0,
                        5,
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <form
                onSubmit={handleBooking}
                className="space-y-5"
              >
                {/* NAME */}

                <div>
                  <label
                    htmlFor="booking-full-name"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                  >
                    <UserRound className="h-4 w-4 text-indigo-500" />
                    Ad Soyad
                  </label>

                  <Input
                    id="booking-full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value,
                      )
                    }
                    placeholder="Adınız ve soyadınız"
                    autoComplete="name"
                    maxLength={150}
                    required
                    className="h-12 rounded-xl border-indigo-100 bg-white shadow-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="booking-phone"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                  >
                    <UsersRound className="h-4 w-4 text-indigo-500" />
                    Telefon
                  </label>

                  <Input
                    id="booking-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value,
                      )
                    }
                    placeholder="+90 532 123 45 67"
                    autoComplete="tel"
                    maxLength={30}
                    required
                    className="h-12 rounded-xl border-indigo-100 bg-white shadow-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="booking-email"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                  >
                    <Mail className="h-4 w-4 text-indigo-500" />
                    E-posta

                    <span className="font-normal text-slate-400">
                      (opsiyonel)
                    </span>
                  </label>

                  <Input
                    id="booking-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="ornek@email.com"
                    autoComplete="email"
                    maxLength={255}
                    className="h-12 rounded-xl border-indigo-100 bg-white shadow-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* NOTE */}

                <div>
                  <label
                    htmlFor="booking-note"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                  >
                    <MessageSquareText className="h-4 w-4 text-indigo-500" />
                    Not

                    <span className="font-normal text-slate-400">
                      (opsiyonel)
                    </span>
                  </label>

                  <Textarea
                    id="booking-note"
                    value={customerNote}
                    onChange={(event) =>
                      setCustomerNote(
                        event.target.value,
                      )
                    }
                    placeholder="İşletmenin bilmesini istediğiniz bir not var mı?"
                    rows={4}
                    maxLength={2000}
                    className="min-h-28 resize-none rounded-xl border-indigo-100 bg-white shadow-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-indigo-50 pt-5 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="h-11 rounded-xl border-indigo-100 px-5 font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Geri
                  </Button>

                  <Button
                    type="submit"
                    disabled={booking}
                    className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {booking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Randevu oluşturuluyor...
                      </>
                    ) : (
                      <>
                        Randevuyu oluştur
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ================================================= */}
      {/* STEP 4 — SUCCESS */}
      {/* ================================================= */}

      {step === 4 && bookingResult && (
        <section className="py-2">
          <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.09)]">
            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              {/* LEFT */}

              <div className="relative overflow-hidden bg-[#12142b] px-7 py-9 text-white sm:px-10 sm:py-11">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />

                <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_25%),linear-gradient(135deg,rgba(79,70,229,0.02),rgba(124,58,237,0.18))]" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-white/60">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>

                      OPTIO
                    </div>

                    <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                      {formatStatus(
                        bookingResult.status,
                      )}
                    </Badge>
                  </div>

                  <div className="mt-16">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-200">
                      Randevu oluşturuldu
                    </p>

                    <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                      Kendine zaman ayır.
                    </h2>

                    <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
                      Randevun başarıyla
                      oluşturuldu. Aşağıdaki bilgileri
                      saklayabilirsin.
                    </p>
                  </div>

                  <div className="mt-12 flex items-center gap-3 text-xs text-white/45">
                    <Sparkles className="h-4 w-4 text-indigo-300" />
                    Planını Optio ile oluştur.
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <CardContent className="p-7 sm:p-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                      Randevu özeti
                    </p>

                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      Her şey hazır.
                    </h3>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>

                <Separator className="my-7 bg-slate-100" />

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Scissors className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        Hizmet
                      </p>

                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {bookingResult.service_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <UserRound className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        Uzman
                      </p>

                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {bookingResult.employee_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Clock3 className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        Tarih & Saat
                      </p>

                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {formatDateTime(
                          bookingResult.start_at,
                        )}
                      </p>
                    </div>
                  </div>

                  <Card className="border-slate-200 bg-slate-50 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                            Randevu numarası
                          </p>

                          <p className="mt-2 break-all font-mono text-xs font-medium text-slate-600">
                            {bookingResult.appointment_id}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={`shrink-0 ${statusClassName(
                            bookingResult.status,
                          )}`}
                        >
                          {formatStatus(
                            bookingResult.status,
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-9 grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetBooking}
                    className="h-11 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700"
                  >
                    Yeni randevu
                  </Button>

                  <Button
                    type="button"
                    onClick={resetBooking}
                    className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                  >
                    Tamam
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}