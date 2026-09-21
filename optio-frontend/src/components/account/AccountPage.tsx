"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Mail,
  Plus,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  cancelCustomerAppointment,
  getCustomerAppointments,
  getMe,
  type AuthUser,
  type CustomerAppointment,
} from "@/lib/api";

import { getAccessToken } from "@/lib/auth";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(user: AuthUser | null) {
  if (!user) {
    return "O";
  }

  const first = user.first_name?.trim().charAt(0) ?? "";
  const last = user.last_name?.trim().charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "O";
}

function getFullName(user: AuthUser | null) {
  if (!user) {
    return "Kullanıcı";
  }

  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  return fullName || "Kullanıcı";
}

function formatLongDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "---",
    };
  }

  return {
    day: new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
    }).format(date),
    month: new Intl.DateTimeFormat("tr-TR", {
      month: "short",
    })
      .format(date)
      .replace(".", ""),
  };
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "Bekliyor";

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
      return status;
  }
}

function getStatusClassName(status: string) {
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

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5" />;

    case "cancelled":
    case "canceled":
    case "no_show":
      return <XCircle className="h-3.5 w-3.5" />;

    default:
      return <Clock3 className="h-3.5 w-3.5" />;
  }
}

function isTerminalStatus(status: string) {
  return ["completed", "cancelled", "canceled", "no_show"].includes(
    status.toLowerCase(),
  );
}

function getAppointmentLocationLabel(appointment: CustomerAppointment) {
  return appointment.business_name || "İşletme";
}

