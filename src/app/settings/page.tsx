import Link from "next/link";

import { ROUTES, type AppRoute } from "@/lib/constants";

interface NavItem {
  href: AppRoute;
  label: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: ROUTES.settingsBilling,
    label: "Billing",
    description: "Manage your plan and payment methods.",
  },
  {
    href: ROUTES.settingsUsage,
    label: "Usage",
    description: "Monitor resource usage against your plan limits.",
  },
  {
    href: ROUTES.settingsApiKeys,
    label: "API Keys",
    description: "Create and manage API keys for programmatic access.",
  },
  {
    href: ROUTES.settingsOrg,
    label: "Organizations",
    description: "Create and manage teams and organizations.",
  },
];

export default function SettingsPage(): React.ReactElement {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account and subscription.</p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3 transition-colors"
          >
            <div>
              <p className="text-foreground text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
            <span className="text-muted-foreground text-sm">→</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
