"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
  logoColor?: string;
  bottomContent?: React.ReactNode;
  collapsed?: boolean;
}

export function Sidebar({ items, title, subtitle, logoColor = "#D4F542", bottomContent, collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-[#1C1C1E] text-white flex flex-col z-50 transition-all duration-300",
      collapsed ? "w-[80px]" : "w-[260px]"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ backgroundColor: logoColor }}>
          <span className="text-[#18181B] font-bold text-sm">CT</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-xl font-semibold tracking-tight block truncate">{title}</span>
            {subtitle && <span className="text-xs text-gray-500 block truncate">{subtitle}</span>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-white/10 text-white border-l-4"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
                isActive && { borderColor: logoColor }
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && item.badge > 0 && (
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: logoColor, color: "#18181B" }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      {bottomContent && (
        <div className="p-4 border-t border-white/5">
          {bottomContent}
        </div>
      )}
    </aside>
  );
}