function canCancelAppointment(appointment: CustomerAppointment | null) {
  if (!appointment) {
    return false;
  }

  const normalizedStatus = appointment.status.toLowerCase();

  if (
    normalizedStatus !== "pending" &&
    normalizedStatus !== "confirmed"
  ) {
    return false;
  }

  const startAt = new Date(appointment.start_at);

  return (
    !Number.isNaN(startAt.getTime()) &&
    startAt.getTime() > Date.now()
  );
}

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<CustomerAppointment | null>(null);

  const [cancelConfirmOpen, setCancelConfirmOpen] =
    useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const token = getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [userData, appointmentData] = await Promise.all([
          getMe(token),
          getCustomerAppointments(token),
        ]);

        if (cancelled) {
          return;
        }

        if (userData.role !== "customer") {
          router.replace("/dashboard");
          return;
        }

        setUser(userData);
        setAppointments(appointmentData);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Hesap bilgileri yüklenemedi.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleCancelAppointment() {
    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!selectedAppointment) {
      return;
    }

    setCancelling(true);
    setError(null);

    try {
      const updatedAppointment =
        await cancelCustomerAppointment(
          token,
          selectedAppointment.id,
        );

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === updatedAppointment.id
            ? {
                ...appointment,
                status: updatedAppointment.status,
              }
            : appointment,
        ),
      );

      setSelectedAppointment((current) =>
        current && current.id === updatedAppointment.id
          ? {
              ...current,
              status: updatedAppointment.status,
            }
          : current,
      );

      setCancelConfirmOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Randevu iptal edilemedi.",
      );
    } finally {
      setCancelling(false);
    }
  }

  const now = new Date();

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => {
          const appointmentDate = new Date(appointment.start_at);

          return (
            !Number.isNaN(appointmentDate.getTime()) &&
            appointmentDate >= now &&
            !isTerminalStatus(appointment.status)
          );
        })
        .sort(
          (a, b) =>
            new Date(a.start_at).getTime() -
            new Date(b.start_at).getTime(),
        ),
    [appointments, now],
  );

  const pastAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => {
          const appointmentDate = new Date(appointment.start_at);

          return (
            Number.isNaN(appointmentDate.getTime()) ||
            appointmentDate < now ||
            isTerminalStatus(appointment.status)
          );
        })
        .sort(
          (a, b) =>
            new Date(b.start_at).getTime() -
            new Date(a.start_at).getTime(),
        ),
    [appointments, now],
  );

  const nextAppointment = upcomingAppointments[0] ?? null;
  const confirmedCount = appointments.filter(
    (appointment) => appointment.status.toLowerCase() === "confirmed",
  ).length;
  const completedCount = appointments.filter(
    (appointment) => appointment.status.toLowerCase() === "completed",
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8ff]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-indigo-100/80 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-72" />
                  <Skeleton className="h-4 w-96 max-w-full" />
                </div>
                <Skeleton className="h-11 w-32 rounded-xl" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className="border-indigo-100/80 shadow-sm"
                >
                  <CardHeader className="space-y-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-indigo-100/80 shadow-sm">
              <CardHeader className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-2xl" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      <section className="relative overflow-hidden border-b border-indigo-100/70 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_36%),radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.06),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-indigo-100 bg-indigo-50">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Hesabım
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      Hoş geldin, {user?.first_name || "Kullanıcı"}
                    </h1>
                    <Sparkles className="h-5 w-5 text-violet-500" />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {user?.email || "E-posta bilgisi yok"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>Randevularını tek yerden yönet.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        {error && (
          <Card className="mb-7 border-red-100 bg-red-50/80 shadow-none">
            <CardContent className="flex items-center gap-3 p-4 text-sm font-medium text-red-700">
              <XCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-indigo-100/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-indigo-100 bg-indigo-50/70 text-indigo-600"
                >
                  Yaklaşan
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {upcomingAppointments.length}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                yaklaşan randevun
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-100/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-violet-100 bg-violet-50/70 text-violet-600"
                >
                  Onaylı
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {confirmedCount}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                onaylanmış randevun
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <History className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-100 bg-emerald-50/70 text-emerald-600"
                >
                  Geçmiş
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {completedCount}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                tamamlanan randevun
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8">
          <Card className="overflow-hidden border-indigo-100/80 bg-white shadow-sm">
            <div className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/70 px-6 py-5 sm:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                      Sıradaki randevun
                    </p>
                  </div>

                  <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                    Gününü planlı tut, zamanını kendine ayır.
                  </h2>
                </div>

                <Badge
                  variant="outline"
                  className="w-fit border-indigo-200 bg-white/80 px-3 py-1.5 font-semibold text-indigo-700"
                >
                  {nextAppointment
                    ? formatStatus(nextAppointment.status)
                    : "Yeni randevu zamanı"}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 sm:p-7">
              {nextAppointment ? (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {(() => {
                      const date = formatShortDate(
                        nextAppointment.start_at,
                      );

                      return (
                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-700">
                          <span className="text-2xl font-bold leading-none">
                            {date.day}
                          </span>
                          <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em]">
                            {date.month}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-bold text-slate-950">
                        {nextAppointment.service_name || "Randevu"}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatLongDate(nextAppointment.start_at)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          {formatTime(nextAppointment.start_at)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="font-semibold text-slate-800">
                          {getAppointmentLocationLabel(nextAppointment)}
                        </span>

                        {nextAppointment.employee_name && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                              {nextAppointment.employee_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAppointment(nextAppointment)
                      }
                      className={buttonVariants({
                        variant: "outline",
                        className:
                          "h-10 rounded-xl border-indigo-100 px-4 font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
                      })}
                    >
                      Detayları gör
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center sm:flex-row sm:text-left">
                  <div>
                    <h3 className="text-lg font-bold">
                      Henüz yaklaşan bir randevun yok.
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Kendin için biraz zaman ayır ve yeni bir randevu keşfet.
                    </p>
                  </div>

                  <Link
                    href="/"
                    className={buttonVariants({
                      className:
                        "h-10 shrink-0 rounded-xl bg-indigo-600 px-4 font-semibold text-white hover:bg-indigo-700",
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Randevu keşfet
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Randevularım
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Yaklaşan randevular
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Önündeki randevuları hızlıca kontrol et.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Yeni randevu oluştur
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6">
            {upcomingAppointments.length === 0 ? (
              <Card className="border-indigo-100/80 bg-white shadow-sm">
                <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">
                    Takviminde yaklaşan randevu yok.
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Yeni bir işletme keşfet ve sana uygun zamanı seç.
                  </p>
                  <Link
                    href="/"
                    className={buttonVariants({
                      className:
                        "mt-6 h-10 rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700",
                    })}
                  >
                    İşletmeleri keşfet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcomingAppointments.map((appointment, index) => {
                  const date = formatShortDate(appointment.start_at);

                  return (
                    <Card
                      key={appointment.id}
                      className={`border-indigo-100/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        index === 0
                          ? "ring-1 ring-indigo-100"
                          : ""
                      }`}
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex gap-4">
                          <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 py-3 text-indigo-700">
                            <span className="text-xl font-bold leading-none">
                              {date.day}
                            </span>
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                              {date.month}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h3 className="truncate text-lg font-bold text-slate-950">
                                  {appointment.service_name || "Randevu"}
                                </h3>

                                <p className="mt-1 truncate text-sm font-medium text-slate-500">
                                  {getAppointmentLocationLabel(
                                    appointment,
                                  )}
                                </p>
                              </div>

                              <Badge
                                variant="outline"
                                className={`w-fit shrink-0 gap-1.5 ${getStatusClassName(
                                  appointment.status,
                                )}`}
                              >
                                {getStatusIcon(appointment.status)}
                                {formatStatus(appointment.status)}
                              </Badge>
                            </div>

                            <Separator className="my-4 bg-indigo-50" />

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                                <Clock3 className="h-4 w-4 text-indigo-500" />
                                {formatTime(appointment.start_at)}
                              </span>

                              {appointment.employee_name && (
                                <span className="inline-flex items-center gap-1.5 text-slate-500">
                                  <UserRound className="h-4 w-4 text-slate-400" />
                                  {appointment.employee_name}
                                </span>
                              )}
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                              <span className="text-xs text-slate-400">
                                {formatDateTime(appointment.start_at)}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAppointment(appointment)
                                }
                                className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                              >
                                Detay
                                <ArrowRight className="ml-1.5 h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Geçmiş
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Geçmiş randevular
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Daha önce oluşturduğun randevuların özeti.
            </p>
          </div>

          <div className="mt-6">
            {pastAppointments.length === 0 ? (
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-7 text-sm text-slate-500">
                  Henüz geçmiş randevun bulunmuyor.
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-indigo-100/80 bg-white shadow-sm">
                <div className="divide-y divide-indigo-50">
                  {pastAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => setSelectedAppointment(appointment)}
                      className="group flex w-full flex-col gap-4 p-5 text-left transition hover:bg-indigo-50/40 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <History className="h-4.5 w-4.5" />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">
                            {appointment.service_name || "Randevu"}
                          </div>

                          <div className="mt-1 truncate text-sm text-slate-500">
                            {getAppointmentLocationLabel(appointment)}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4 sm:text-right">
                        <div>
                          <div className="text-sm font-semibold text-slate-700">
                            {formatDateTime(appointment.start_at)}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {appointment.employee_name || "Çalışan belirtilmemiş"}
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`gap-1.5 ${getStatusClassName(
                            appointment.status,
                          )}`}
                        >
                          {getStatusIcon(appointment.status)}
                          {formatStatus(appointment.status)}
                        </Badge>

                        <ArrowRight className="hidden h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500 sm:block" />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </section>

        <section className="mt-12">
          <Card className="overflow-hidden border-indigo-100/70 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-100">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">
                  OPTIO
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Kendine zaman ayır.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
                  Yeni bir işletme keşfet, hizmetini seç ve sana uygun zamanı
                  birkaç adımda planla.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-950/10 transition hover:bg-indigo-50"
              >
                Yeni randevu al
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-12 border-t border-indigo-100/70 py-8">
          <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <Link
              href="/"
              className="font-bold text-slate-950"
            >
              Optio
            </Link>

            <span>Planını yap. Zamanını kendine ayır.</span>

            <span>© 2026 Optio</span>
          </div>
        </footer>
      </section>

      <Dialog
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAppointment(null);
            setCancelConfirmOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-lg border-indigo-100 bg-white sm:rounded-3xl">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <DialogTitle className="text-xl sm:text-2xl">
                  {selectedAppointment.service_name || "Randevu detayı"}
                </DialogTitle>

                <DialogDescription>
                  {getAppointmentLocationLabel(selectedAppointment)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                      Tarih
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {formatLongDate(selectedAppointment.start_at)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500">
                      Saat
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {formatTime(selectedAppointment.start_at)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        İşletme
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {getAppointmentLocationLabel(selectedAppointment)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Çalışan
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedAppointment.employee_name ||
                          "Belirtilmemiş"}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAppointment.customer_note && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">
                      Notun
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {selectedAppointment.customer_note}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-white p-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Durum
                    </div>

                    <Badge
                      variant="outline"
                      className={`mt-2 gap-1.5 ${getStatusClassName(
                        selectedAppointment.status,
                      )}`}
                    >
                      {getStatusIcon(selectedAppointment.status)}
                      {formatStatus(selectedAppointment.status)}
                    </Badge>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Bitiş
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-700">
                      {formatTime(selectedAppointment.end_at)}
                    </div>
                  </div>
                </div>
              </div>

              {cancelConfirmOpen && canCancelAppointment(selectedAppointment) && (
                <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <XCircle className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        Randevuyu iptal etmek istediğine emin misin?
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Bu işlem randevunun durumunu “İptal edildi” olarak güncelleyecek.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => setCancelConfirmOpen(false)}
                      className={buttonVariants({
                        variant: "outline",
                        className:
                          "h-10 rounded-xl border-slate-200 px-4 font-semibold",
                      })}
                    >
                      Vazgeç
                    </button>

                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={handleCancelAppointment}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancelling ? "İptal ediliyor..." : "Evet, iptal et"}
                    </button>
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                {canCancelAppointment(selectedAppointment) && !cancelConfirmOpen && (
                  <button
                    type="button"
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={cancelling}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Randevuyu iptal et
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className={buttonVariants({
                    variant: "outline",
                    className:
                      "h-10 rounded-xl border-slate-200 px-4 font-semibold",
                  })}
                >
                  Kapat
                </button>

                <Link
                  href="/"
                  onClick={() => setSelectedAppointment(null)}
                  className={buttonVariants({
                    className:
                      "h-10 rounded-xl bg-indigo-600 px-4 font-semibold text-white hover:bg-indigo-700",
                  })}
                >
                  Yeni randevu
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
