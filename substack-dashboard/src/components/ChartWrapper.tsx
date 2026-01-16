"use client";

import { ReactNode } from "react";

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
}

export default function ChartWrapper({ title, children, subtitle }: ChartWrapperProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
