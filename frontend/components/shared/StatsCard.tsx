"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: LucideIcon;
  accentColor?: string;
  className?: string;
}

export function StatsCard({ title, value, unit, change, icon: Icon, accentColor = "#D4F542", className }: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="font-medium text-sm text-gray-500">{title}</h3>
        </div>
        {change !== undefined && (
          <span className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-[#18181B] tracking-tight" style={{ lineHeight: "56px" }}>
          {value}
        </span>
        {unit && <span className="text-sm text-gray-500 mb-1">{unit}</span>}
      </div>
    </div>
  );
}
