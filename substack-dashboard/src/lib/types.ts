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
}
