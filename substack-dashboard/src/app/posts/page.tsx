import ChartWrapper from "@/components/ChartWrapper";
import PostsTable from "@/components/PostsTable";
import { promises as fs } from "fs";
import path from "path";

interface Post {
  title: string;
  date: string;
  type: string;
  audience: string;
  delivered: number;
  opens: number;
  openRate: number;
}

async function getAllPosts(): Promise<Post[]> {
  const filePath = path.join(process.cwd(), "public/data/all-posts.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

export default async function PostsPage() {
  const posts = await getAllPosts();

  const totalPosts = posts.length;
  const avgOpenRate = posts.reduce((sum, p) => sum + p.openRate, 0) / posts.length;
  const totalDelivered = posts.reduce((sum, p) => sum + p.delivered, 0);
  const totalOpens = posts.reduce((sum, p) => sum + p.opens, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Posts Analytics</h1>
        <p className="text-gray-500">Detailed performance metrics for all posts</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Posts</p>
          <p className="text-2xl font-bold">{totalPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Open Rate</p>
          <p className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Delivered</p>
          <p className="text-2xl font-bold">{totalDelivered.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Opens</p>
          <p className="text-2xl font-bold">{totalOpens.toLocaleString()}</p>
        </div>
      </div>

      {/* Posts Table */}
      <ChartWrapper
        title="All Posts"
        subtitle={`${totalPosts} posts with email analytics`}
      >
        <PostsTable posts={posts} />
      </ChartWrapper>
    </div>
  );
}
