import Link from "next/link";

export type DashTab = "home" | "leads" | "schedule" | "work" | "look" | "plan";

const TABS: { key: DashTab; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/dashboard" },
  { key: "leads", label: "Leads", href: "/dashboard/crm" },
  { key: "schedule", label: "Bookings & calls", href: "/dashboard?tab=schedule" },
  { key: "work", label: "Your work", href: "/dashboard?tab=work" },
  { key: "look", label: "Look & basics", href: "/dashboard?tab=look" },
  { key: "plan", label: "Plan", href: "/dashboard?tab=plan" },
];

// The dashboard's section bar. Plain links (no client state), so every tab is a real page that works the same
// on a phone, survives a refresh, and can be bookmarked.
export default function DashTabs({
  active,
  leadsBadge = 0,
  scheduleBadge = 0,
}: {
  active: DashTab;
  leadsBadge?: number;
  scheduleBadge?: number;
}) {
  const badge: Partial<Record<DashTab, number>> = { leads: leadsBadge, schedule: scheduleBadge };
  return (
    <nav className="dtabs" aria-label="Dashboard sections">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={t.key === active ? "on" : ""}
          aria-current={t.key === active ? "page" : undefined}
        >
          {t.label}
          {!!badge[t.key] && <span className="dbadge">{badge[t.key]}</span>}
        </Link>
      ))}
    </nav>
  );
}
