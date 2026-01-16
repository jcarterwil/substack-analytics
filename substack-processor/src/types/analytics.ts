export interface OpenRecord {
  post_id: string;
  timestamp: string;
  email: string;
  post_type: string;
  post_audience: string;
  active_subscription: boolean;
  country: string;
  city: string;
  region: string;
  device_type: string;
  client_os: string;
  client_type: string;
  user_agent: string;
}

export interface DeliverRecord {
  post_id: string;
  timestamp: string;
  email: string;
  post_type: string;
  post_audience: string;
  active_subscription: boolean;
}

export interface PostAnalytics {
  postId: string;
  title: string;
  date: string | null;
  type: string;
  audience: string;
  delivered: number;
  opened: number;
  openRate: number;
  uniqueOpeners: number;
  countries: Record<string, number>;
  devices: Record<string, number>;
  clients: Record<string, number>;
}

export interface AggregateAnalytics {
  totalPosts: number;
  postsWithAnalytics: number;
  totalDelivered: number;
  totalOpened: number;
  averageOpenRate: number;
  topPostsByOpens: PostAnalytics[];
  topPostsByOpenRate: PostAnalytics[];
  countriesDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  clientDistribution: Record<string, number>;
  monthlyTrends: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  posts: number;
  delivered: number;
  opened: number;
  openRate: number;
  newSubscribers?: number;
}

export interface GrowthMetrics {
  subscribersByMonth: Record<string, number>;
  cumulativeGrowth: Array<{ date: string; total: number }>;
  churnRate: number;
  netGrowthRate: number;
}
