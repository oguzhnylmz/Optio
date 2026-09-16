"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getMe, type AuthUser } from "@/lib/api";
import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

const navItems = [
  {
    label: "Hizmetler",
    href: "#services",
  },
  {
    label: "İşletmeler",
    href: "#businesses",
  },
  {
    label: "Hakkımızda",
    href: "#about",
  },
];

export default function Header() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const token =
        getAccessToken();

      if (!token) {
        if (mounted) {
          setUser(null);
          setAuthLoading(false);
        }

        return;
      }

      try {
        const currentUser =
          await getMe(token);

        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        clearAccessToken();

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    clearAccessToken();
    setUser(null);
    setMenuOpen(false);

    router.push("/");
    router.refresh();
  }

  const isOwner =
    user?.role === "owner";

  const isCustomer =
    user?.role === "customer";

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100/70 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Optio ana sayfa"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-200">
            <span className="h-3.5 w-3.5 rounded-full bg-white" />
          </span>

          <span className="text-2xl font-bold tracking-tight text-slate-950">
            Optio
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[15px] font-semibold text-slate-700 transition-colors duration-200 hover:text-indigo-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden items-center gap-3 md:flex">
          {authLoading ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
          ) : !user ? (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-indigo-100 bg-white px-5 py-2.5 text-[15px] font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600"
              >
                Giriş Yap
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_25px_rgba(79,70,229,0.22)]"
              >
                Üye Ol
              </Link>
            </>
          ) : (
            <>
              {isOwner && (
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-indigo-100 bg-white px-5 py-2.5 text-[15px] font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
              )}

              {isCustomer && (
                <Link
                  href="/account"
                  className="rounded-xl border border-indigo-100 bg-white px-5 py-2.5 text-[15px] font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Hesabım
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_25px_rgba(79,70,229,0.22)]"
              >
                Çıkış
              </button>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              (value) => !value,
            )
          }
          className="rounded-xl border border-indigo-100 bg-white p-2.5 text-slate-700 transition hover:bg-indigo-50 md:hidden"
          aria-label="Menüyü aç"
          aria-expanded={menuOpen}
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </div>
        </button>
      </div>

      {/* MOBILE NAV */}
      {menuOpen && (
        <div className="border-t border-indigo-100 bg-white px-5 py-4 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() =>
                  setMenuOpen(false)
                }
                className="rounded-xl px-3 py-3 text-[15px] font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 border-t border-indigo-100 pt-4">
              {authLoading ? (
                <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
              ) : !user ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                    className="rounded-xl border border-indigo-100 px-4 py-3 text-center text-[15px] font-semibold text-slate-700 transition hover:bg-indigo-50"
                  >
                    Giriş Yap
                  </Link>

                  <Link
                    href="/register"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-[15px] font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Üye Ol
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {isOwner && (
                    <Link
                      href="/dashboard"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                      className="rounded-xl bg-indigo-50 px-4 py-3 text-center text-[15px] font-bold text-indigo-600 transition hover:bg-indigo-100"
                    >
                      Dashboard
                    </Link>
                  )}

                  {isCustomer && (
                    <Link
                      href="/account"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                      className="rounded-xl bg-indigo-50 px-4 py-3 text-center text-[15px] font-bold text-indigo-600 transition hover:bg-indigo-100"
                    >
                      Hesabım
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-red-100 bg-white px-4 py-3 text-center text-[15px] font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}