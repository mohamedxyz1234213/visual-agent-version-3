"use client";

import { IconKebab } from "./FluxIcons";

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
  accentColor?: string;
}

export function StatsCard({ title, value, unit, change, icon: Icon, accentColor }: StatsCardProps) {
  return (
    <div className="flux-card flex flex-col gap-3">
      {/* Top row: icon chip + label + kebab */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flux-icon-chip" style={accentColor ? { color: accentColor } : undefined}>
            <Icon size={18} />
          </div>
          <span className="flux-stat-label">{title}</span>
        </div>
        <button className="w-6 h-6 flex items-center justify-center text-[#6B6B6B] hover:bg-gray-100 rounded-lg transition-colors">
          <IconKebab size={16} />
        </button>
      </div>

      {/* Hero stat number */}
      <div className="flex items-baseline gap-1.5">
        <span className="flux-stat-number">{value}</span>
        {unit && <span className="flux-stat-unit">{unit}</span>}
        {change !== undefined && (
          <span className="flux-badge-lime ml-2">
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
}
