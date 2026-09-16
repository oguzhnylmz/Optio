"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  createPublicAppointment,
  getPublicAvailability,
  getPublicEmployees,
  type PublicAvailability,
  type PublicEmployee,
  type PublicService,
} from "@/lib/api";

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
  }).format(date);
}

function localDateTimeToISO(
  date: string,
  time: string,
  timezone: string,
): string {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  const [hour, minute] = time
    .split(":")
    .map(Number);

  const wallClockAsUTC = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
  );

  const guess = new Date(wallClockAsUTC);

  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
  ).formatToParts(guess);

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

  const utcTimestamp =
    wallClockAsUTC - offset;

  return new Date(utcTimestamp).toISOString();
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

  const [employees, setEmployees] = useState<
    PublicEmployee[]
  >([]);

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

  const selectableDates = useMemo(() => {
    return Array.from(
      { length: 14 },
      (_, index) => {
        const date = new Date(today);
        date.setDate(
          today.getDate() + index,
        );
        return date;
      },
    );
  }, [today]);

  const steps = [
    {
      number: 1,
      title: "Hizmet Seç",
    },
    {
      number: 2,
      title: "Tarih & Saat",
    },
    {
      number: 3,
      title: "Bilgilerin",
    },
    {
      number: 4,
      title: "Onay",
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

      if (result.length === 0) {
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

  async function selectDate(
    date: string,
  ) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setAvailability(null);
    setError(null);

    if (
      !selectedService ||
      !selectedEmployee ||
      !date
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
    if (!selectedDate || !selectedSlot) {
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

  function formatAppointmentDate(
    value: string,
  ) {
    return new Intl.DateTimeFormat(
      "tr-TR",
      {
        dateStyle: "long",
        timeStyle: "short",
      },
    ).format(new Date(value));
  }

  return (
    <div className="w-full">
      {/* STEPPER */}
      <div className="mb-9">
        <div className="hidden items-center md:flex">
  {steps.map((item, index) => {
    const completed =
      step > item.number;

    const active =
      step === item.number;

    const clickable =
      item.number < step;

    return (
      <div
        key={item.number}
        className="flex min-w-0 flex-1 items-center"
      >
        <button
          type="button"
          disabled={!clickable}
          onClick={() => {
            if (clickable) {
              setStep(
                item.number as BookingStep,
              );
              setError(null);
            }
          }}
          className={[
            "flex min-w-0 items-center gap-3 rounded-xl text-left transition",
            clickable
              ? "cursor-pointer hover:bg-indigo-50"
              : "cursor-default",
            "px-1.5 py-1",
          ].join(" ")}
        >
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
              completed || active
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                : "border border-indigo-100 bg-white text-slate-400",
            ].join(" ")}
          >
            {completed
              ? "✓"
              : item.number}
          </div>

          <span
            className={[
              "truncate text-sm font-bold",
              completed || active
                ? "text-slate-900"
                : "text-slate-400",
            ].join(" ")}
          >
            {item.title}
          </span>
        </button>

        {index <
          steps.length - 1 && (
          <div
            className={[
              "mx-4 h-px flex-1",
              completed
                ? "bg-indigo-300"
                : "bg-indigo-100",
            ].join(" ")}
          />
        )}
      </div>
    );
  })}
</div>

        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
              Adım {step} / 4
            </span>

            <span className="text-sm font-bold text-slate-700">
              {steps[step - 1].title}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-50">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${step * 25}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <section>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              01
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Hizmetini seç
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              İhtiyacına uygun hizmeti seçerek başlayalım.
            </p>
          </div>

          {loadingEmployees ? (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm font-medium text-slate-500">
              Çalışanlar yükleniyor...
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-indigo-100 bg-slate-50 p-6 text-sm text-slate-500">
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
                      "group rounded-2xl border bg-white p-5 text-left transition duration-200",
                      selected
                        ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100"
                        : "border-indigo-100 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                          ✨
                        </div>

                        <h3 className="mt-4 text-base font-bold text-slate-950">
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

                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          {service.duration_minutes} dk
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-500">
                        {selected
                          ? "Seçildi"
                          : "Hizmeti seç"}
                      </span>

                      <span className="text-indigo-600 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              02
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Tarih & saat seç
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Uzmanını seç, ardından sana uygun günü ve saati belirle.
            </p>
          </div>

          {/* SERVICE SUMMARY */}
          {selectedService && (
            <div className="mb-7 flex items-center justify-between rounded-2xl bg-indigo-50 p-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Hizmet
                </div>

                <div className="mt-1 font-bold text-slate-950">
                  {selectedService.name}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-indigo-600">
                  {selectedService.price}{" "}
                  {selectedService.currency}
                </div>

                <div className="text-xs font-semibold text-slate-400">
                  {selectedService.duration_minutes} dk
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEE */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-800">
              Uzmanını seç
            </label>

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
                      "flex items-center gap-4 rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-indigo-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/50",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        selected
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 text-indigo-600",
                      ].join(" ")}
                    >
                      {employee.first_name
                        .charAt(0)
                        .toUpperCase()}
                      {employee.last_name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">
                        {employee.display_name}
                      </div>

                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {selected
                          ? "Uzman seçildi"
                          : "Uzmanı seç"}
                      </div>
                    </div>

                    {selected && (
                      <span className="ml-auto text-sm font-bold text-indigo-600">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DATE PICKER */}
          {selectedEmployee && (
            <div className="mt-9">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Tarih seç
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Önümüzdeki günlerden birini seç.
                  </p>
                </div>

                {selectedDate && (
                  <span className="text-xs font-bold text-indigo-600">
                    {new Intl.DateTimeFormat(
                      "tr-TR",
                      {
                        dateStyle: "medium",
                      },
                    ).format(
                      new Date(
                        `${selectedDate}T12:00:00`,
                      ),
                    )}
                  </span>
                )}
              </div>

              <div className="-mx-1 overflow-x-auto px-1 pb-2">
                <div className="flex min-w-max gap-2">
                  {selectableDates.map(
                    (date) => {
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
                            "flex w-[72px] flex-col items-center rounded-2xl border px-3 py-3 transition",
                            selected
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                              : "border-indigo-100 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "text-[11px] font-bold uppercase",
                              selected
                                ? "text-indigo-100"
                                : "text-slate-400",
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
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            {formatMonthName(
                              date,
                            )}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SLOTS */}
          {selectedDate && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Müsait saatler
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Randevu süresine göre uygun saatler.
                  </p>
                </div>

                {availability && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
                    {availability.slots.length} uygun
                  </span>
                )}
              </div>

              {loadingAvailability ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm font-medium text-slate-500">
                  Müsait saatler yükleniyor...
                </div>
              ) : !availability ||
                availability.slots.length === 0 ? (
                <div className="rounded-2xl border border-indigo-100 bg-slate-50 p-5 text-sm text-slate-500">
                  Bu tarih için müsait saat bulunmuyor.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                            "rounded-xl border px-3 py-3 text-sm font-bold transition",
                            selected
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                              : "border-indigo-100 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50",
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
          <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="rounded-xl border border-indigo-100 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:text-slate-900"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={continueFromDateTime}
              disabled={
                !selectedDate ||
                !selectedSlot
              }
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Devam Et
              <span className="ml-2">→</span>
            </button>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              03
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Bilgilerin
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Randevunu tamamlamak için iletişim bilgilerini gir.
            </p>
          </div>

          {/* BOOKING SUMMARY */}
          <div className="mb-7 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Hizmet
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {selectedService?.name}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-violet-500">
                  Uzman
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {selectedEmployee?.display_name}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-500">
                  Tarih & Saat
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {selectedDate} ·{" "}
                  {selectedSlot?.slice(
                    0,
                    5,
                  )}
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleBooking}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="full-name"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Ad Soyad
              </label>

              <input
                id="full-name"
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
                className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Telefon
              </label>

              <input
                id="phone"
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
                className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                E-posta{" "}
                <span className="font-normal text-slate-400">
                  (opsiyonel)
                </span>
              </label>

              <input
                id="email"
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
                className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="customer-note"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Not{" "}
                <span className="font-normal text-slate-400">
                  (opsiyonel)
                </span>
              </label>

              <textarea
                id="customer-note"
                value={customerNote}
                onChange={(event) =>
                  setCustomerNote(
                    event.target.value,
                  )
                }
                placeholder="İşletmenin bilmesini istediğiniz bir not var mı?"
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-indigo-100 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setError(null);
                }}
                className="rounded-xl border border-indigo-100 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200"
              >
                ← Geri
              </button>

              <button
                type="submit"
                disabled={booking}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {booking
                  ? "Randevu oluşturuluyor..."
                  : "Randevuyu oluştur →"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 &&
        bookingResult && (
          <section className="py-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-3xl font-bold text-white shadow-[0_15px_35px_rgba(79,70,229,0.25)]">
              ✓
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Randevu oluşturuldu
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Randevunuz hazır.
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Randevu talebiniz başarıyla oluşturuldu.
            </p>

            <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 text-left">
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Hizmet
                  </div>

                  <div className="mt-1 text-lg font-bold text-slate-950">
                    {bookingResult.service_name}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Uzman
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {bookingResult.employee_name}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Tarih & Saat
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {formatAppointmentDate(
                      bookingResult.start_at,
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Durum
                  </div>

                  <span className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold capitalize text-amber-700">
                    {bookingResult.status}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Onay numarası
                  </div>

                  <div className="mt-1 break-all font-mono text-xs text-slate-500">
                    {bookingResult.appointment_id}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetBooking}
              className="mt-8 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Yeni randevu oluştur
            </button>
          </section>
        )}
    </div>
  );
}