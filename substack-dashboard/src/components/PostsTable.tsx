"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";

interface Post {
  title: string;
  date: string;
  type: string;
  audience: string;
  delivered: number;
  opens: number;
  openRate: number;
}

interface PostsTableProps {
  posts: Post[];
}

export default function PostsTable({ posts }: PostsTableProps) {
  const [sortField, setSortField] = useState<keyof Post>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState("");

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "date") {
      aVal = aVal || "";
      bVal = bVal || "";
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Post) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: keyof Post }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200">
              <th
                className="text-left py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("title")}
              >
                Title <SortIcon field="title" />
              </th>
              <th
                className="text-left py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("date")}
              >
                Date <SortIcon field="date" />
              </th>
              <th
                className="text-left py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("type")}
              >
                Type <SortIcon field="type" />
              </th>
              <th
                className="text-right py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("delivered")}
              >
                Delivered <SortIcon field="delivered" />
              </th>
              <th
                className="text-right py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("opens")}
              >
                Opens <SortIcon field="opens" />
              </th>
              <th
                className="text-right py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("openRate")}
              >
                Rate <SortIcon field="openRate" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((post, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-2">
                  <div className="font-medium text-gray-900 max-w-[300px] truncate">
                    {post.title}
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-600">
                  {post.date
                    ? format(parseISO(post.date), "MMM d, yyyy")
                    : "N/A"}
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      post.type === "podcast"
                        ? "bg-purple-100 text-purple-700"
                        : post.type === "thread"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {post.type}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-gray-600">
                  {post.delivered.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right text-gray-600">
                  {post.opens.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right">
                  <span
                    className={`font-semibold ${
                      post.openRate >= 55
                        ? "text-green-600"
                        : post.openRate >= 45
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {post.openRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {sortedPosts.length} of {posts.length} posts
      </div>
    </div>
  );
}
