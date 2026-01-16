import JSZip from 'jszip'
import Papa from 'papaparse'
import type { PostMetadata, Subscriber, SubscriberStats, MonthlyTrend, AnalysisResult } from './types'

interface RawPostRow {
  post_id: string
  post_date: string
  is_published: string
  email_sent_at: string
  inbox_sent_at: string
  type: string
  audience: string
  title: string
  subtitle: string
}

interface RawSubscriberRow {
  email: string
  active_subscription: string
  expiry: string
  plan: string
  email_disabled: string
  created_at: string
  first_payment_at: string
}

function parsePostId(postIdField: string): { id: string; slug?: string } {
  const parts = postIdField.split('.')
  const id = parts[0]
  const slug = parts.slice(1).join('.') || undefined
  return { id, slug }
}

function parsePostsCSV(csvContent: string): PostMetadata[] {
  const result = Papa.parse<RawPostRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  return result.data.map(row => {
    const { id, slug } = parsePostId(row.post_id || '')
    return {
      post_id: id,
      slug,
      post_date: row.post_date || null,
      is_published: row.is_published === 'true',
      email_sent_at: row.email_sent_at || null,
      type: row.type || 'newsletter',
      audience: row.audience || 'everyone',
      title: row.title || '',
      subtitle: row.subtitle || '',
    }
  })
}

function parseSubscribersCSV(csvContent: string): Subscriber[] {
  const result = Papa.parse<RawSubscriberRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  return result.data.map(row => ({
    email: row.email || '',
    active_subscription: row.active_subscription === 'true',
    expiry: row.expiry || null,
    plan: row.plan || 'free',
    email_disabled: row.email_disabled === 'true',
    created_at: row.created_at || '',
    first_payment_at: row.first_payment_at || null,
  }))
}

function calculateSubscriberStats(subscribers: Subscriber[]): SubscriberStats {
  const isPaid = (s: Subscriber) =>
    s.first_payment_at !== null && ['yearly', 'monthly', 'founding'].includes(s.plan)

  const isActive = (s: Subscriber) => s.active_subscription && !s.email_disabled

  const isChurned = (s: Subscriber) => isPaid(s) && !s.active_subscription

  const byPlan: Record<string, number> = {}
  const byMonth: Record<string, number> = {}

  for (const sub of subscribers) {
    byPlan[sub.plan] = (byPlan[sub.plan] || 0) + 1

    if (sub.created_at) {
      const month = sub.created_at.substring(0, 7)
      byMonth[month] = (byMonth[month] || 0) + 1
    }
  }

  const active = subscribers.filter(isActive)
  const paid = subscribers.filter(s => isPaid(s) && isActive(s))
  const free = subscribers.filter(s => !isPaid(s) && isActive(s))
  const churned = subscribers.filter(isChurned)

  return {
    total: subscribers.length,
    active: active.length,
    inactive: subscribers.length - active.length,
    paid: paid.length,
    free: free.length,
    churned: churned.length,
    emailDisabled: subscribers.filter(s => s.email_disabled).length,
    byPlan,
    byMonth,
  }
}

function calculateMonthlyTrends(posts: PostMetadata[], stats: SubscriberStats): MonthlyTrend[] {
  const postsByMonth: Record<string, number> = {}

  for (const post of posts) {
    if (post.is_published && post.post_date) {
      const month = post.post_date.substring(0, 7)
      postsByMonth[month] = (postsByMonth[month] || 0) + 1
    }
  }

  // Combine all months from posts and subscribers
  const allMonths = new Set([...Object.keys(postsByMonth), ...Object.keys(stats.byMonth)])
  const sortedMonths = Array.from(allMonths).sort()

  // Calculate cumulative subscriber growth
  let cumulativeSubscribers = 0
  return sortedMonths.map(month => {
    cumulativeSubscribers += stats.byMonth[month] || 0
    return {
      month,
      posts: postsByMonth[month] || 0,
      subscribers: cumulativeSubscribers,
    }
  })
}

export async function parseSubstackZip(file: File): Promise<AnalysisResult> {
  const zip = await JSZip.loadAsync(file)

  // Find posts.csv
  let postsCSV = ''
  let subscribersCSV = ''
  const htmlContents: Map<string, string> = new Map()

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    const normalizedPath = filename.replace(/\\/g, '/')

    if (normalizedPath.endsWith('posts.csv')) {
      postsCSV = await zipEntry.async('string')
    } else if (normalizedPath.includes('email_list') && normalizedPath.endsWith('.csv')) {
      subscribersCSV = await zipEntry.async('string')
    } else if (normalizedPath.includes('/posts/') && normalizedPath.endsWith('.html')) {
      const htmlFilename = normalizedPath.split('/').pop() || ''
      const { id } = parsePostId(htmlFilename.replace('.html', ''))
      const content = await zipEntry.async('string')
      htmlContents.set(id, content)
    }
  }

  if (!postsCSV) {
    throw new Error('No posts.csv found in the zip file. Please upload a valid Substack export.')
  }

  // Parse posts
  let posts = parsePostsCSV(postsCSV)

  // Attach HTML content
  posts = posts.map(post => ({
    ...post,
    htmlContent: htmlContents.get(post.post_id),
  }))

  // Parse subscribers (may be empty if not included)
  const subscribers = subscribersCSV ? parseSubscribersCSV(subscribersCSV) : []
  const subscriberStats = calculateSubscriberStats(subscribers)

  // Calculate trends
  const monthlyTrends = calculateMonthlyTrends(posts, subscriberStats)

  // Get top posts (published, sorted by date)
  const topPosts = posts
    .filter(p => p.is_published)
    .sort((a, b) => {
      const dateA = a.post_date ? new Date(a.post_date).getTime() : 0
      const dateB = b.post_date ? new Date(b.post_date).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 10)

  return {
    posts,
    subscribers,
    subscriberStats,
    monthlyTrends,
    topPosts,
  }
}
