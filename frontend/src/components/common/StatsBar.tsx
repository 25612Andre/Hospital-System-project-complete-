import React from "react";
import clsx from "clsx";

export interface StatItem {
  label: string;
  value: string | number;
  accent?: string;
}

const palette = [
  "from-emerald-100 to-emerald-50",
  "from-cyan-100 to-cyan-50",
  "from-amber-100 to-amber-50",
  "from-indigo-100 to-indigo-50",
  "from-rose-100 to-rose-50",
];

const StatsBar: React.FC<{ items: StatItem[] }> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, idx) => (
        <div
          key={item.label}
          className={clsx(
            "rounded-lg border border-slate-100 bg-gradient-to-br shadow-sm p-3",
            item.accent || palette[idx % palette.length]
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{item.label}</div>
          <div className="text-2xl font-bold text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
