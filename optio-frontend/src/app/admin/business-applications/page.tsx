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
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import {
  approveAdminBusinessApplication,
  getAdminBusinessApplications,
  getMe,
  rejectAdminBusinessApplication,
  type AdminBusinessApplication,
  type AuthUser,
  type BusinessApplicationStatus,
} from "@/lib/api";

import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";

import { Skeleton } from "@/components/ui/skeleton";

import { Textarea } from "@/components/ui/textarea";

type Filter =
  | "all"
  | BusinessApplicationStatus;

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(
  status: BusinessApplicationStatus,
) {
  switch (status) {
    case "pending":
      return "Bekliyor";

    case "approved":
      return "Onaylandı";

    case "rejected":
      return "Reddedildi";
  }
}

function getStatusClass(
  status: BusinessApplicationStatus,
) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function getInitials(
  firstName: string,
  lastName: string,
) {
  return `${firstName.charAt(0)}${lastName.charAt(
    0,
  )}`.toUpperCase();
}

/* ========================================================= */
/* INFO ITEM */
/* ========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {label}
          </div>

          <div className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* PAGE */
/* ========================================================= */

export default function AdminBusinessApplicationsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [applications, setApplications] =
    useState<AdminBusinessApplication[]>(
      [],
    );

  const [authorized, setAuthorized] =
    useState<boolean | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<Filter>("all");

  const [search, setSearch] =
    useState("");

  const [
    selectedApplication,
    setSelectedApplication,
  ] =
    useState<AdminBusinessApplication | null>(
      null,
    );

  const [rejectMode, setRejectMode] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  /* ======================================================= */
  /* LOAD */
/* ======================================================= */

  async function loadApplications(
    showRefresh = false,
  ) {
    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const currentUser =
        await getMe(token);

      setUser(currentUser);

      const data =
        await getAdminBusinessApplications(
          token,
        );

      setApplications(data);
      setAuthorized(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Başvurular yüklenemedi.";

      const normalized =
        message.toLowerCase();

      if (
        normalized.includes("admin") ||
        normalized.includes("forbidden") ||
        normalized.includes("permission")
      ) {
        setAuthorized(false);
        setApplications([]);
        return;
      }

      if (
        normalized.includes(
          "authentication",
        ) ||
        normalized.includes(
          "credentials",
        ) ||
        normalized.includes("token")
      ) {
        clearAccessToken();
        router.replace("/login");
        return;
      }

      setAuthorized(false);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  /* ======================================================= */
  /* FILTERED APPLICATIONS */
/* ======================================================= */

  const filteredApplications =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return applications.filter(
        (application) => {
          const matchesFilter =
            filter === "all" ||
            application.status === filter;

          if (!matchesFilter) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          return [
            application.business_name,
            application.first_name,
            application.last_name,
            application.email,
            application.phone,
            application.city,
            application.district,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ),
            );
        },
      );
    }, [
      applications,
      filter,
      search,
    ]);

  /* ======================================================= */
  /* STATS */
/* ======================================================= */

  const stats = useMemo(() => {
    return {
      total: applications.length,

      pending:
        applications.filter(
          (item) =>
            item.status === "pending",
        ).length,

      approved:
        applications.filter(
          (item) =>
            item.status === "approved",
        ).length,

      rejected:
        applications.filter(
          (item) =>
            item.status === "rejected",
        ).length,
    };
  }, [applications]);

  /* ======================================================= */
  /* DETAIL */
/* ======================================================= */

  function openApplication(
    application: AdminBusinessApplication,
  ) {
    setSelectedApplication(
      application,
    );

    setRejectMode(false);
    setRejectionReason("");
    setError(null);
  }

  function closeApplication() {
    if (actionLoading) {
      return;
    }

    setSelectedApplication(null);
    setRejectMode(false);
    setRejectionReason("");
  }

  /* ======================================================= */
  /* APPROVE */
