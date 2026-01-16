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

interface GrowthData {
  month: string;
  count: number;
  cumulative: number;
}

interface SubscriberGrowthChartProps {
  data: GrowthData[];
}

export default function SubscriberGrowthChart({ data }: SubscriberGrowthChartProps) {
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name === "count" ? "New Subscribers" : "Total Subscribers",
            ]}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="count"
            fill="#10b981"
            name="count"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="cumulative"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
