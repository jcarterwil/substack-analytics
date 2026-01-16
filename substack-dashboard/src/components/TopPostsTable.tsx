"use client";

import { format, parseISO } from "date-fns";

interface TopPost {
  title: string;
  date: string;
  opens: number;
  delivered: number;
  openRate: number;
}

interface TopPostsTableProps {
  posts: TopPost[];
  metric: "opens" | "openRate";
}

export default function TopPostsTable({ posts, metric }: TopPostsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-500">#</th>
            <th className="text-left py-2 font-medium text-gray-500">Title</th>
            <th className="text-right py-2 font-medium text-gray-500">
              {metric === "opens" ? "Opens" : "Rate"}
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.slice(0, 5).map((post, index) => (
            <tr key={index} className="border-b border-gray-100 last:border-0">
              <td className="py-3 text-gray-400">{index + 1}</td>
              <td className="py-3">
                <div className="font-medium text-gray-900 truncate max-w-[200px]">
                  {post.title}
                </div>
                <div className="text-xs text-gray-500">
                  {post.date ? format(parseISO(post.date), "MMM d, yyyy") : "N/A"}
                </div>
              </td>
              <td className="py-3 text-right font-semibold text-gray-900">
                {metric === "opens"
                  ? post.opens.toLocaleString()
                  : `${post.openRate}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
