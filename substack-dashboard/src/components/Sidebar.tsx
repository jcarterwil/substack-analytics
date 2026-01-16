"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/posts", label: "Posts", icon: "📝" },
  { href: "/subscribers", label: "Subscribers", icon: "👥" },
  { href: "/geography", label: "Geography", icon: "🌍" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Food Is Health</h1>
        <p className="text-sm text-gray-500">Analytics Dashboard</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Data as of Jan 16, 2026
        </p>
      </div>
    </aside>
  );
}
