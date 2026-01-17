export interface PostMetadata {
  post_id: string
  slug?: string
  post_date: string | null
  is_published: boolean
  email_sent_at: string | null
  type: string
  audience: string
  title: string
  subtitle: string
  htmlContent?: string
}

export interface Subscriber {
  email: string
  active_subscription: boolean
  expiry: string | null
  plan: string
  email_disabled: boolean
  created_at: string
  first_payment_at: string | null
}

export interface SubscriberStats {
  total: number
  active: number
  inactive: number
  paid: number
  free: number
  churned: number
  emailDisabled: number
  byPlan: Record<string, number>
  byMonth: Record<string, number>
}

export interface MonthlyTrend {
  month: string
  posts: number
  subscribers: number
}

export interface PostAttribution {
  post_id: string
  title: string
  post_date: string
  attributedTotal: number
  attributedPaid: number
  attributedFree: number
  avgDaysToSignup: number
}

export interface AttributionResult {
  windowDays: number
  postAttributions: PostAttribution[]
  organicSignups: number
  totalAttributed: number
  attributionCoverage: number
}

export interface AnalysisResult {
  posts: PostMetadata[]
  subscribers: Subscriber[]
  subscriberStats: SubscriberStats
  monthlyTrends: MonthlyTrend[]
  topPosts: PostMetadata[]
  attributionResults: AttributionResult[]
  analyticsData?: AnalyticsData
}

// Email open event from opens.csv
export interface OpenEvent {
  email: string
  timestamp: string
  country: string
  device_type: string
  client_type: string
}

// Per-post email performance metrics
export interface PostMetrics {
  post_id: string
  title: string
  post_date: string
  delivered: number
  uniqueOpens: number
  openRate: number
}

// Geographic statistics
export interface GeoStats {
  country: string
  opens: number
  percentage: number
}

// Time-based statistics
export interface TimeStats {
  hour: number
  dayOfWeek: number
  count: number
}

// Device/client statistics
export interface DeviceStats {
  device: string
  count: number
  [key: string]: string | number  // Index signature for Recharts compatibility
}

export interface ClientStats {
  client: string
  count: number
  [key: string]: string | number  // Index signature for Recharts compatibility
}

// Aggregated analytics data
export interface AnalyticsData {
  postMetrics: PostMetrics[]
  geoStats: GeoStats[]
  hourlyStats: number[]  // 24 slots (0-23 hours)
  dailyStats: number[]   // 7 slots (Sun=0 to Sat=6)
  deviceStats: DeviceStats[]
  clientStats: ClientStats[]
  totalOpens: number
  totalDelivered: number
}
