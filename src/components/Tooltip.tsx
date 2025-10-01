// src/components/Tooltip.tsx
'use client';
import React from "react";

type TooltipProps = React.PropsWithChildren<{
  label: string;
  className?: string;
}>;

export default function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <div className={['group relative inline-flex', className].filter(Boolean).join(' ')}>
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2
                   whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white
                   opacity-0 shadow transition-opacity group-hover:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}