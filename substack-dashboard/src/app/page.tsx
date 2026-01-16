import StatCard from "@/components/StatCard";
import ChartWrapper from "@/components/ChartWrapper";
import MonthlyTrendsChart from "@/components/MonthlyTrendsChart";
import TopPostsTable from "@/components/TopPostsTable";
import { promises as fs } from "fs";
import path from "path";

interface Overview {
  totalPosts: number;
  postsWithAnalytics: number;
  totalDelivered: number;
  totalOpened: number;
  averageOpenRate: number;
  subscribers: {
    total: number;
    active: number;
    paid: number;
    free: number;
    churned: number;
  };
}

interface MonthlyTrend {
  month: string;
  posts: number;
  delivered: number;
  opened: number;
  openRate: number;
}

interface TopPost {
  title: string;
  date: string;
  opens: number;
  delivered: number;
  openRate: number;
}

async function getOverview(): Promise<Overview> {
  const filePath = path.join(process.cwd(), "public/data/overview.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  const filePath = path.join(process.cwd(), "public/data/monthly-trends.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function getTopPosts(): Promise<{ byOpens: TopPost[]; byOpenRate: TopPost[] }> {
  const filePath = path.join(process.cwd(), "public/data/top-posts.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

export default async function HomePage() {
  const overview = await getOverview();
  const monthlyTrends = await getMonthlyTrends();
  const topPosts = await getTopPosts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500">Your Substack newsletter at a glance</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Posts"
          value={overview.totalPosts}
          subtext="Published newsletters"
        />
        <StatCard
          label="Total Subscribers"
          value={overview.subscribers.total}
          subtext={`${overview.subscribers.active} active`}
        />
        <StatCard
          label="Emails Delivered"
          value={overview.totalDelivered}
          subtext="All time"
        />
        <StatCard
          label="Average Open Rate"
          value={`${overview.averageOpenRate}%`}
          subtext="Across all posts"
          trend="up"
        />
      </div>

      {/* Subscriber Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Paid Subscribers"
          value={overview.subscribers.paid}
          subtext={`${((overview.subscribers.paid / overview.subscribers.total) * 100).toFixed(1)}% of total`}
        />
        <StatCard
          label="Free Subscribers"
          value={overview.subscribers.free}
          subtext="Active free tier"
        />
        <StatCard
          label="Total Opens"
          value={overview.totalOpened}
          subtext="Email opens tracked"
        />
      </div>

      {/* Monthly Trends Chart */}
      <ChartWrapper
        title="Monthly Performance"
        subtitle="Posts published and email engagement over time"
      >
        <MonthlyTrendsChart data={monthlyTrends} />
      </ChartWrapper>

      {/* Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="Top Posts by Opens">
          <TopPostsTable posts={topPosts.byOpens} metric="opens" />
        </ChartWrapper>
        <ChartWrapper title="Top Posts by Open Rate">
          <TopPostsTable posts={topPosts.byOpenRate} metric="openRate" />
        </ChartWrapper>
      </div>
    </div>
  );
}
