"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GeoData {
  country: string;
  count: number;
}

interface GeoChartProps {
  data: GeoData[];
}

const countryNames: Record<string, string> = {
  US: "United States",
  NL: "Netherlands",
  GB: "United Kingdom",
  CA: "Canada",
  IN: "India",
  AU: "Australia",
  FR: "France",
  CH: "Switzerland",
  HK: "Hong Kong",
  NZ: "New Zealand",
  ES: "Spain",
  AE: "UAE",
  BE: "Belgium",
  MX: "Mexico",
  IE: "Ireland",
  DE: "Germany",
  IT: "Italy",
  SG: "Singapore",
  JP: "Japan",
  BR: "Brazil",
};

const colors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#a855f7",
  "#22c55e",
  "#eab308",
  "#d946ef",
];

export default function GeoChart({ data }: GeoChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: countryNames[item.country] || item.country,
  }));

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [value.toLocaleString(), "Opens"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
