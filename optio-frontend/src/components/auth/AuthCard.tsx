"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  getMe,
  login,
  registerCustomer,
} from "@/lib/api";

import {
  saveAccessToken,
} from "@/lib/auth";

interface AuthCardProps {
  mode: "login" | "register";
}

export default function AuthCard({
  mode,
}: AuthCardProps) {
  const router = useRouter();

  const isLogin = mode === "login";

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Lütfen e-posta ve şifrenizi girin.",
      );
      return;
    }

    if (!isLogin) {
      if (
        !firstName.trim() ||
        !lastName.trim()
      ) {
        setError(
          "Lütfen ad ve soyad bilgilerinizi girin.",
        );
        return;
      }

      if (!phone.trim()) {
        setError(
          "Lütfen telefon numaranızı girin.",
        );
        return;
      }

      if (password !== confirmPassword) {
        setError(
          "Şifreler birbiriyle eşleşmiyor.",
        );
        return;
      }

      if (password.length < 8) {
        setError(
          "Şifre en az 8 karakter olmalıdır.",
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const loginResult =
          await login(
            email.trim(),
            password,
          );

        saveAccessToken(
          loginResult.access_token,
        );

        const user =
          await getMe(
            loginResult.access_token,
          );

        if (user.role === "owner") {
          router.replace(
            "/dashboard",
          );
        } else if (
          user.role === "customer"
        ) {
          router.replace(
            "/account",
          );
        } else {
          throw new Error(
            "Hesap rolü tanınamadı.",
          );
        }

        router.refresh();

        return;
      }

      await registerCustomer({
        email: email.trim(),
        password,
        first_name:
          firstName.trim(),
        last_name:
          lastName.trim(),
        phone:
          phone.trim(),
      });

      setSuccess(
        "Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.",
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push(
          "/login?registered=1",
        );
      }, 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isLogin
            ? "Giriş yapılamadı."
            : "Hesap oluşturulamadı.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200">
            O
          </span>

          <span className="text-2xl font-bold tracking-tight text-slate-950">
            Optio
          </span>
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-950">
          {isLogin
            ? "Hoş geldin."
            : "Optio'ya katıl."}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isLogin
            ? "Hesabına giriş yap ve randevularını yönet."
            : "Randevularını daha kolay yönetmek için hesabını oluştur."}
        </p>
      </div>

      <div className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-[0_20px_60px_rgba(79,70,229,0.10)] sm:p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {!isLogin && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first-name"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Ad
                </label>

                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(
                      event.target.value,
                    )
                  }
                  autoComplete="given-name"
                  required
                  maxLength={100}
                  placeholder="Adınız"
                  className="w-full rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="last-name"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Soyad
                </label>

                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) =>
                    setLastName(
                      event.target.value,
                    )
                  }
                  autoComplete="family-name"
                  required
                  maxLength={100}
                  placeholder="Soyadınız"
                  className="w-full rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              E-posta
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
              autoComplete="email"
              required
              maxLength={255}
              placeholder="ornek@email.com"
              className="w-full rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-800"
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
                autoComplete="tel"
                required
                maxLength={30}
                placeholder="+90 532 123 45 67"
                className="w-full rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Şifre
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              autoComplete={
                isLogin
                  ? "current-password"
                  : "new-password"
              }
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Şifre tekrar
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_25px_rgba(79,70,229,0.18)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? isLogin
                ? "Giriş yapılıyor..."
                : "Hesap oluşturuluyor..."
              : isLogin
                ? "Giriş Yap"
                : "Üye Ol"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-indigo-100" />

          <span className="text-xs font-medium text-slate-400">
            veya
          </span>

          <div className="h-px flex-1 bg-indigo-100" />
        </div>

        <div className="text-center text-sm text-slate-500">
          {isLogin ? (
            <>
              Henüz hesabın yok mu?{" "}
              <Link
                href="/register"
                className="font-bold text-indigo-600 hover:text-indigo-700"
              >
                Üye Ol
              </Link>
            </>
          ) : (
            <>
              Zaten hesabın var mı?{" "}
              <Link
                href="/login"
                className="font-bold text-indigo-600 hover:text-indigo-700"
              >
                Giriş Yap
              </Link>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        Optio ile randevularını daha kolay yönet.
      </p>
    </div>
  );
}