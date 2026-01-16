export interface Subscriber {
  email: string;
  active_subscription: boolean;
  expiry: string | null;
  plan: 'yearly' | 'monthly' | 'other' | 'founding' | string;
  email_disabled: boolean;
  created_at: string;
  first_payment_at: string | null;
}

export interface SubscriberSegment {
  all: Subscriber[];
  active: Subscriber[];
  paid: Subscriber[];
  free: Subscriber[];
  churned: Subscriber[];
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  paid: number;
  free: number;
  churned: number;
  emailDisabled: number;
  byPlan: Record<string, number>;
  byMonth: Record<string, number>;
}
