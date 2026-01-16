import StatCard from "@/components/StatCard";
import ChartWrapper from "@/components/ChartWrapper";
import SubscriberGrowthChart from "@/components/SubscriberGrowthChart";
import { promises as fs } from "fs";
import path from "path";

interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  paid: number;
  free: number;
  churned: number;
  emailDisabled: number;
  byPlan: Record<string, number>;
  byMonth: Record<string, number>;
}

interface GrowthData {
  month: string;
  count: number;
}

async function getSubscriberStats(): Promise<SubscriberStats> {
  const filePath = path.join(process.cwd(), "public/data/subscriber-stats.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function getSubscriberGrowth(): Promise<GrowthData[]> {
  const filePath = path.join(process.cwd(), "public/data/subscriber-growth.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

export default async function SubscribersPage() {
  const stats = await getSubscriberStats();
  const growth = await getSubscriberGrowth();

  // Calculate cumulative growth
  let cumulative = 0;
  const cumulativeGrowth = growth.map((g) => {
    cumulative += g.count;
    return { ...g, cumulative };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
        <p className="text-gray-500">Subscriber growth and segmentation</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Subscribers"
          value={stats.total}
          subtext="All time signups"
        />
        <StatCard
          label="Active Subscribers"
          value={stats.active}
          subtext={`${((stats.active / stats.total) * 100).toFixed(1)}% of total`}
        />
        <StatCard
          label="Paid Subscribers"
          value={stats.paid}
          subtext={`${((stats.paid / stats.total) * 100).toFixed(1)}% conversion`}
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          subtext="Unsubscribed or expired"
        />
      </div>

      {/* Growth Chart */}
      <ChartWrapper
        title="Subscriber Growth"
        subtitle="New subscribers and cumulative total over time"
      >
        <SubscriberGrowthChart data={cumulativeGrowth} />
      </ChartWrapper>

      {/* Plan Breakdown */}
      <ChartWrapper title="Subscribers by Plan">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats.byPlan)
            .sort((a, b) => b[1] - a[1])
            .map(([plan, count]) => (
              <div
                key={plan}
                className="bg-gray-50 rounded-lg p-4 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">
                  {count.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 capitalize">{plan}</p>
              </div>
            ))}
        </div>
      </ChartWrapper>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Email Disabled</p>
          <p className="text-2xl font-bold text-gray-900">{stats.emailDisabled}</p>
          <p className="text-sm text-gray-400">
            {((stats.emailDisabled / stats.total) * 100).toFixed(2)}% of subscribers
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Free Active</p>
          <p className="text-2xl font-bold text-gray-900">{stats.free}</p>
          <p className="text-sm text-gray-400">Active free tier subscribers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Churned</p>
          <p className="text-2xl font-bold text-gray-900">{stats.churned}</p>
          <p className="text-sm text-gray-400">Previously paid, now inactive</p>
        </div>
      </div>
    </div>
  );
}
