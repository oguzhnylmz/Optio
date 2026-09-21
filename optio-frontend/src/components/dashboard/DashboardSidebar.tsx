"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <Icon>
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
    </Icon>
  );
}

function BuildingIcon() {
  return (
    <Icon>
      <path d="M4 21V5l8-3 8 3v16" />
      <path d="M8 21v-7h8v7" />
      <path d="M8 8h.01M12 8h.01M16 8h.01" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </Icon>
  );
}

function CalendarIcon() {
  return (
    <Icon>
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="3"
      />
      <path d="M16 2v4M8 2v4M3 9h18" />
    </Icon>
  );
}

function ClockIcon() {
  return (
    <Icon>
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

function ServicesIcon() {
  return (
    <Icon>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
      />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </Icon>
  );
}

function EmployeesIcon() {
  return (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle
        cx="9.5"
        cy="7"
        r="4"
      />
      <path d="M17 11a4 4 0 0 0 0-8M21 21v-2a4 4 0 0 0-3-3.87" />
    </Icon>
  );
}

function CustomerIcon() {
  return (
    <Icon>
      <circle
        cx="12"
        cy="8"
        r="4"
      />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  );
}

const menuItems = [
  {
    label: "Genel Bakış",
    href: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "İşletmem",
    href: "/dashboard/business",
    icon: <BuildingIcon />,
  },
  {
    label: "Randevular",
    href: "/dashboard/appointments",
    icon: <CalendarIcon />,
  },
  {
    label: "Takvim",
    href: "/dashboard/calendar",
    icon: <ClockIcon />,
  },
  {
    label: "Hizmetler",
    href: "/dashboard/services",
    icon: <ServicesIcon />,
  },
  {
    label: "Çalışanlar",
    href: "/dashboard/employees",
    icon: <EmployeesIcon />,
  },
  {
    label: "Çalışma Saatleri",
    href: "/dashboard/working-hours",
    icon: <ClockIcon />,
  },
  {
    label: "Müşteriler",
    href: "/dashboard/customers",
    icon: <CustomerIcon />,
  },
];

export default function DashboardSidebar() {
  const pathname =
    usePathname();

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-28 space-y-1">
        {menuItems.map(
          ({
            label,
            href,
            icon,
          }) => {
            const isDashboard =
              href ===
              "/dashboard";

            const active =
              isDashboard
                ? pathname ===
                  "/dashboard"
                : pathname ===
                    href ||
                  pathname.startsWith(
                    `${href}/`,
                  );

            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "text-slate-500 hover:bg-white hover:text-slate-900",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-xl",
                    active
                      ? "bg-white/15"
                      : "bg-slate-100",
                  ].join(" ")}
                >
                  {icon}
                </span>

                {label}
              </Link>
            );
          },
        )}
      </nav>
    </aside>
  );
}