/* ======================================================= */

  async function handleApprove() {
    if (!selectedApplication) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const updated =
        await approveAdminBusinessApplication(
          token,
          selectedApplication.id,
        );

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              updated.id
                ? updated
                : application,
          ),
      );

      setSelectedApplication(
        updated,
      );

      setRejectMode(false);
      setRejectionReason("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Başvuru onaylanamadı.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* ======================================================= */
  /* REJECT */
/* ======================================================= */

  async function handleReject() {
    if (!selectedApplication) {
      return;
    }

    const reason =
      rejectionReason.trim();

    if (reason.length < 3) {
      setError(
        "Lütfen en az 3 karakterlik bir red nedeni girin.",
      );

      return;
    }

    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const updated =
        await rejectAdminBusinessApplication(
          token,
          selectedApplication.id,
          reason,
        );

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              updated.id
                ? updated
                : application,
          ),
      );

      setSelectedApplication(
        updated,
      );

      setRejectMode(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Başvuru reddedilemedi.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* ======================================================= */
  /* AUTH CHECK */
/* ======================================================= */

  if (authorized === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>

          <p className="text-sm font-semibold text-slate-500">
            Yetkiniz kontrol ediliyor...
          </p>
        </div>
      </main>
    );
  }

  if (authorized === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8ff] px-5">
        <Card className="w-full max-w-md rounded-[2rem] border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
          <CardContent className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
              Erişim yetkiniz yok
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Bu bölüm yalnızca Optio
              yöneticileri tarafından
              kullanılabilir.
            </p>

            <Button
              type="button"
              onClick={() =>
                router.replace("/")
              }
              className="mt-7 rounded-xl bg-indigo-600 px-6 shadow-lg shadow-indigo-200 hover:bg-indigo-700"
            >
              Ana sayfaya dön
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  /* ======================================================= */
  /* MAIN */
/* ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      {/* =================================================== */}
      {/* ADMIN HEADER */}
      {/* =================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-8">
          {/* BRAND */}

          <Link
            href="/admin/business-applications"
            className="flex shrink-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200">
              O
            </span>

            <div>
              <div className="text-lg font-bold tracking-tight text-slate-950">
                Optio
              </div>

              <div className="text-xs font-medium text-slate-400">
                Yönetim Paneli
              </div>
            </div>
          </Link>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              Ana Sayfa
            </Link>

            <Link
              href="/businesses"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              İşletmeleri Keşfet
            </Link>

            <Link
              href="/admin/business-applications"
              className="rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700"
            >
              Başvurular
            </Link>
          </nav>

          {/* USER */}

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-bold text-slate-900">
                {user?.first_name}{" "}
                {user?.last_name}
              </div>

              <div className="text-xs text-slate-400">
                Yönetici
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearAccessToken();
                router.replace(
                  "/login",
                );
              }}
              className="rounded-xl border-slate-200 bg-white font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Çıkış
            </Button>
          </div>
        </div>

        {/* MOBILE NAV */}

        <div className="border-t border-slate-100 px-5 py-2 lg:hidden">
          <nav className="flex gap-1 overflow-x-auto">
            <Link
              href="/"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-500"
            >
              Ana Sayfa
            </Link>

            <Link
              href="/businesses"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-500"
            >
              İşletmeleri Keşfet
            </Link>

            <Link
              href="/admin/business-applications"
              className="whitespace-nowrap rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"
            >
              Başvurular
            </Link>
          </nav>
        </div>
      </header>

      {/* =================================================== */}
      {/* LAYOUT */}
      {/* =================================================== */}

      <div className="mx-auto flex max-w-[1500px] gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* SIDEBAR */}

        <aside className="hidden w-60 shrink-0 lg:block">
          <Card className="sticky top-28 rounded-[1.5rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="p-3">
              <div className="mb-3 px-3 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Optio Admin
                </p>
              </div>

              <div className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-bold text-indigo-700">
                <Building2 className="h-4 w-4" />
                İşletme başvuruları
              </div>

              <div className="mt-1 space-y-1">
                <div className="flex w-full cursor-default items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300">
                  <UserRound className="h-4 w-4" />
                  Kullanıcılar
                </div>

                <div className="flex w-full cursor-default items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300">
                  <ShieldCheck className="h-4 w-4" />
                  Adminler
                </div>
              </div>

              <Separator className="my-3" />

              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
              >
                <ArrowLeftIcon />
                Ana sayfa
              </Link>
            </CardContent>
          </Card>
        </aside>

        {/* MAIN */}

        <section className="min-w-0 flex-1">
          <div className="flex flex-col gap-6">
            {/* PAGE HEADER */}

            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  Yönetim
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  İşletme başvuruları
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Optio&apos;ya katılmak isteyen
                  işletmelerin başvurularını
                  inceleyin, onaylayın veya
                  reddedin.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void loadApplications(
                    true,
                  )
                }
                disabled={refreshing}
                className="w-fit rounded-xl border-slate-200 bg-white font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <RefreshCw
                  className={[
                    "mr-2 h-4 w-4",
                    refreshing
                      ? "animate-spin"
                      : "",
                  ].join(" ")}
                />
                Yenile
              </Button>
            </div>

            {/* ERROR */}

            {error && (
              <Card className="border-red-100 bg-red-50/80 shadow-none">
                <CardContent className="flex items-start gap-3 p-4 text-sm font-semibold text-red-700">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <span>{error}</span>
                </CardContent>
              </Card>
            )}

            {/* STATS */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Toplam",
                  value: stats.total,
                  icon: Building2,
                  tone:
                    "bg-indigo-50 text-indigo-600",
                },
                {
                  label: "Bekleyen",
                  value: stats.pending,
                  icon: Clock3,
                  tone:
                    "bg-amber-50 text-amber-600",
                },
                {
                  label: "Onaylanan",
                  value: stats.approved,
                  icon: CheckCircle2,
                  tone:
                    "bg-emerald-50 text-emerald-600",
                },
                {
                  label: "Reddedilen",
                  value: stats.rejected,
                  icon: XCircle,
                  tone:
                    "bg-red-50 text-red-600",
                },
              ].map(
                ({
                  label,
                  value,
                  icon: Icon,
                  tone,
                }) => (
                  <Card
                    key={label}
                    className="rounded-[1.5rem] border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="text-2xl font-black tracking-tight text-slate-950">
                          {value}
                        </div>

                        <div className="text-xs font-semibold text-slate-400">
                          {label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>

            {/* FILTER */}

            <Card className="rounded-[1.5rem] border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="relative min-w-0 flex-1 xl:max-w-xl">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="İşletme, kişi, e-posta veya şehir ara..."
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        key: "all" as const,
                        label: "Tümü",
                      },
                      {
                        key: "pending" as const,
                        label: "Bekleyen",
                      },
                      {
                        key: "approved" as const,
                        label: "Onaylanan",
                      },
                      {
                        key: "rejected" as const,
                        label: "Reddedilen",
                      },
                    ].map((item) => {
                      const active =
                        filter === item.key;

                      return (
                        <Button
                          key={item.key}
                          type="button"
                          variant={
                            active
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setFilter(
                              item.key,
                            )
                          }
                          className={
                            active
                              ? "rounded-xl bg-indigo-600 hover:bg-indigo-700"
                              : "rounded-xl border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                          }
                        >
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LIST */}

            {loading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <Card
                    key={index}
                    className="rounded-[1.5rem] border-slate-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />

                        <div className="flex-1">
                          <Skeleton className="h-5 w-2/3" />

                          <Skeleton className="mt-2 h-4 w-1/3" />
                        </div>
                      </div>

                      <Skeleton className="mt-6 h-16 w-full" />

                      <div className="mt-5 flex gap-2">
                        <Skeleton className="h-10 w-28 rounded-xl" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredApplications.length ===
              0 ? (
              <Card className="rounded-[1.75rem] border-dashed border-slate-300 bg-white">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-slate-900">
                    Başvuru bulunamadı
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Seçtiğiniz filtre veya arama
                    kriterlerine uygun işletme
                    başvurusu bulunmuyor.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredApplications.map(
                  (application) => (
                    <Card
                      key={application.id}
                      className="group rounded-[1.5rem] border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_rgba(79,70,229,0.08)]"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-black text-indigo-600 transition-transform duration-300 group-hover:scale-105">
                              {getInitials(
                                application.first_name,
                                application.last_name,
                              )}
                            </div>

                            <div className="min-w-0">
                              <h2 className="truncate text-lg font-bold text-slate-950">
                                {
                                  application.business_name
                                }
                              </h2>

                              <p className="mt-1 truncate text-sm text-slate-500">
                                {
                                  application.first_name
                                }{" "}
                                {
                                  application.last_name
                                }
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={`shrink-0 ${getStatusClass(
                              application.status,
                            )}`}
                          >
                            {
                              getStatusLabel(
                                application.status,
                              )
                            }
                          </Badge>
                        </div>

                        <Separator className="my-5" />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="h-4 w-4 text-slate-400" />

                            <span className="truncate">
                              {
                                application.email
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="h-4 w-4 text-slate-400" />

                            <span>
                              {
                                application.phone
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4 text-slate-400" />

                            <span>
                              {[
                                application.city,
                                application.district,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ", ",
                                )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarClock className="h-4 w-4 text-slate-400" />

                            <span>
                              {formatDate(
                                application.created_at,
                              )}
                            </span>
                          </div>
                        </div>

                        {application.description && (
                          <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-500">
                            {
                              application.description
                            }
                          </p>
                        )}

                        <div className="mt-6 flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            onClick={() =>
                              openApplication(
                                application,
                              )
                            }
                            className="rounded-xl bg-indigo-600 px-4 font-bold text-white shadow-sm hover:bg-indigo-700"
                          >
                            Başvuruyu incele
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>

                          {application.status ===
                            "pending" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(
                                  application,
                                );

                                setRejectMode(
                                  true,
                                );

                                setRejectionReason(
                                  "",
                                );

                                setError(
                                  null,
                                );
                              }}
                              className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50"
                            >
                              Reddet
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =================================================== */}
      {/* DETAIL MODAL */}
      {/* =================================================== */}

      <Dialog
        open={
          selectedApplication !== null
        }
        onOpenChange={(open) => {
          if (!open) {
            closeApplication();
          }
        }}
      >
        <DialogContent
          className="
            w-[calc(100vw-24px)]
            !max-w-none
            overflow-hidden
            rounded-[2rem]
            border-slate-200
            p-0
            shadow-[0_30px_100px_rgba(15,23,42,0.18)]
            sm:w-[calc(100vw-48px)]
            sm:!max-w-[1100px]
            lg:!max-w-[1180px]
            xl:!max-w-[1280px]
          "
        >
          {selectedApplication && (
            <>
              {/* ================================================= */}
              {/* MODAL HEADER */}
              {/* ================================================= */}

              <DialogHeader className="border-b border-slate-100 bg-white px-6 py-6 sm:px-9 sm:py-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Building2 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                          {
                            selectedApplication.business_name
                          }
                        </DialogTitle>

                        <Badge
                          variant="outline"
                          className={getStatusClass(
                            selectedApplication.status,
                          )}
                        >
                          {
                            getStatusLabel(
                              selectedApplication.status,
                            )
                          }
                        </Badge>
                      </div>

                      <DialogDescription className="mt-1.5 text-sm text-slate-500">
                        Başvuru detayları ve yönetim
                        işlemleri
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="w-fit rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-500">
                    {formatDate(
                      selectedApplication.created_at,
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* ================================================= */}
              {/* MODAL BODY */}
              {/* ================================================= */}

              <div className="max-h-[72vh] overflow-y-auto bg-[#fbfbfe] px-6 py-7 sm:px-9 sm:py-9">
                <div className="space-y-9">
                  {/* ================================================= */}
                  {/* APPLICANT */}
                  {/* ================================================= */}

                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                          Yetkili
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-950">
                          Başvuru sahibi
                        </h3>
                      </div>

                      <UserRound className="h-5 w-5 text-indigo-300" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoItem
                        icon={
                          <UserRound className="h-4 w-4" />
                        }
                        label="Ad Soyad"
                        value={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
                      />

                      <InfoItem
                        icon={
                          <Mail className="h-4 w-4" />
                        }
                        label="E-posta"
                        value={
                          selectedApplication.email
                        }
                      />

                      <InfoItem
                        icon={
                          <Phone className="h-4 w-4" />
                        }
                        label="Telefon"
                        value={
                          selectedApplication.phone
                        }
                      />

                      <InfoItem
                        icon={
                          <CalendarClock className="h-4 w-4" />
                        }
                        label="Başvuru tarihi"
                        value={formatDate(
                          selectedApplication.created_at,
                        )}
                      />
                    </div>
                  </section>

                  {/* ================================================= */}
                  {/* BUSINESS */}
                  {/* ================================================= */}

                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                          İşletme
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-950">
                          İşletme bilgileri
                        </h3>
                      </div>

                      <Building2 className="h-5 w-5 text-indigo-300" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <InfoItem
                        icon={
                          <Building2 className="h-4 w-4" />
                        }
                        label="İşletme adı"
                        value={
                          selectedApplication.business_name
                        }
                      />

                      <InfoItem
                        icon={
                          <Sparkles className="h-4 w-4" />
                        }
                        label="İşletme türü"
                        value={
                          selectedApplication.business_type ||
                          "Belirtilmedi"
                        }
                      />

                      <InfoItem
                        icon={
                          <Phone className="h-4 w-4" />
                        }
                        label="İşletme telefonu"
                        value={
                          selectedApplication.business_phone ||
                          selectedApplication.phone
                        }
                      />

                      <InfoItem
                        icon={
                          <Mail className="h-4 w-4" />
                        }
                        label="İşletme e-postası"
                        value={
                          selectedApplication.business_email ||
                          selectedApplication.email
                        }
                      />

                      <InfoItem
                        icon={
                          <MapPin className="h-4 w-4" />
                        }
                        label="Konum"
                        value={[
                          selectedApplication.city,
                          selectedApplication.district,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            ", ",
                          )}
                      />

                      <InfoItem
                        icon={
                          <MapPin className="h-4 w-4" />
                        }
                        label="Adres"
                        value={
                          selectedApplication.address ||
                          "Belirtilmedi"
                        }
                      />
                    </div>
                  </section>

                  {/* ================================================= */}
                  {/* DESCRIPTION */}
                  {/* ================================================= */}

                  {selectedApplication.description && (
                    <section>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Sparkles className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                            Açıklama
                          </p>

                          <h3 className="mt-0.5 text-lg font-bold text-slate-950">
                            İşletme hakkında
                          </h3>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm leading-7 text-slate-600">
                          {
                            selectedApplication.description
                          }
                        </p>
                      </div>
                    </section>
                  )}

                  {/* ================================================= */}
                  {/* REJECTION */}
                  {/* ================================================= */}

                  {selectedApplication.status ===
                    "rejected" &&
                    selectedApplication.rejection_reason && (
                      <section>
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <XCircle className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-600">
                              Sonuç
                            </p>

                            <h3 className="mt-0.5 text-lg font-bold text-slate-950">
                              Red nedeni
                            </h3>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                          <p className="text-sm leading-7 text-red-700">
                            {
                              selectedApplication.rejection_reason
                            }
                          </p>
                        </div>
                      </section>
                    )}

                  {/* ================================================= */}
                  {/* REJECT FORM */}
                  {/* ================================================= */}

                  {rejectMode &&
                    selectedApplication.status ===
                      "pending" && (
                      <section className="rounded-[1.5rem] border border-red-100 bg-red-50/70 p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                            <XCircle className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-red-800">
                              Başvuruyu reddet
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-red-700/70">
                              Başvuru sahibine
                              gösterilecek red
                              nedenini belirtin.
                            </p>
                          </div>
                        </div>

                        <Textarea
                          value={
                            rejectionReason
                          }
                          onChange={(
                            event,
                          ) =>
                            setRejectionReason(
                              event.target
                                .value,
                            )
                          }
                          placeholder="Örn. İşletme bilgileri doğrulanamadı..."
                          rows={5}
                          maxLength={2000}
                          className="mt-5 min-h-32 resize-none rounded-xl border-red-200 bg-white shadow-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        />

                        <div className="mt-2 flex justify-between text-xs text-red-500/70">
                          <span>
                            En az 3 karakter
                          </span>

                          <span>
                            {
                              rejectionReason.length
                            }
                            /2000
                          </span>
                        </div>

                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setRejectMode(
                                false,
                              );

                              setRejectionReason(
                                "",
                              );

                              setError(
                                null,
                              );
                            }}
                            disabled={
                              actionLoading
                            }
                            className="rounded-xl border-slate-200 bg-white"
                          >
                            Vazgeç
                          </Button>

                          <Button
                            type="button"
                            onClick={() =>
                              void handleReject()
                            }
                            disabled={
                              actionLoading ||
                              rejectionReason.trim()
                                .length < 3
                            }
                            className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                          >
                            {actionLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Reddediliyor...
                              </>
                            ) : (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Başvuruyu reddet
                              </>
                            )}
                          </Button>
                        </div>
                      </section>
                    )}
                </div>
              </div>

              {/* ================================================= */}
              {/* MODAL FOOTER */}
              {/* ================================================= */}

              {!rejectMode && (
                <DialogFooter className="border-t border-slate-100 bg-white px-6 py-5 sm:px-9">
                  {selectedApplication.status ===
                  "pending" ? (
                    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          closeApplication
                        }
                        disabled={
                          actionLoading
                        }
                        className="rounded-xl border-slate-200 px-5 font-semibold text-slate-600"
                      >
                        Kapat
                      </Button>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setRejectMode(
                              true,
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          className="rounded-xl border-red-200 px-5 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reddet
                        </Button>

                        <Button
                          type="button"
                          onClick={() =>
                            void handleApprove()
                          }
                          disabled={
                            actionLoading
                          }
                          className="rounded-xl bg-emerald-600 px-5 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700"
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Onaylanıyor...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Başvuruyu onayla
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full justify-end">
                      <Button
                        type="button"
                        onClick={
                          closeApplication
                        }
                        className="rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700"
                      >
                        Kapat
                      </Button>
                    </div>
                  )}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ========================================================= */
/* BACK ICON */
/* ========================================================= */

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5m7 7-7-7 7-7"
      />
    </svg>
  );
}