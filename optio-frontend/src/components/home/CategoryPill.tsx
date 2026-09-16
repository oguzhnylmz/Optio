interface CategoryPillProps {
  icon: string;
  label: string;
}

export default function CategoryPill({
  icon,
  label,
}: CategoryPillProps) {
  return (
    <button
      type="button"
      className="group flex min-w-[92px] flex-col items-center gap-2.5"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-xl shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:border-violet-200 group-hover:shadow-lg group-hover:shadow-violet-100">
        {icon}
      </div>

      <span className="text-xs font-semibold text-slate-600 transition group-hover:text-indigo-600">
        {label}
      </span>
    </button>
  );
}