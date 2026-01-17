'use client'

import { useState } from 'react'
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
import type { AnalysisResult, PostMetadata, Subscriber, AttributionResult } from '@/lib/types'

interface DashboardProps {
  result: AnalysisResult
  onReset: () => void
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function generateSubscribersCSV(subscribers: Subscriber[]): string {
  if (subscribers.length === 0) return ''

  const headers = ['email', 'active_subscription', 'plan', 'created_at', 'first_payment_at', 'email_disabled', 'expiry']
  const rows = subscribers.map(sub => [
    sub.email,
    sub.active_subscription ? 'true' : 'false',
    sub.plan,
    sub.created_at,
    sub.first_payment_at || '',
    sub.email_disabled ? 'true' : 'false',
    sub.expiry || ''
  ])

  return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
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
    .filter(p => p.is_published)
    .sort((a, b) => {
      const dateA = a.post_date ? new Date(a.post_date).getTime() : 0
      const dateB = b.post_date ? new Date(b.post_date).getTime() : 0
      return dateA - dateB // Chronological order
    })

  const postsWithContent = publishedPosts.filter(p => p.htmlContent).length

  let markdown = `# Substack Archive\n\n`
  markdown += `Total Published Posts: ${publishedPosts.length}\n`
  markdown += `Posts with Content: ${postsWithContent}\n\n`
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
    } else {
      markdown += `*[No content available]*`
    }

    markdown += `\n\n---\n\n`
  }

  return markdown
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
  const { posts, subscribers, subscriberStats, monthlyTrends, topPosts, attributionResults } = result
  const [selectedWindow, setSelectedWindow] = useState(2) // Default to 7-day window (index 2)
  const [viewingPost, setViewingPost] = useState<PostMetadata | null>(null)

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
      {/* Post Viewer Modal */}
      {viewingPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingPost(null)}>
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingPost.title || 'Untitled'}</h2>
                {viewingPost.subtitle && (
                  <p className="text-gray-500 mt-1">{viewingPost.subtitle}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  {viewingPost.post_date && (
                    <span>{format(new Date(viewingPost.post_date), 'MMMM d, yyyy')}</span>
                  )}
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded capitalize">{viewingPost.type}</span>
                  <span className="capitalize">{viewingPost.audience}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingPost(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {viewingPost.htmlContent ? (
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingPost.htmlContent }}
                />
              ) : (
                <p className="text-gray-500 text-center py-12">No content available for this post</p>
              )}
            </div>
          </div>
        </div>
      )}

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
                if (markdown) {
                  downloadFile(markdown, 'substack-articles.md', 'text/markdown')
                } else {
                  alert('No published posts to export')
                }
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Articles (MD)
            </button>
            {subscribers.length > 0 && (
              <button
                onClick={() => {
                  const csv = generateSubscribersCSV(subscribers)
                  downloadFile(csv, 'substack-subscribers.csv', 'text/csv')
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Subscribers (CSV)
              </button>
            )}
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

        {/* Post Attribution Analysis */}
        {attributionResults && attributionResults.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Posts</h3>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {attributionResults.map((result, index) => (
                    <button
                      key={result.windowDays}
                      onClick={() => setSelectedWindow(index)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        selectedWindow === index
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {result.windowDays === 1 ? '1 Day' : `${result.windowDays} Days`}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Subscribers attributed to posts published within {attributionResults[selectedWindow].windowDays} day{attributionResults[selectedWindow].windowDays > 1 ? 's' : ''} before signup
              </p>
            </div>

            {/* Attribution Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {attributionResults[selectedWindow].totalAttributed.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Attributed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {attributionResults[selectedWindow].organicSignups.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Organic / Unknown</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {attributionResults[selectedWindow].attributionCoverage}%
                </p>
                <p className="text-sm text-gray-500">Coverage</p>
              </div>
            </div>

            {/* Top Posts Bar Chart */}
            {attributionResults[selectedWindow].postAttributions.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={attributionResults[selectedWindow].postAttributions.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={200}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.length > 30 ? value.slice(0, 30) + '...' : value}
                    />
                    <Tooltip
                      formatter={(value) => [Number(value).toLocaleString(), 'Subscribers']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="attributedTotal" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Attribution Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Post</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Paid</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Free</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Avg Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attributionResults[selectedWindow].postAttributions.slice(0, 20).map((post, index) => (
                    <tr key={post.post_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-400 w-6">{index + 1}</span>
                          <span className="font-medium text-gray-900 truncate max-w-md">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(post.post_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {post.attributedTotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {post.attributedPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {post.attributedFree.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {post.avgDaysToSignup}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attributionResults[selectedWindow].postAttributions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No posts attributed subscribers in this window
                </div>
              )}
            </div>
          </div>
        )}

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
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Action</th>
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
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewingPost(post)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          post.htmlContent
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!post.htmlContent}
                      >
                        View
                      </button>
                    </td>
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
