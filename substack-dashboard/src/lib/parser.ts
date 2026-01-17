import JSZip from 'jszip'
import Papa from 'papaparse'
import type { PostMetadata, Subscriber, SubscriberStats, MonthlyTrend, AnalysisResult, PostAttribution, AttributionResult, AnalyticsData, PostMetrics, GeoStats, DeviceStats, ClientStats } from './types'

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

interface RawOpenRow {
  email: string
  timestamp: string
  country: string
  device_type: string
  client_type: string
}

interface RawDeliverRow {
  email: string
  timestamp: string
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

function calculatePostAttributions(
  posts: PostMetadata[],
  subscribers: Subscriber[],
  windowDays: number
): AttributionResult {
  // Filter to published posts with dates, sorted by date descending (most recent first)
  const publishedPosts = posts
    .filter(p => p.is_published && p.post_date)
    .sort((a, b) => new Date(b.post_date!).getTime() - new Date(a.post_date!).getTime())

  // Initialize attribution tracking for each post
  const attributionMap = new Map<string, {
    post: PostMetadata
    total: number
    paid: number
    free: number
    daysTotals: number[]
  }>()

  for (const post of publishedPosts) {
    attributionMap.set(post.post_id, {
      post,
      total: 0,
      paid: 0,
      free: 0,
      daysTotals: [],
    })
  }

  const windowMs = windowDays * 24 * 60 * 60 * 1000
  let organicSignups = 0

  // Attribute each subscriber to a post
  for (const subscriber of subscribers) {
    if (!subscriber.created_at) {
      organicSignups++
      continue
    }

    const signupTime = new Date(subscriber.created_at).getTime()
    const isPaid = subscriber.first_payment_at !== null &&
                   ['yearly', 'monthly', 'founding'].includes(subscriber.plan)

    // Find the most recent post published within the window before signup
    let attributedPost: PostMetadata | null = null
    let daysToSignup = 0

    for (const post of publishedPosts) {
      const postTime = new Date(post.post_date!).getTime()

      // Post must be published before or on signup date, within window
      if (postTime <= signupTime && signupTime - postTime <= windowMs) {
        attributedPost = post
        daysToSignup = Math.floor((signupTime - postTime) / (24 * 60 * 60 * 1000))
        break // Most recent post wins (list is sorted descending)
      }
    }

    if (attributedPost) {
      const attr = attributionMap.get(attributedPost.post_id)!
      attr.total++
      if (isPaid) attr.paid++
      else attr.free++
      attr.daysTotals.push(daysToSignup)
    } else {
      organicSignups++
    }
  }

  // Build results array
  const postAttributions: PostAttribution[] = []
  for (const [postId, attr] of attributionMap.entries()) {
    if (attr.total > 0) {
      const avgDays = attr.daysTotals.length > 0
        ? attr.daysTotals.reduce((a, b) => a + b, 0) / attr.daysTotals.length
        : 0

      postAttributions.push({
        post_id: postId,
        title: attr.post.title,
        post_date: attr.post.post_date!,
        attributedTotal: attr.total,
        attributedPaid: attr.paid,
        attributedFree: attr.free,
        avgDaysToSignup: Math.round(avgDays * 10) / 10,
      })
    }
  }

  // Sort by total attributed descending
  postAttributions.sort((a, b) => b.attributedTotal - a.attributedTotal)

  const totalAttributed = postAttributions.reduce((sum, p) => sum + p.attributedTotal, 0)
  const totalSubscribers = subscribers.length

  return {
    windowDays,
    postAttributions,
    organicSignups,
    totalAttributed,
    attributionCoverage: totalSubscribers > 0
      ? Math.round((totalAttributed / totalSubscribers) * 1000) / 10
      : 0,
  }
}

function extractPostIdFromFilename(filename: string): string {
  // Extract post ID from filenames like "posts/123456.opens.csv" or "posts/123456.slug-name.opens.csv"
  const baseName = filename.split('/').pop() || ''
  const parts = baseName.split('.')
  return parts[0] // The numeric ID is always first
}

async function parseEmailMetrics(
  zip: JSZip,
  posts: PostMetadata[]
): Promise<AnalyticsData> {
  // Build a map of post_id -> post info for quick lookups
  const postMap = new Map<string, PostMetadata>()
  for (const post of posts) {
    postMap.set(post.post_id, post)
  }

  // Track opens and delivers per post
  const postOpens = new Map<string, Set<string>>() // post_id -> unique emails that opened
  const postDelivers = new Map<string, number>() // post_id -> delivery count

  // Global aggregates
  const countryOpens = new Map<string, number>()
  const hourlyOpens = new Array(24).fill(0)
  const dailyOpens = new Array(7).fill(0)
  const deviceOpens = new Map<string, number>()
  const clientOpens = new Map<string, number>()

  let totalOpens = 0

  // Find and process all opens.csv and delivers.csv files
  const allFiles = Object.entries(zip.files).filter(([, entry]) => !entry.dir)

  for (const [filename, zipEntry] of allFiles) {
    const normalizedPath = filename.replace(/\\/g, '/')
    const lowercasePath = normalizedPath.toLowerCase()

    // Parse opens.csv files
    if (lowercasePath.endsWith('.opens.csv')) {
      const postId = extractPostIdFromFilename(normalizedPath)
      const csvContent = await zipEntry.async('string')

      const result = Papa.parse<RawOpenRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
      })

      // Initialize set for unique opens for this post
      if (!postOpens.has(postId)) {
        postOpens.set(postId, new Set())
      }

      for (const row of result.data) {
        if (!row.email) continue

        // Track unique opens per post
        postOpens.get(postId)!.add(row.email)
        totalOpens++

        // Aggregate country data
        const country = row.country || 'Unknown'
        countryOpens.set(country, (countryOpens.get(country) || 0) + 1)

        // Aggregate time data
        if (row.timestamp) {
          try {
            const date = new Date(row.timestamp)
            const hour = date.getHours()
            const day = date.getDay() // 0 = Sunday
            hourlyOpens[hour]++
            dailyOpens[day]++
          } catch {
            // Skip invalid timestamps
          }
        }

        // Aggregate device data
        const device = row.device_type || 'Unknown'
        deviceOpens.set(device, (deviceOpens.get(device) || 0) + 1)

        // Aggregate client data
        const client = row.client_type || 'Unknown'
        clientOpens.set(client, (clientOpens.get(client) || 0) + 1)
      }

      console.log(`Parsed opens for post ${postId}: ${postOpens.get(postId)?.size || 0} unique opens`)
    }

