import Link from "next/link";

import type { PublicBusiness } from "@/lib/api";

interface FeaturedBusinessCardProps {
  business: PublicBusiness;
}

export default function FeaturedBusinessCard({
  business,
}: FeaturedBusinessCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_12px_40px_rgba(79,70,229,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(79,70,229,0.14)]">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-violet-200 via-indigo-100 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.9),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,.3),transparent_35%)]" />

        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-600 backdrop-blur">
          Öne Çıkan
        </div>

        <button
          type="button"
          aria-label="Favorilere ekle"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur transition hover:scale-105"
        >
          ♡
        </button>

        <div className="absolute bottom-4 left-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white text-xl font-bold text-indigo-600 shadow-lg">
          {business.name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              {business.name}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {business.city}
              {business.country
                ? ` · ${business.country}`
                : ""}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 px-2.5 py-1.5 text-sm font-bold text-amber-700">
            ★ 4.9
          </div>
        </div>

        {business.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            {business.description}
          </p>
        )}

        <Link
          href={`/business/${business.slug}`}
          className="mt-5 flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          İşletmeyi Gör
        </Link>
      </div>
    </article>
  );
}