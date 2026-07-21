"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconHome,
  IconBook,
  IconCode,
  IconUsers,
  IconChart,
  IconMessage,
  IconSettings,
  IconTrophy,
  IconRobot,
  IconStar,
  IconGame,
  IconAward,
  IconFileText,
  IconShield,
  IconTerminal,
  IconArrowRight,
  IconSearch,
  IconClipboard,
  IconTrending,
  IconPalette,
  IconCheck,
  IconX,
} from "./FluxIcons";
import { AnimatedLogo } from "./AnimatedLogo";

// ── Icon map: string name → React component ────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  dashboard: IconDashboard,
  home: IconHome,
  book: IconBook,
  code: IconCode,
  terminal: IconTerminal,
  users: IconUsers,
  chart: IconChart,
  message: IconMessage,
  settings: IconSettings,
  trophy: IconTrophy,
  robot: IconRobot,
  star: IconStar,
  game: IconGame,
  award: IconAward,
  "file-text": IconFileText,
  shield: IconShield,
  search: IconSearch,
  clipboard: IconClipboard,
  trending: IconTrending,
  palette: IconPalette,
  check: IconCheck,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle?: string;
  bottomContent?: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ items, title, subtitle, bottomContent, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`fixed left-0 top-0 h-[calc(100vh-24px)] bg-[#171717] text-white flex flex-col z-50 m-3 rounded-[20px] transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[72px]' : 'w-[220px]'}`}>
      {/* Logo */}
      <div className={`${isCollapsed ? 'px-4' : 'px-5'} pt-5 pb-4`}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <AnimatedLogo size={20} />
          </div>
          {!isCollapsed && (
            <>
              <span className="text-lg font-semibold tracking-tight">{title}</span>
            </>
          )}
        </Link>
        {!isCollapsed && subtitle && <p className="text-[12px] text-[#A0A0A0] mt-1 ml-[42px]">{subtitle}</p>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const IconComponent = ICON_MAP[item.icon] || IconHome;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-pill text-[14px] font-medium transition-all ${
                isActive
                  ? "bg-white text-[#0F0F0F]"
                  : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
              }`}
            >
              <IconComponent size={18} />
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!isCollapsed && item.badge && item.badge > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#D6F63E] text-[#0F0F0F]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom content or empty spacer */}
      {bottomContent || <div className="p-3" />}
    </aside>
  );
}