    // Parse delivers.csv files
    if (lowercasePath.endsWith('.delivers.csv')) {
      const postId = extractPostIdFromFilename(normalizedPath)
      const csvContent = await zipEntry.async('string')

      const result = Papa.parse<RawDeliverRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
      })

      postDelivers.set(postId, result.data.length)
      console.log(`Parsed delivers for post ${postId}: ${result.data.length} delivered`)
    }
  }

  // Calculate per-post metrics
  const postMetrics: PostMetrics[] = []
  for (const [postId, uniqueEmails] of postOpens.entries()) {
    const post = postMap.get(postId)
    const delivered = postDelivers.get(postId) || 0
    const uniqueOpens = uniqueEmails.size
    const openRate = delivered > 0 ? (uniqueOpens / delivered) * 100 : 0

    postMetrics.push({
      post_id: postId,
      title: post?.title || 'Unknown Post',
      post_date: post?.post_date || '',
      delivered,
      uniqueOpens,
      openRate: Math.round(openRate * 10) / 10,
    })
  }

  // Sort by open rate descending
  postMetrics.sort((a, b) => b.openRate - a.openRate)

  // Calculate geographic stats
  const geoStats: GeoStats[] = []
  for (const [country, opens] of countryOpens.entries()) {
    geoStats.push({
      country,
      opens,
      percentage: totalOpens > 0 ? Math.round((opens / totalOpens) * 1000) / 10 : 0,
    })
  }
  geoStats.sort((a, b) => b.opens - a.opens)

  // Calculate device stats
  const deviceStats: DeviceStats[] = []
  for (const [device, count] of deviceOpens.entries()) {
    deviceStats.push({ device, count })
  }
  deviceStats.sort((a, b) => b.count - a.count)

  // Calculate client stats
  const clientStats: ClientStats[] = []
  for (const [client, count] of clientOpens.entries()) {
    clientStats.push({ client, count })
  }
  clientStats.sort((a, b) => b.count - a.count)

  // Calculate total delivered
  let totalDelivered = 0
  for (const count of postDelivers.values()) {
    totalDelivered += count
  }

  console.log(`Analytics summary: ${postMetrics.length} posts, ${totalOpens} opens, ${geoStats.length} countries`)

  return {
    postMetrics,
    geoStats,
    hourlyStats: hourlyOpens,
    dailyStats: dailyOpens,
    deviceStats,
    clientStats,
    totalOpens,
    totalDelivered,
  }
}

