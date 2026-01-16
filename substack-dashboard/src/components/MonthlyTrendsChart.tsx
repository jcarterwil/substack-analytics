"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface MonthlyTrend {
  month: string;
  posts: number;
  delivered: number;
  opened: number;
  openRate: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrend[];
}

export default function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: format(parseISO(`${item.month}-01`), "MMM yy"),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "openRate") return [`${value.toFixed(1)}%`, "Open Rate"];
              return [value.toLocaleString(), name === "delivered" ? "Delivered" : "Opened"];
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="delivered"
            fill="#3b82f6"
            name="Delivered"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="left"
            dataKey="opened"
            fill="#10b981"
            name="Opened"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="openRate"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", strokeWidth: 2 }}
            name="openRate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
