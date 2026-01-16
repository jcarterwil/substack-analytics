'use client'

import { format } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { AnalysisResult, PostMetadata } from '@/lib/types'

interface DashboardProps {
  result: AnalysisResult
  onReset: () => void
}

function htmlToText(html: string): string {
  // Simple HTML to text conversion
  return html
    // Remove script and style tags with content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Convert headers
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
    // Convert paragraphs and divs
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    // Convert lists
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    // Convert links - keep the text
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    // Convert emphasis
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function generateMarkdown(posts: PostMetadata[]): string {
  const publishedPosts = posts
    .filter(p => p.is_published && p.htmlContent)
    .sort((a, b) => {
      const dateA = a.post_date ? new Date(a.post_date).getTime() : 0
      const dateB = b.post_date ? new Date(b.post_date).getTime() : 0
      return dateA - dateB // Chronological order
    })

  let markdown = `# Substack Archive\n\n`
  markdown += `Total Posts: ${publishedPosts.length}\n\n`
  markdown += `---\n\n`

  for (const post of publishedPosts) {
    markdown += `# ${post.title || 'Untitled'}\n\n`

    if (post.subtitle) {
      markdown += `*${post.subtitle}*\n\n`
    }

    if (post.post_date) {
      markdown += `**Date:** ${format(new Date(post.post_date), 'MMMM d, yyyy')}\n`
    }
    markdown += `**Type:** ${post.type} | **Audience:** ${post.audience}\n\n`

    if (post.htmlContent) {
      markdown += htmlToText(post.htmlContent)
    }

    markdown += `\n\n---\n\n`
  }

  return markdown
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
    </div>
  )
}

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5']

export default function Dashboard({ result, onReset }: DashboardProps) {
  const { posts, subscriberStats, monthlyTrends, topPosts } = result

  const publishedPosts = posts.filter(p => p.is_published)
  const draftPosts = posts.filter(p => !p.is_published)

  // Prepare pie chart data for subscriber types
  const subscriberPieData = [
    { name: 'Free', value: subscriberStats.free },
    { name: 'Paid', value: subscriberStats.paid },
    { name: 'Inactive', value: subscriberStats.inactive },
    { name: 'Churned', value: subscriberStats.churned },
  ].filter(d => d.value > 0)

  // Format monthly trends for charts
  const chartData = monthlyTrends.slice(-12).map(trend => ({
    ...trend,
    monthLabel: format(new Date(trend.month + '-01'), 'MMM yy'),
  }))

  // Posts by type
  const postsByType: Record<string, number> = {}
  for (const post of posts) {
    postsByType[post.type] = (postsByType[post.type] || 0) + 1
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Substack Analyzer</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const markdown = generateMarkdown(posts)
                downloadMarkdown(markdown, 'substack-archive.md')
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Markdown
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Analyze Another
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Posts"
            value={posts.length}
            subtext={`${publishedPosts.length} published, ${draftPosts.length} drafts`}
          />
          <StatCard
            label="Total Subscribers"
            value={subscriberStats.total.toLocaleString()}
            subtext={`${subscriberStats.active.toLocaleString()} active`}
          />
          <StatCard
            label="Paid Subscribers"
            value={subscriberStats.paid.toLocaleString()}
            subtext={subscriberStats.total > 0 ? `${((subscriberStats.paid / subscriberStats.total) * 100).toFixed(1)}% conversion` : undefined}
          />
          <StatCard
            label="Free Subscribers"
            value={subscriberStats.free.toLocaleString()}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscriber Growth Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="subscribers"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Posts Per Month Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts Per Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="posts" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Subscriber Breakdown & Post Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscriber Breakdown */}
          {subscriberPieData.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subscriberPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {subscriberPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Post Types */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Types</h3>
            <div className="space-y-3">
              {Object.entries(postsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(count / posts.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-900 font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Posts Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Title</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Audience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topPosts.map((post) => (
                  <tr key={post.post_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate max-w-md">{post.title || 'Untitled'}</div>
                      {post.subtitle && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{post.subtitle}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.post_date ? format(new Date(post.post_date), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded capitalize">
                        {post.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{post.audience}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Stats */}
        {subscriberStats.churned > 0 && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Churn Alert</h3>
            <p className="text-amber-700">
              You have {subscriberStats.churned.toLocaleString()} churned subscribers (previously paid, now inactive).
              {subscriberStats.paid > 0 && (
                <span> That&apos;s a {((subscriberStats.churned / (subscriberStats.paid + subscriberStats.churned)) * 100).toFixed(1)}% historical churn rate.</span>
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