export async function parseSubstackZip(file: File): Promise<AnalysisResult> {
  const zip = await JSZip.loadAsync(file)

  // Find posts.csv and HTML files
  let postsCSV = ''
  let subscribersCSV = ''
  const htmlContents: Map<string, string> = new Map()

  // First pass: find all files and categorize them
  const allFiles = Object.entries(zip.files).filter(([, entry]) => !entry.dir)

  console.log('Files in zip:', allFiles.map(([name]) => name))

  for (const [filename, zipEntry] of allFiles) {
    const normalizedPath = filename.replace(/\\/g, '/')
    const lowercasePath = normalizedPath.toLowerCase()

    // Find posts.csv (could be at root or in a subfolder)
    if (lowercasePath.endsWith('posts.csv')) {
      postsCSV = await zipEntry.async('string')
      console.log('Found posts.csv at:', normalizedPath)
    }
    // Find email list CSV
    else if (lowercasePath.includes('email_list') && lowercasePath.endsWith('.csv')) {
      subscribersCSV = await zipEntry.async('string')
      console.log('Found email list at:', normalizedPath)
    }
    // Find HTML files - be more flexible about path structure
    else if (lowercasePath.endsWith('.html')) {
      const htmlFilename = normalizedPath.split('/').pop() || ''
      const { id } = parsePostId(htmlFilename.replace('.html', ''))
      const content = await zipEntry.async('string')
      htmlContents.set(id, content)
      console.log('Found HTML file:', htmlFilename, 'ID:', id, 'Size:', content.length)
    }
  }

  console.log('Total HTML files found:', htmlContents.size)
  console.log('HTML IDs:', Array.from(htmlContents.keys()).slice(0, 10))

  if (!postsCSV) {
    throw new Error('No posts.csv found in the zip file. Please upload a valid Substack export.')
  }

  // Parse posts
  let posts = parsePostsCSV(postsCSV)

  console.log('Posts from CSV:', posts.length)
  console.log('Sample post IDs from CSV:', posts.slice(0, 5).map(p => p.post_id))

  // Attach HTML content - try multiple matching strategies
  posts = posts.map(post => {
    // Try exact match first
    let content = htmlContents.get(post.post_id)

    // If no match, try to find by partial match
    if (!content) {
      for (const [htmlId, htmlContent] of htmlContents.entries()) {
        if (htmlId.startsWith(post.post_id) || post.post_id.startsWith(htmlId)) {
          content = htmlContent
          break
        }
      }
    }

    if (content) {
      console.log('Matched post:', post.post_id, 'Content size:', content.length)
    }

    return {
      ...post,
      htmlContent: content,
    }
  })

  const postsWithContent = posts.filter(p => p.htmlContent).length
  console.log('Posts with HTML content:', postsWithContent)

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

  // Calculate attribution for multiple windows
  const attributionResults = subscribers.length > 0
    ? [1, 2, 7].map(days => calculatePostAttributions(posts, subscribers, days))
    : []

  // Parse email metrics (opens.csv and delivers.csv)
  const analyticsData = await parseEmailMetrics(zip, posts)

  return {
    posts,
    subscribers,
    subscriberStats,
    monthlyTrends,
    topPosts,
    attributionResults,
    analyticsData,
  }
}
